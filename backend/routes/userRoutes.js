const express = require('express');
const { listUsers } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('stadium_admin'), listUsers);

module.exports = router;
