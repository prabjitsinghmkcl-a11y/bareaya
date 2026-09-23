const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { getProducts, createProduct, getProductById, updateProduct, deleteProduct } = require("../controllers/productController");
const { publicLimiter, authenticatedLimiter } = require("../config/rateLimit");
const { validateBody, validateParams } = require("../middleware/validate");
const schemas = require("../config/validationSchemas");
const multer = require("multer");
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const upload = multer({
  dest: "uploads/",
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
  .post(protect, authenticatedLimiter, admin, upload.single("image"), validateBody(schemas.productCreate), createProduct);
//specific product
router.route("/:id")
  .get(validateParams(schemas.productParamId), publicLimiter, getProductById)
  .put(validateParams(schemas.productParamId), protect, authenticatedLimiter, admin, upload.single("image"), validateBody(schemas.productUpdate), updateProduct)
  .delete(validateParams(schemas.productParamId), protect, authenticatedLimiter, admin, deleteProduct);

module.exports = router;