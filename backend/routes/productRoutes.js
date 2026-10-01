const express = require("express");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { getProducts, createProduct, getProductById, updateProduct, deleteProduct } = require("../controllers/productController");
const { publicLimiter, authenticatedLimiter } = require("../config/rateLimit");
const { validateBody, validateParams, discardOrphanUpload } = require("../middleware/validate");
const schemas = require("../config/validationSchemas");
const multer = require("multer");
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const upload = multer({
  // Absolute path derived from __dirname. A bare "uploads/" is resolved against
  // the process CWD, which disagrees with the express.static mount in index.js
  // whenever the app is started from somewhere other than ./backend (PM2 cwd).
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(null, true);
    }
    const err = new Error('Only JPG, PNG, WEBP or GIF images are allowed');
    err.status = 400;
    cb(err);
  },
});


const router = express.Router();
//all products
router.route("/")
  .get(publicLimiter, getProducts)
  .post(protect, authenticatedLimiter, admin, upload.single("image"), validateBody(schemas.productCreate), discardOrphanUpload, createProduct);
//specific product
router.route("/:id")
  .get(validateParams(schemas.productParamId), publicLimiter, getProductById)
  .put(validateParams(schemas.productParamId), protect, authenticatedLimiter, admin, upload.single("image"), validateBody(schemas.productUpdate), discardOrphanUpload, updateProduct)
  .delete(validateParams(schemas.productParamId), protect, authenticatedLimiter, admin, deleteProduct);

module.exports = router;