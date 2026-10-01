const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { publicLimiter, authenticatedLimiter } = require('../config/rateLimit');
const { protect } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validate');
const schemas = require('../config/validationSchemas');
const router = express.Router();

router.post("/order",  protect, authenticatedLimiter, validateBody(schemas.paymentOrder),  createOrder);
// Requires a session: this endpoint validates a live Razorpay signature, and
// leaving it open turned it into a free signature-validation oracle.
router.post("/verify", protect, publicLimiter, validateBody(schemas.paymentVerify), verifyPayment);

module.exports = router;