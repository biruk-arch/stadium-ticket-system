const express = require('express');
const { register, createStaff, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);                                     // Use Case: Register Account (Fan)
router.post('/login', login);                                           // Use Case: User Login
router.post('/staff', authenticate, authorize('stadium_admin'), createStaff);
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);                         // FR-1.2

module.exports = router;
