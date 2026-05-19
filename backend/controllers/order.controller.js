const pool = require("../config/db");
const {
  createOrder,
  createOrderItems,
  decrementStock,
  getBuyerOrders,
  getOrderById,
  getOrderItems,
  cancelOrder,
  restoreStock,
  verifyDeliveryCode,
} = require("../queries/order.queries");
const {
  getCartWithItems,
  clearCart,
  getCartByUserId,
} = require("../queries/cart.queries");
const {
  getAddressById,
  getDefaultAddress,
} = require("../queries/address.queries");
const { getVendorByUserId } = require("../queries/vendor.queries");

// ─── Helper — Generate 6-digit delivery code ──────────────────
const generateDeliveryCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── CHECKOUT ─────────────────────────────────────────────────
const checkout = async (req, res) => {
  // We use a database transaction here
  // A transaction means ALL queries succeed or NONE do
  // If anything fails midway, Postgres rolls everything back
  const client = await pool.connect();

  try {
    const { address_id, notes } = req.body;

    // 1. Get cart items
    const cartRows = await getCartWithItems(req.user.id);
    const items = cartRows.filter((row) => row.item_id !== null);

    if (items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // 2. Get delivery address
    let address;
    if (address_id) {
      address = await getAddressById(address_id, req.user.id);
    } else {
      address = await getDefaultAddress(req.user.id);
    }

    if (!address) {
      return res.status(400).json({
        message: "Please provide a delivery address",
      });
    }

    // 3. Validate stock for all items
    for (const item of items) {
      if (!item.is_published) {
        return res.status(400).json({
          message: `"${item.product_name}" is no longer available`,
        });
      }
      if (item.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${item.stock} units of "${item.product_name}" available`,
        });
      }
    }

    // 4. Calculate total
    const totalAmount = items.reduce((sum, item) => {
      return sum + parseFloat(item.subtotal);
    }, 0);

    // 5. Generate delivery code
    const deliveryCode = generateDeliveryCode();

    // 6. BEGIN TRANSACTION
    await client.query("BEGIN");

    // 7. Create the order
    const order = await createOrder(
      client,
      req.user.id,
      address.id,
      totalAmount.toFixed(2),
      deliveryCode,
    );

    // 8. Create order items
    const orderItems = items.map((item) => ({
      product_id: item.product_id,
      vendor_id: item.vendor_id,
      product_name: item.product_name,
      product_image: item.product_image,
      price: parseFloat(item.discount_price || item.price),
      quantity: item.quantity,
      subtotal: parseFloat(item.subtotal),
    }));

    await createOrderItems(client, order.id, orderItems);

    // 9. Decrement stock for each product
    for (const item of items) {
      await decrementStock(client, item.product_id, item.quantity);
    }

    // 10. Clear the cart
    const cart = await getCartByUserId(req.user.id);
    await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);

    // 11. COMMIT — save everything to database
    await client.query("COMMIT");

    // Send order confirmation email in background
    const { sendOrderConfirmationEmail } = require("../utils/email");
    sendOrderConfirmationEmail(req.user.name, req.user.email, order, orderItems, deliveryCode)
      .then(() =>
        console.log(`✅ Order confirmation sent to ${req.user.email}`),
      )
      .catch((err) => console.error("Order email failed:", err.message));

    res.status(201).json({
      message: "Order created successfully",
      order: {
        ...order,
        items: orderItems,
        address
      }
    });
  } catch (err) {
    // If anything failed — ROLLBACK everything
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    // Always release the client back to the pool
    client.release();
  }
};

// ─── GET all buyer orders ─────────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const orders = await getBuyerOrders(req.user.id);
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET single order ─────────────────────────────────────────
const getOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const items = await getOrderItems(order.id);

    res.status(200).json({ order: { ...order, items } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── CANCEL order ─────────────────────────────────────────────
const cancelOrderHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Cancel the order
    const order = await cancelOrder(req.params.id, req.user.id);
    if (!order) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Order not found or cannot be cancelled",
      });
    }

    // 2. Restore stock for each item
    const items = await getOrderItems(order.id);
    for (const item of items) {
      await restoreStock(client, item.product_id, item.quantity);
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

// ─── VERIFY DELIVERY CODE (VENDOR) ────────────────────────────
const verifyDeliveryCodeHandler = async (req, res) => {
  const client = await pool.connect();

  try {
    const { itemId, deliveryCode } = req.body;

    if (!itemId || !deliveryCode) {
      return res.status(400).json({
        message: "Item ID and delivery code are required",
      });
    }

    // Get vendor profile for this user
    const vendor = await getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(403).json({
        message: "You don't have a vendor profile",
      });
    }

    // Begin transaction
    await client.query("BEGIN");

    // Verify delivery code and update status
    const result = await verifyDeliveryCode(client, itemId, vendor.id, deliveryCode);

    if (!result.success) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: result.message });
    }

    // Commit transaction
    await client.query("COMMIT");

    res.status(200).json({
      message: result.message,
      item: result.item,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    client.release();
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getOrder,
  cancelOrderHandler,
  verifyDeliveryCodeHandler,
};
