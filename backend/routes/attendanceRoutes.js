const express = require('express');
const { getGateLog, getAttendanceSummary } = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const staffOnly = authorize('stadium_admin', 'sport_commission_officer', 'gate_scanner_officer');

router.get('/log', authenticate, staffOnly, getGateLog);
router.get('/summary/:eventId', authenticate, staffOnly, getAttendanceSummary);

module.exports = router;
