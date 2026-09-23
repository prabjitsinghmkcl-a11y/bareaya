const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { publicLimiter, authenticatedLimiter } = require('../config/rateLimit');
const { protect } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validate');
const schemas = require('../config/validationSchemas');
const router = express.Router();

router.post("/order",  protect, authenticatedLimiter, validateBody(schemas.paymentOrder),  createOrder);
router.post("/verify", publicLimiter, validateBody(schemas.paymentVerify), verifyPayment);

module.exports = router;