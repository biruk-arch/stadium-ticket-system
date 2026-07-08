const pool = require('../config/db');

// Stadium Administrator: "Manages system user accounts and staff access
// controls" (CRC Table 11). Read-only listing; account creation is handled by
// authController.register (fans) and authController.createStaff (everyone else).
async function listUsers(req, res, next) {
  try {
    const { role } = req.query;
    let sql = 'SELECT user_id, full_name, email, phone, role, created_at FROM users';
    const params = [];
    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers };
