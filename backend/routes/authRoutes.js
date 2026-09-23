const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp, loginUser, getUsers } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { authIpLimiter, authAccountLimiter, authenticatedLimiter } = require("../config/rateLimit");
const { validateBody } = require("../middleware/validate");
const schemas = require("../config/validationSchemas");

router.post("/send-otp",   authIpLimiter, authAccountLimiter, validateBody(schemas.authSendOtp,   { trim: true }), sendOtp);
router.post("/verify-otp", authIpLimiter, authAccountLimiter, validateBody(schemas.authVerifyOtp, { trim: true }), verifyOtp);
router.post("/login",      authIpLimiter, authAccountLimiter, validateBody(schemas.authLogin,     { trim: true }), loginUser);
router.get("/user",        protect, authenticatedLimiter, admin, getUsers);

module.exports = router;