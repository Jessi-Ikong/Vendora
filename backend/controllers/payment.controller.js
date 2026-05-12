const crypto = require("crypto");
const { initializePayment, verifyPayment } = require("../config/paystack");
const {
  updatePaymentStatus,
  getOrderByPaystackRef,
} = require("../queries/order.queries");
const pool = require("../config/db");

// ─── Initialize payment ───────────────────────────────────────
const initPayment = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // 1. Get the order
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND buyer_id = $2`,
      [order_id, req.user.id],
    );

    const order = orderResult.rows[0];

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Check order isn't already paid
    if (order.payment_status === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // 3. Generate unique reference
    const reference = `VENDORA-${order_id}-${Date.now()}`;

    // 4. Initialize payment with Paystack
    const response = await initializePayment(
      req.user.email,
      parseFloat(order.total_amount),
      reference,
      `${process.env.FRONTEND_URL}/buyer/payment-success.html`,
    );

    if (!response.status) {
      return res.status(400).json({
        message: "Payment initialization failed",
        error: response.message,
      });
    }

    // 5. Save reference to order
    await pool.query(`UPDATE orders SET paystack_ref = $1 WHERE id = $2`, [
      reference,
      order_id,
    ]);

    res.status(200).json({
      message: "Payment initialized",
      authorization_url: response.data.authorization_url,
      reference: response.data.reference,
      access_code: response.data.access_code,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Verify payment ───────────────────────────────────────────
const verify = async (req, res) => {
  try {
    const { reference } = req.params;

    // 1. Verify with Paystack
    const response = await verifyPayment(reference);

    if (!response.status || response.data.status !== "success") {
      return res.status(400).json({
        message: "Payment verification failed",
        status: response.data?.status,
      });
    }

    // 2. Find the order
    const order = await getOrderByPaystackRef(reference);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 3. Update payment status
    const updated = await updatePaymentStatus(order.id, "paid", reference);

    res.status(200).json({
      message: "Payment verified successfully",
      order: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Paystack Webhook ─────────────────────────────────────────
// Paystack calls this endpoint directly to confirm payment
const webhook = async (req, res) => {
  try {
    // 1. Verify the request is genuinely from Paystack
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    // 2. Handle the event
    const event = req.body;

    if (event.event === "charge.success") {
      const reference = event.data.reference;

      // Find and update the order
      const order = await getOrderByPaystackRef(reference);

      if (order && order.payment_status !== "paid") {
        await updatePaymentStatus(order.id, "paid", reference);
      }
    }

    // Always return 200 to Paystack — even if we don't handle the event
    res.status(200).json({ message: "Webhook received" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { initPayment, verify, webhook };
