const express = require('express');
const { listMyTickets, getTicket, validateTicket } = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', authenticate, listMyTickets);
router.get('/:id', authenticate, getTicket);
router.post('/validate', authenticate, authorize('gate_scanner_officer', 'stadium_admin'), validateTicket); // Table 5

module.exports = router;
