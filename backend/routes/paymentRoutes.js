const express = require('express');
const { makePayment, listPaymentsForReservation } = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, authorize('fan', 'box_office_staff'), makePayment);  // Table 4
router.get('/reservation/:reservationId', authenticate, listPaymentsForReservation);

module.exports = router;
