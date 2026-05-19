const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { validateCheckout } = require("../validators/order.validators");
const {
  checkout,
  getMyOrders,
  getOrder,
  cancelOrderHandler,
  verifyDeliveryCodeHandler,
} = require("../controllers/order.controller");

// All order routes require login
router.post("/checkout", verifyToken, validateCheckout, validate, checkout);
router.get("/", verifyToken, getMyOrders);
router.get("/:id", verifyToken, getOrder);
router.put("/:id/cancel", verifyToken, cancelOrderHandler);

// Delivery verification (vendor only)
router.post(
  "/delivery/verify",
  verifyToken,
  requireRole(["vendor"]),
  verifyDeliveryCodeHandler,
);

module.exports = router;
