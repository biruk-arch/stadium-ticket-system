const express = require('express');
const { getSalesReport, getDashboardSummary } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const reportViewers = authorize('stadium_admin', 'sport_commission_officer');

router.get('/sales', authenticate, reportViewers, getSalesReport);   // Table 7: Generate Report
router.get('/summary', authenticate, reportViewers, getDashboardSummary);

module.exports = router;
