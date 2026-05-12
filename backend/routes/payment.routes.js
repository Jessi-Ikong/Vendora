const express     = require("express");
const router      = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { initPayment, verify, webhook } = require("../controllers/payment.controller");

// Webhook must be public — Paystack calls it directly
router.post("/webhook", webhook);

// Protected routes
router.post("/initialize", verifyToken, initPayment);
router.get("/verify/:reference", verifyToken, verify);

module.exports = router;