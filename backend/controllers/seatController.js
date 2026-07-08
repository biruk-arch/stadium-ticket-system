const pool = require('../config/db');

// FR-2.1: real-time interactive stadium layout of open/occupied seats.
// A seat that was locked (someone started paying) but whose lock has expired is
// treated as available again here, and is also lazily released in the DB.
async function listSeatsForEvent(req, res, next) {
  try {
    const { eventId } = req.params;
    await pool.query(
      `UPDATE seats SET status = 'available', lock_expires_at = NULL
       WHERE event_id = ? AND status = 'locked' AND lock_expires_at < NOW()`,
      [eventId]
    );
    const [seats] = await pool.query(
      'SELECT seat_id, section, seat_number, price, status FROM seats WHERE event_id = ? ORDER BY section, seat_number',
      [eventId]
    );
    res.json({ seats });
  } catch (err) {
    next(err);
  }
}

// Stadium Administrator: generate a block of seats for a section, e.g. VIP A1..A10.
async function bulkCreateSeats(req, res, next) {
  try {
    const { eventId } = req.params;
    const { section, rows, seatsPerRow, price } = req.body;
    if (!section || !rows || !seatsPerRow || price === undefined) {
      return res.status(400).json({ message: 'section, rows, seatsPerRow and price are required.' });
    }
    const [eventRows] = await pool.query('SELECT event_id FROM events WHERE event_id = ?', [eventId]);
    if (!eventRows.length) return res.status(404).json({ message: 'Event not found.' });

    const values = [];
    for (let r = 1; r <= rows; r++) {
      const rowLetter = String.fromCharCode(64 + r);
      for (let s = 1; s <= seatsPerRow; s++) {
        values.push([eventId, section, `${rowLetter}${s}`, price]);
      }
    }
    await pool.query(
      'INSERT IGNORE INTO seats (event_id, section, seat_number, price) VALUES ?',
      [values]
    );
    const [seats] = await pool.query(
      'SELECT seat_id, section, seat_number, price, status FROM seats WHERE event_id = ? ORDER BY section, seat_number',
      [eventId]
    );
    res.status(201).json({ seats });
  } catch (err) {
    next(err);
  }
}

// Stadium Administrator: block/unblock a specific seat (e.g. for maintenance).
async function updateSeatStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['available', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'status must be "available" or "blocked".' });
    }
    const [result] = await pool.query(
      'UPDATE seats SET status = ?, lock_expires_at = NULL WHERE seat_id = ? AND status != "reserved"',
      [status, req.params.seatId]
    );
    if (!result.affectedRows) {
      return res.status(409).json({ message: 'Seat could not be updated (it may already be reserved).' });
    }
    res.json({ message: 'Seat updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSeatsForEvent, bulkCreateSeats, updateSeatStatus };
