const pool = require('../config/db');
const { generateTicketCode } = require('../utils/qrcode');

// NOTE ON PAYMENT METHODS: the thesis schema (Table 23) models Telebirr and CBE
// Birr only, since FR-2.3 is about the fan-facing digital reservation flow. The
// CRC card for Box Office Staff (Table 9) also names cash walk-in sales, so
// "cash" is added here as a third method for that in-person path.
const VALID_METHODS = ['telebirr', 'cbe_birr', 'cash'];

// Use Case "Make Payment" (Table 4, FR-2.3/FR-2.4).
// This does not call a real Telebirr/CBE Birr gateway -- there is no sandbox
// this project has credentials for. It records and verifies the transaction the
// way the thesis describes: the fan (or box office staff) supplies the
// reference number their payment app/receipt gave them, and the system logs it
// against the reservation. Swapping in a real gateway call would slot in here.
async function makePayment(req, res, next) {
  const { reservationId, paymentMethod, referenceNumber } = req.body;
  if (!reservationId || !paymentMethod) {
    return res.status(400).json({ message: 'reservationId and paymentMethod are required.' });
  }
  if (!VALID_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: `paymentMethod must be one of: ${VALID_METHODS.join(', ')}` });
  }
  if (paymentMethod !== 'cash' && !referenceNumber) {
    return res.status(400).json({ message: 'A transaction reference number is required for digital payments.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [resRows] = await conn.query(
      `SELECT r.*, s.price, s.status AS seat_status, s.lock_expires_at
       FROM reservations r JOIN seats s ON s.seat_id = r.seat_id
       WHERE r.reservation_id = ? FOR UPDATE`,
      [reservationId]
    );
    if (!resRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Reservation not found.' });
    }
    const reservation = resRows[0];

    const isOwner = reservation.user_id === req.user.userId;
    const isStaff = ['box_office_staff', 'stadium_admin'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      await conn.rollback();
      return res.status(403).json({ message: 'You do not have permission to pay for this reservation.' });
    }
    if (reservation.status !== 'pending') {
      await conn.rollback();
      return res.status(409).json({ message: `This reservation is ${reservation.status} and can no longer be paid for.` });
    }
    const lockActive = reservation.seat_status === 'locked'
      && reservation.lock_expires_at
      && new Date(reservation.lock_expires_at) > new Date();
    if (!lockActive) {
      // Alternative Flow (Table 4): "Payment transaction fails" -- here because
      // the seat hold timed out before the fan finished paying.
      await conn.query('UPDATE reservations SET status = "expired" WHERE reservation_id = ?', [reservationId]);
      await conn.query('UPDATE seats SET status = "available", lock_expires_at = NULL WHERE seat_id = ?', [reservation.seat_id]);
      await conn.commit();
      return res.status(410).json({ message: 'Your seat hold has expired. Please reserve the seat again.' });
    }

    const amount = reservation.price;
    const [payResult] = await conn.query(
      `INSERT INTO payments (reservation_id, amount, payment_method, reference_number, status)
       VALUES (?, ?, ?, ?, "success")`,
      [reservationId, amount, paymentMethod, referenceNumber || `CASH-${Date.now()}`]
    );

    await conn.query('UPDATE reservations SET status = "confirmed" WHERE reservation_id = ?', [reservationId]);
    await conn.query('UPDATE seats SET status = "reserved", lock_expires_at = NULL WHERE seat_id = ?', [reservation.seat_id]);

    // FR-2.4: render an e-ticket with an embedded QR code immediately upon settlement.
    const qrCode = generateTicketCode(reservationId);
    const [ticketResult] = await conn.query(
      'INSERT INTO tickets (reservation_id, qr_code, ticket_status) VALUES (?, ?, "active")',
      [reservationId, qrCode]
    );

    await conn.commit();

    const [paymentRows] = await pool.query('SELECT * FROM payments WHERE payment_id = ?', [payResult.insertId]);
    const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketResult.insertId]);

    res.status(201).json({ payment: paymentRows[0], ticket: ticketRows[0] });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function listPaymentsForReservation(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM payments WHERE reservation_id = ?', [req.params.reservationId]);
    res.json({ payments: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { makePayment, listPaymentsForReservation };
