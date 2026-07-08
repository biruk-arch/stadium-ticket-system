const express = require('express');
const {
  createReservation, listMyReservations, getReservation, cancelReservation
} = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, authorize('fan', 'box_office_staff'), createReservation);  // Table 3
router.get('/mine', authenticate, listMyReservations);
router.get('/:id', authenticate, getReservation);
router.post('/:id/cancel', authenticate, cancelReservation);

module.exports = router;
