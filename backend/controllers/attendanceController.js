const pool = require('../config/db');

// FR-4.2: "live gate logs" for Stadium Administrators and the Sport Commission.
async function getGateLog(req, res, next) {
  try {
    const { eventId, limit } = req.query;
    let sql = `
      SELECT a.attendance_id, a.entry_time, a.status,
             t.ticket_id, t.qr_code,
             e.event_id, e.event_name,
             s.section, s.seat_number,
             u.full_name AS fan_name
      FROM attendance a
      JOIN tickets t ON t.ticket_id = a.ticket_id
      JOIN reservations r ON r.reservation_id = t.reservation_id
      JOIN events e ON e.event_id = r.event_id
      JOIN seats s ON s.seat_id = r.seat_id
      JOIN users u ON u.user_id = r.user_id
    `;
    const params = [];
    if (eventId) {
      sql += ' WHERE e.event_id = ? ';
      params.push(eventId);
    }
    sql += ' ORDER BY a.entry_time DESC LIMIT ?';
    params.push(Number(limit) || 50);
    const [rows] = await pool.query(sql, params);
    res.json({ log: rows });
  } catch (err) {
    next(err);
  }
}

// Quick tallies for a live dashboard widget: entries vs denied re-entries for an event.
async function getAttendanceSummary(req, res, next) {
  try {
    const { eventId } = req.params;
    const [[totals]] = await pool.query(
      `SELECT
         SUM(CASE WHEN a.status = 'entered' THEN 1 ELSE 0 END) AS entered_count,
         SUM(CASE WHEN a.status = 'denied' THEN 1 ELSE 0 END) AS denied_count
       FROM attendance a
       JOIN tickets t ON t.ticket_id = a.ticket_id
       JOIN reservations r ON r.reservation_id = t.reservation_id
       WHERE r.event_id = ?`,
      [eventId]
    );
    const [[ticketsSold]] = await pool.query(
      `SELECT COUNT(*) AS sold FROM tickets t
       JOIN reservations r ON r.reservation_id = t.reservation_id
       WHERE r.event_id = ?`,
      [eventId]
    );
    res.json({
      entered: Number(totals.entered_count) || 0,
      denied: Number(totals.denied_count) || 0,
      ticketsSold: Number(ticketsSold.sold) || 0
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getGateLog, getAttendanceSummary };
