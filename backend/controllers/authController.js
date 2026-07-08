const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { userId: user.user_id, role: user.role, fullName: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function publicUser(user) {
  return {
    userId: user.user_id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
}

// FR-1.1 (part 1): fan self-registration. Staff accounts are provisioned by an admin
// via POST /api/auth/staff instead, since the use case "Register Account" is Fan-only.
async function register(req, res, next) {
  try {
    const { fullName, email, phone, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, "fan")',
      [fullName, email, phone || null, hashed]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
    const user = rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// Admin-only: create Box Office Staff, Gate Scanner Officer, Stadium Admin, or
// Sport Commission Officer accounts.
async function createStaff(req, res, next) {
  try {
    const { fullName, email, phone, password, role } = req.body;
    const validRoles = ['box_office_staff', 'gate_scanner_officer', 'stadium_admin', 'sport_commission_officer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}` });
    }
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email and password are required.' });
    }
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, phone || null, hashed, role]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
    res.status(201).json({ user: publicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

// Use Case "User Login" -- shared by all five actor types.
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

// FR-1.2: logged-in users can update email, phone and password.
async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, password } = req.body;
    const fields = [];
    const values = [];
    if (fullName) { fields.push('full_name = ?'); values.push(fullName); }
    if (phone) { fields.push('phone = ?'); values.push(phone); }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }
      fields.push('password = ?');
      values.push(await bcrypt.hash(password, 10));
    }
    if (!fields.length) {
      return res.status(400).json({ message: 'Nothing to update.' });
    }
    values.push(req.user.userId);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId]);
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, createStaff, login, getProfile, updateProfile };
