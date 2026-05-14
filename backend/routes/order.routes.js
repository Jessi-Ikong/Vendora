const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { validateCheckout } = require("../validators/order.validators");
const {
  checkout,
  getMyOrders,
  getOrder,
  cancelOrderHandler,
} = require("../controllers/order.controller");

// All order routes require login
router.post("/checkout", verifyToken, validateCheckout, validate, checkout);
router.get("/", verifyToken, getMyOrders);
router.get("/:id", verifyToken, getOrder);
router.put("/:id/cancel", verifyToken, cancelOrderHandler);

module.exports = router;
