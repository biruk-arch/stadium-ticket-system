const express = require('express');
const { listSeatsForEvent, bulkCreateSeats, updateSeatStatus } = require('../controllers/seatController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/events/:eventId/seats', authenticate, listSeatsForEvent);                             // FR-2.1
router.post('/events/:eventId/seats', authenticate, authorize('stadium_admin'), bulkCreateSeats);  // FR-4.1 zone pricing
router.patch('/seats/:seatId', authenticate, authorize('stadium_admin'), updateSeatStatus);

module.exports = router;
