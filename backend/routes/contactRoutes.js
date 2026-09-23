const express = require('express');
const { sendContactMessage } = require('../controllers/contactController');
const { publicLimiter } = require('../config/rateLimit');
const { validateBody } = require('../middleware/validate');
const schemas = require('../config/validationSchemas');
const router = express.Router();

router.post('/', publicLimiter, validateBody(schemas.contactCreate, { trim: true }), sendContactMessage);

module.exports = router;