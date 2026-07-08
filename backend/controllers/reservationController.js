const pool = require('../config/db');

const LOCK_MINUTES = Number(process.env.SEAT_LOCK_MINUTES || 10);

// Use Case "Reserve Ticket" (Table 3, FR-2.1/FR-2.2).
// Locks the seat for LOCK_MINUTES while the fan moves on to the payment step.
// If payment never completes in time, the hold is released lazily (see
// seatController.listSeatsForEvent and the expiry check in makePayment below)
// rather than needing a separate background job.
async function createReservation(req, res, next) {
  const { eventId, seatId } = req.body;
  if (!eventId || !seatId) {
    return res.status(400).json({ message: 'eventId and seatId are required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [eventRows] = await conn.query('SELECT * FROM events WHERE event_id = ? FOR UPDATE', [eventId]);
    if (!eventRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Event not found.' });
    }
    if (eventRows[0].status !== 'scheduled') {
      await conn.rollback();
      return res.status(409).json({ message: 'This event is not open for reservations.' });
    }

    // Row-lock the seat so two concurrent requests can't both grab it
    // (Reliability NFR: "prevent duplicate seat reservations").
    const [seatRows] = await conn.query(
      'SELECT * FROM seats WHERE seat_id = ? AND event_id = ? FOR UPDATE',
      [seatId, eventId]
    );
    if (!seatRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Seat not found for this event.' });
    }
    const seat = seatRows[0];
    const stillLocked = seat.status === 'locked' && seat.lock_expires_at && new Date(seat.lock_expires_at) > new Date();
    if (seat.status === 'reserved' || stillLocked) {
      // Alternative Flow (Table 3): "Selected seat is already reserved."
      await conn.rollback();
      return res.status(409).json({ message: 'Selected seat is already reserved.' });
    }
    if (seat.status === 'blocked') {
      await conn.rollback();
      return res.status(409).json({ message: 'This seat is blocked and cannot be reserved.' });
    }

    const lockExpiresAt = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
    await conn.query('UPDATE seats SET status = "locked", lock_expires_at = ? WHERE seat_id = ?', [lockExpiresAt, seatId]);

    // A box office sale is still keyed to the staff member's own user_id -- the
    // schema (Table 22) has no separate walk-in-customer table, so the staff
    // account is the reservation owner and hands the fan a printed/QR ticket.
    const createdByRole = req.user.role === 'box_office_staff' ? 'box_office_staff' : 'fan';
    const [result] = await conn.query(
      'INSERT INTO reservations (user_id, event_id, seat_id, status, created_by_role) VALUES (?, ?, ?, "pending", ?)',
      [req.user.userId, eventId, seatId, createdByRole]
    );

    await conn.commit();

    const [rows] = await pool.query(
      `SELECT r.*, s.section, s.seat_number, s.price, e.event_name, e.event_date
       FROM reservations r
       JOIN seats s ON s.seat_id = r.seat_id
       JOIN events e ON e.event_id = r.event_id
       WHERE r.reservation_id = ?`,
      [result.insertId]
    );
    res.status(201).json({ reservation: rows[0], lockExpiresAt, lockMinutes: LOCK_MINUTES });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// Fan: "my reservations", including derived ticket status for the UI.
async function listMyReservations(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, s.section, s.seat_number, s.price, e.event_name, e.event_date, e.venue,
              t.ticket_id, t.ticket_status
       FROM reservations r
       JOIN seats s ON s.seat_id = r.seat_id
       JOIN events e ON e.event_id = r.event_id
       LEFT JOIN tickets t ON t.reservation_id = r.reservation_id
       WHERE r.user_id = ?
       ORDER BY r.reservation_date DESC`,
      [req.user.userId]
    );
    res.json({ reservations: rows });
  } catch (err) {
    next(err);
  }
}

async function getReservation(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, s.section, s.seat_number, s.price, s.status AS seat_status, s.lock_expires_at,
              e.event_name, e.event_date, e.venue
       FROM reservations r
       JOIN seats s ON s.seat_id = r.seat_id
       JOIN events e ON e.event_id = r.event_id
       WHERE r.reservation_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Reservation not found.' });
    const reservation = rows[0];
    const isOwner = reservation.user_id === req.user.userId;
    const isStaff = ['box_office_staff', 'stadium_admin'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'You do not have permission to view this reservation.' });
    }
    res.json({ reservation });
  } catch (err) {
    next(err);
  }
}

// Lets a fan release a hold they no longer want, freeing the seat immediately
// instead of waiting for the lock to time out.
async function cancelReservation(req, res, next) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM reservations WHERE reservation_id = ? FOR UPDATE', [req.params.id]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Reservation not found.' });
    }
    const reservation = rows[0];
    if (reservation.user_id !== req.user.userId && req.user.role !== 'stadium_admin') {
      await conn.rollback();
      return res.status(403).json({ message: 'You do not have permission to cancel this reservation.' });
    }
    if (reservation.status !== 'pending') {
      await conn.rollback();
      return res.status(409).json({ message: 'Only pending reservations can be cancelled.' });
    }
    await conn.query('UPDATE reservations SET status = "cancelled" WHERE reservation_id = ?', [req.params.id]);
    await conn.query('UPDATE seats SET status = "available", lock_expires_at = NULL WHERE seat_id = ?', [reservation.seat_id]);
    await conn.commit();
    res.json({ message: 'Reservation cancelled and seat released.' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { createReservation, listMyReservations, getReservation, cancelReservation };
