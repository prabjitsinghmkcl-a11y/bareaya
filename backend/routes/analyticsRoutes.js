const express = require('express');
const { getAdminStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { authenticatedLimiter } = require('../config/rateLimit');

const router = express.Router();

router.get('/', protect, authenticatedLimiter, admin, getAdminStats);

module.exports = router;