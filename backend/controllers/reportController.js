const pool = require('../config/db');

// Use Case "Generate Report" (Table 7). FR-4.2: "consolidated financial audits"
// for Stadium Administrators and the Dire Dawa Sport Commission.
async function getSalesReport(req, res, next) {
  try {
    const { eventId, from, to } = req.query;
    const params = [];
    let where = ' WHERE p.status = "success" ';
    if (eventId) { where += ' AND r.event_id = ? '; params.push(eventId); }
    if (from) { where += ' AND p.payment_date >= ? '; params.push(from); }
    if (to) { where += ' AND p.payment_date <= ? '; params.push(to); }

    const [byEvent] = await pool.query(
      `SELECT e.event_id, e.event_name, e.event_date,
              COUNT(p.payment_id) AS tickets_sold,
              SUM(p.amount) AS revenue
       FROM payments p
       JOIN reservations r ON r.reservation_id = p.reservation_id
       JOIN events e ON e.event_id = r.event_id
       ${where}
       GROUP BY e.event_id
       ORDER BY e.event_date DESC`,
      params
    );

    const [byMethod] = await pool.query(
      `SELECT p.payment_method, COUNT(*) AS count, SUM(p.amount) AS revenue
       FROM payments p JOIN reservations r ON r.reservation_id = p.reservation_id
       ${where}
       GROUP BY p.payment_method`,
      params
    );

    const [[overall]] = await pool.query(
      `SELECT COUNT(*) AS tickets_sold, COALESCE(SUM(p.amount), 0) AS total_revenue
       FROM payments p JOIN reservations r ON r.reservation_id = p.reservation_id
       ${where}`,
      params
    );

    res.json({ overall, byEvent, byMethod });
  } catch (err) {
    next(err);
  }
}

// Dashboard summary cards for the admin / commission landing page.
async function getDashboardSummary(req, res, next) {
  try {
    const [[events]] = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS upcoming
       FROM events`
    );
    const [[revenue]] = await pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'success'`);
    const [[tickets]] = await pool.query(`SELECT COUNT(*) AS total FROM tickets`);
    const [[attendanceToday]] = await pool.query(
      `SELECT COUNT(*) AS total FROM attendance WHERE status = 'entered' AND DATE(entry_time) = CURDATE()`
    );
    res.json({
      totalEvents: events.total,
      upcomingEvents: events.upcoming || 0,
      totalRevenue: revenue.total,
      ticketsIssued: tickets.total,
      attendanceToday: attendanceToday.total
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSalesReport, getDashboardSummary };
