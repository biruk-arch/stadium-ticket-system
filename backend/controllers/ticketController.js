const pool = require('../config/db');
const { generateQrImage } = require('../utils/qrcode');

// Fan: "My Tickets" -- every ticket issued against the fan's own reservations,
// each rendered as a scannable QR image.
async function listMyTickets(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, r.event_id, r.seat_id, e.event_name, e.event_date, e.venue,
              s.section, s.seat_number, s.price
       FROM tickets t
       JOIN reservations r ON r.reservation_id = t.reservation_id
       JOIN events e ON e.event_id = r.event_id
       JOIN seats s ON s.seat_id = r.seat_id
       WHERE r.user_id = ?
       ORDER BY t.issued_at DESC`,
      [req.user.userId]
    );
    const tickets = await Promise.all(rows.map(async (t) => ({ ...t, qrImage: await generateQrImage(t.qr_code) })));
    res.json({ tickets });
  } catch (err) {
    next(err);
  }
}

async function getTicket(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, r.user_id, r.event_id, r.seat_id, e.event_name, e.event_date, e.venue,
              s.section, s.seat_number, s.price
       FROM tickets t
       JOIN reservations r ON r.reservation_id = t.reservation_id
       JOIN events e ON e.event_id = r.event_id
       JOIN seats s ON s.seat_id = r.seat_id
       WHERE t.ticket_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Ticket not found.' });
    const ticket = rows[0];
    const isOwner = ticket.user_id === req.user.userId;
    const isStaff = ['box_office_staff', 'stadium_admin', 'gate_scanner_officer'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ message: 'You do not have permission to view this ticket.' });
    const qrImage = await generateQrImage(ticket.qr_code);
    res.json({ ticket: { ...ticket, qrImage } });
  } catch (err) {
    next(err);
  }
}

// Use Case "Validate Ticket" (Table 5). Actor: Gate Scanner Officer.
// FR-3.1: decode and check e-ticket QR validity. FR-3.2: instantly flag
// duplicate tickets and flip status to "Scanned" on first valid entry.
async function validateTicket(req, res, next) {
  const { qrCode } = req.body;
  if (!qrCode) return res.status(400).json({ message: 'qrCode is required.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT t.*, r.event_id, r.seat_id, r.user_id, e.event_name, s.section, s.seat_number,
              u.full_name AS fan_name
       FROM tickets t
       JOIN reservations r ON r.reservation_id = t.reservation_id
       JOIN events e ON e.event_id = r.event_id
       JOIN seats s ON s.seat_id = r.seat_id
       JOIN users u ON u.user_id = r.user_id
       WHERE t.qr_code = ? FOR UPDATE`,
      [qrCode]
    );

    if (!rows.length) {
      await conn.rollback();
      // No ticket_id exists to attach an attendance row to -- an unrecognized
      // code is rejected without writing to the attendance log.
      return res.status(404).json({ valid: false, message: 'Ticket not recognized.' });
    }

    const ticket = rows[0];

    if (ticket.ticket_status !== 'active') {
      // Alternative Flow (Table 5): "Invalid or already used ticket." -- log the
      // attempted re-entry for the gate log / audit trail.
      await conn.query('INSERT INTO attendance (ticket_id, status) VALUES (?, "denied")', [ticket.ticket_id]);
      await conn.commit();
      const reason = ticket.ticket_status === 'scanned'
        ? 'This ticket has already been used.'
        : `This ticket is ${ticket.ticket_status}.`;
      return res.status(409).json({ valid: false, message: reason, ticket });
    }

    await conn.query('UPDATE tickets SET ticket_status = "scanned" WHERE ticket_id = ?', [ticket.ticket_id]);
    const [attendanceResult] = await conn.query('INSERT INTO attendance (ticket_id, status) VALUES (?, "entered")', [ticket.ticket_id]);
    await conn.commit();

    const [attendanceRows] = await pool.query('SELECT * FROM attendance WHERE attendance_id = ?', [attendanceResult.insertId]);
    res.json({
      valid: true,
      message: 'Entry granted.',
      ticket: { ...ticket, ticket_status: 'scanned' },
      attendance: attendanceRows[0]
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { listMyTickets, getTicket, validateTicket };
