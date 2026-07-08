const pool = require('../config/db');

// Any authenticated user can browse events (fans need this to reserve tickets).
async function listEvents(req, res, next) {
  try {
    const { status } = req.query;
    let sql = `
      SELECT e.*,
        COUNT(s.seat_id) AS total_seats,
        SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) AS available_seats
      FROM events e
      LEFT JOIN seats s ON s.event_id = e.event_id
    `;
    const params = [];
    if (status) {
      sql += ' WHERE e.status = ? ';
      params.push(status);
    }
    sql += ' GROUP BY e.event_id ORDER BY e.event_date ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ events: rows });
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Event not found.' });

    const [sections] = await pool.query(
      `SELECT section, price, COUNT(*) AS total,
              SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available
       FROM seats WHERE event_id = ? GROUP BY section, price`,
      [req.params.id]
    );
    res.json({ event: rows[0], sections });
  } catch (err) {
    next(err);
  }
}

// Stadium Administrator only (FR-4.1: create/update/manage match logistics).
async function createEvent(req, res, next) {
  try {
    const { eventName, homeTeam, awayTeam, eventDate, venue } = req.body;
    if (!eventName || !eventDate) {
      return res.status(400).json({ message: 'Event name and date are required.' });
    }
    const [result] = await pool.query(
      'INSERT INTO events (event_name, home_team, away_team, event_date, venue, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [eventName, homeTeam || null, awayTeam || null, eventDate, venue || 'Dire Dawa Stadium', req.user.userId]
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [result.insertId]);
    res.status(201).json({ event: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const { eventName, homeTeam, awayTeam, eventDate, venue, status } = req.body;
    const fields = [];
    const values = [];
    if (eventName) { fields.push('event_name = ?'); values.push(eventName); }
    if (homeTeam !== undefined) { fields.push('home_team = ?'); values.push(homeTeam); }
    if (awayTeam !== undefined) { fields.push('away_team = ?'); values.push(awayTeam); }
    if (eventDate) { fields.push('event_date = ?'); values.push(eventDate); }
    if (venue) { fields.push('venue = ?'); values.push(venue); }
    if (status) { fields.push('status = ?'); values.push(status); }
    if (!fields.length) return res.status(400).json({ message: 'Nothing to update.' });
    values.push(req.params.id);
    await pool.query(`UPDATE events SET ${fields.join(', ')} WHERE event_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Event not found.' });
    res.json({ event: rows[0] });
  } catch (err) {
    next(err);
  }
}

// "Delete event if necessary" (Table 6) -- implemented as cancellation so historical
// reservations/tickets/reports referencing the event remain intact.
async function deleteEvent(req, res, next) {
  try {
    const [result] = await pool.query('UPDATE events SET status = "cancelled" WHERE event_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Event not found.' });
    res.json({ message: 'Event cancelled.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent };
