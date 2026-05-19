const pool = require("../config/db");

// ─── Create order ─────────────────────────────────────────────
const createOrder = async (client, buyerId, addressId, totalAmount, deliveryCode) => {
  const result = await client.query(
    `INSERT INTO orders (buyer_id, address_id, total_amount, delivery_code)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [buyerId, addressId, totalAmount, deliveryCode],
  );
  return result.rows[0];
};

// ─── Create order items ───────────────────────────────────────
const createOrderItems = async (client, orderId, items) => {
  for (const item of items) {
    await client.query(
      `INSERT INTO order_items
        (order_id, product_id, vendor_id, product_name,
         product_image, price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        orderId,
        item.product_id,
        item.vendor_id,
        item.product_name,
        item.product_image || null,
        item.price,
        item.quantity,
        item.subtotal,
      ],
    );
  }
};

// ─── Decrement product stock ──────────────────────────────────
const decrementStock = async (client, productId, quantity) => {
  await client.query(
    `UPDATE products
     SET stock = stock - $1,
         total_sold = total_sold + $1,
         updated_at = NOW()
     WHERE id = $2`,
    [quantity, productId],
  );
};

// ─── Get all orders for a buyer ───────────────────────────────
const getBuyerOrders = async (buyerId) => {
  const result = await pool.query(
    `SELECT
      o.id, o.total_amount, o.status,
      o.payment_status, o.paystack_ref, o.created_at,
      COUNT(oi.id) AS item_count
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.buyer_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [buyerId],
  );
  return result.rows;
};

// ─── Get single order with full details ───────────────────────
const getOrderById = async (orderId, buyerId) => {
  const result = await pool.query(
    `SELECT
      o.*,
      a.full_name, a.phone, a.address_line1,
      a.address_line2, a.city, a.state, a.country
     FROM orders o
     LEFT JOIN addresses a ON o.address_id = a.id
     WHERE o.id = $1 AND o.buyer_id = $2`,
    [orderId, buyerId],
  );
  return result.rows[0];
};

// ─── Get order items ──────────────────────────────────────────
const getOrderItems = async (orderId) => {
  const result = await pool.query(
    `SELECT * FROM order_items WHERE order_id = $1`,
    [orderId],
  );
  return result.rows;
};

// ─── Update order status ──────────────────────────────────────
const updateOrderStatus = async (orderId, status) => {
  const result = await pool.query(
    `UPDATE orders
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, orderId],
  );
  return result.rows[0];
};

// ─── Update payment status ────────────────────────────────────
const updatePaymentStatus = async (orderId, paymentStatus, paystackRef) => {
  const result = await pool.query(
    `UPDATE orders
     SET payment_status = $1,
         paystack_ref = $2,
         status = CASE
           WHEN $1::VARCHAR = 'paid' THEN 'processing'
           ELSE status
         END,
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [paymentStatus, paystackRef, orderId],
  );
  return result.rows[0];
};

// ─── Update order status based on items ────────────────────────
const updateOrderStatusFromItems = async (orderId) => {
  // Get the highest status from all items in the order
  const statusResult = await pool.query(
    `SELECT
       CASE
         WHEN COUNT(*) = COUNT(CASE WHEN status = 'delivered' THEN 1 END)
           THEN 'delivered'
         WHEN MAX(CASE WHEN status IN ('delivered', 'shipped') THEN 1 ELSE 0 END) = 1
           THEN 'shipped'
         WHEN MAX(CASE WHEN status IN ('delivered', 'shipped', 'processing') THEN 1 ELSE 0 END) = 1
           THEN 'processing'
         ELSE 'pending'
       END AS new_status
     FROM order_items
     WHERE order_id = $1`,
    [orderId],
  );

  const newStatus = statusResult.rows[0]?.new_status || "pending";

  // Update the order with the new status
  const result = await pool.query(
    `UPDATE orders
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [newStatus, orderId],
  );

  return result.rows[0];
};

// ─── Cancel order ─────────────────────────────────────────────
const cancelOrder = async (orderId, buyerId) => {
  const result = await pool.query(
    `UPDATE orders
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND buyer_id = $2
     AND status = 'pending'
     RETURNING *`,
    [orderId, buyerId],
  );
  return result.rows[0];
};

// ─── Restore stock on cancellation ───────────────────────────
const restoreStock = async (client, productId, quantity) => {
  await client.query(
    `UPDATE products
     SET stock = stock + $1,
         total_sold = total_sold - $1,
         updated_at = NOW()
     WHERE id = $2`,
    [quantity, productId],
  );
};

// ─── Get vendor orders ────────────────────────────────────────
const getVendorOrders = async (vendorId) => {
  const result = await pool.query(
    `SELECT
      oi.id AS item_id,
      oi.product_name, oi.price,
      oi.quantity, oi.subtotal, oi.status,
      oi.product_image,
      o.id AS order_id,
      o.created_at, o.payment_status, o.paystack_ref,
      u.name AS buyer_name,
      u.email AS buyer_email
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN users u ON o.buyer_id = u.id
     WHERE oi.vendor_id = $1
     ORDER BY o.created_at DESC`,
    [vendorId],
  );
  return result.rows;
};

// ─── Update order item status (vendor) ───────────────────────
const updateOrderItemStatus = async (itemId, vendorId, status) => {
  const result = await pool.query(
    `UPDATE order_items
     SET status = $1
     WHERE id = $2 AND vendor_id = $3
     RETURNING *`,
    [status, itemId, vendorId],
  );
  return result.rows[0];
};

// ─── Get order by paystack reference ─────────────────────────
const getOrderByPaystackRef = async (reference) => {
  const result = await pool.query(
    `SELECT * FROM orders WHERE paystack_ref = $1`,
    [reference],
  );
  return result.rows[0];
};

// ─── Verify delivery code and update order item status ───────
const verifyDeliveryCode = async (client, itemId, vendorId, deliveryCode) => {
  // 1. Get the order item and verify it belongs to the vendor
  const itemResult = await client.query(
    `SELECT oi.*, o.delivery_code, o.id AS order_id
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.id = $1 AND oi.vendor_id = $2`,
    [itemId, vendorId],
  );

  if (itemResult.rows.length === 0) {
    return { success: false, message: "Order item not found" };
  }

  const item = itemResult.rows[0];

  // 2. Verify the delivery code matches
  if (item.delivery_code !== deliveryCode) {
    return { success: false, message: "Invalid delivery code" };
  }

  // 3. Update the order item status to 'delivered'
  const updateResult = await client.query(
    `UPDATE order_items
     SET status = 'delivered'
     WHERE id = $1
     RETURNING *`,
    [itemId],
  );

  // 4. Update the overall order status based on all items
  await client.query(
    `UPDATE orders
     SET status = CASE
       WHEN (SELECT COUNT(*) FROM order_items WHERE order_id = $1 AND status != 'delivered') = 0
         THEN 'delivered'
       ELSE 'shipped'
     END,
     updated_at = NOW()
     WHERE id = $1`,
    [item.order_id],
  );

  return { success: true, message: "Delivery verified successfully", item: updateResult.rows[0] };
};

module.exports = {
  createOrder,
  createOrderItems,
  decrementStock,
  getBuyerOrders,
  getOrderById,
  getOrderItems,
  updateOrderStatus,
  updatePaymentStatus,
  updateOrderStatusFromItems,
  cancelOrder,
  restoreStock,
  getVendorOrders,
  updateOrderItemStatus,
  getOrderByPaystackRef,
  verifyDeliveryCode,
};
