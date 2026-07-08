const express = require('express');
const { listEvents, getEvent, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, listEvents);
router.get('/:id', authenticate, getEvent);
router.post('/', authenticate, authorize('stadium_admin'), createEvent);       // FR-4.1
router.put('/:id', authenticate, authorize('stadium_admin'), updateEvent);
router.delete('/:id', authenticate, authorize('stadium_admin'), deleteEvent);  // Table 6: "Delete event if necessary"

module.exports = router;
