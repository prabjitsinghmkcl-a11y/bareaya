const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const { addOrderItems, myorders, getOrders, updateOrderStatus, cancelOrder } = require("../controllers/orderController");
const { authenticatedLimiter } = require("../config/rateLimit");
const { validateBody, validateParams } = require("../middleware/validate");
const schemas = require("../config/validationSchemas");

const router = express.Router();

router.route("/")
  .post(protect, authenticatedLimiter, validateBody(schemas.orderCreate, { trim: true }), addOrderItems)
  .get(protect, authenticatedLimiter, admin, getOrders);
router.route("/myorders").get(protect, authenticatedLimiter, myorders);
router.route("/:id/status")
  .put(validateParams(schemas.orderParamId), protect, authenticatedLimiter, admin, validateBody(schemas.orderStatusUpdate), updateOrderStatus);
router.route("/:id/cancel")
  .put(validateParams(schemas.orderParamId), protect, authenticatedLimiter, cancelOrder);

module.exports = router;