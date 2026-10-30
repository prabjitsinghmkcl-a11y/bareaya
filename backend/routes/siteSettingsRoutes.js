const express = require('express');
const { getSiteSettings, updateSiteSettings } = require('../controllers/siteSettingsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { publicLimiter, authenticatedLimiter } = require('../config/rateLimit');
const { validateBody } = require('../middleware/validate');
const schemas = require('../config/validationSchemas');
const router = express.Router();

router
  .route('/')
  .get(publicLimiter, getSiteSettings)
  .put(protect, authenticatedLimiter, admin, validateBody(schemas.siteSettingsUpdate, { trim: true }), updateSiteSettings);

module.exports = router;
