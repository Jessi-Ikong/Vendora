const pool = require("../config/db");

// ─── Get cart by user ID ──────────────────────────────────────
const getCartByUserId = async (userId) => {
  const result = await pool.query(`SELECT * FROM carts WHERE user_id = $1`, [
    userId,
  ]);
  return result.rows[0];
};

// ─── Get cart with all items and product details ──────────────
const getCartWithItems = async (userId) => {
  const result = await pool.query(
    `SELECT
      c.id AS cart_id,
      ci.id AS item_id,
      ci.quantity,
      p.id AS product_id,
      p.vendor_id,
      p.name AS product_name,
      p.slug AS product_slug,
      p.price,
      p.discount_price,
      p.stock,
      p.is_published,
      v.store_name,
      v.store_slug,
      pi.image_url AS product_image,
      -- Use discount price if available, otherwise regular price
      CASE
        WHEN p.discount_price IS NOT NULL
        THEN p.discount_price * ci.quantity
        ELSE p.price * ci.quantity
      END AS subtotal
     FROM carts c
     LEFT JOIN cart_items ci ON ci.cart_id = c.id
     LEFT JOIN products p ON ci.product_id = p.id
     LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
     LEFT JOIN product_images pi ON pi.product_id = p.id
       AND pi.is_primary = true
     WHERE c.user_id = $1
     ORDER BY ci.created_at DESC`,
    [userId],
  );
  return result.rows;
};

// ─── Get cart item ────────────────────────────────────────────
const getCartItem = async (cartId, productId) => {
  const result = await pool.query(
    `SELECT * FROM cart_items
     WHERE cart_id = $1 AND product_id = $2`,
    [cartId, productId],
  );
  return result.rows[0];
};

// ─── Get cart item by ID ──────────────────────────────────────
const getCartItemById = async (itemId, cartId) => {
  const result = await pool.query(
    `SELECT * FROM cart_items
     WHERE id = $1 AND cart_id = $2`,
    [itemId, cartId],
  );
  return result.rows[0];
};

// ─── Add item to cart ─────────────────────────────────────────
const addItemToCart = async (cartId, productId, quantity) => {
  const result = await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [cartId, productId, quantity],
  );
  return result.rows[0];
};

// ─── Update item quantity ─────────────────────────────────────
const updateCartItemQuantity = async (itemId, cartId, quantity) => {
  const result = await pool.query(
    `UPDATE cart_items
     SET quantity = $1, updated_at = NOW()
     WHERE id = $2 AND cart_id = $3
     RETURNING *`,
    [quantity, itemId, cartId],
  );
  return result.rows[0];
};

// ─── Remove item from cart ────────────────────────────────────
const removeCartItem = async (itemId, cartId) => {
  await pool.query(`DELETE FROM cart_items WHERE id = $1 AND cart_id = $2`, [
    itemId,
    cartId,
  ]);
};

// ─── Clear entire cart ────────────────────────────────────────
const clearCart = async (cartId) => {
  await pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
};

module.exports = {
  getCartByUserId,
  getCartWithItems,
  getCartItem,
  getCartItemById,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
