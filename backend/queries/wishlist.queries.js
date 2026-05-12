const pool = require("../config/db");

// ─── Get user's wishlist ──────────────────────────────────────
const getWishlist = async (userId) => {
  const result = await pool.query(
    `SELECT
      w.id AS wishlist_id,
      w.created_at AS saved_at,
      p.id AS product_id,
      p.name, p.slug, p.price,
      p.discount_price, p.stock,
      p.average_rating, p.is_published,
      v.store_name, v.store_slug,
      pi.image_url AS primary_image
     FROM wishlists w
     JOIN products p ON w.product_id = p.id
     LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
     LEFT JOIN product_images pi
       ON pi.product_id = p.id AND pi.is_primary = true
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId],
  );
  return result.rows;
};

// ─── Check if product is in wishlist ─────────────────────────
const getWishlistItem = async (userId, productId) => {
  const result = await pool.query(
    `SELECT * FROM wishlists
     WHERE user_id = $1 AND product_id = $2`,
    [userId, productId],
  );
  return result.rows[0];
};

// ─── Add to wishlist ──────────────────────────────────────────
const addToWishlist = async (userId, productId) => {
  const result = await pool.query(
    `INSERT INTO wishlists (user_id, product_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, productId],
  );
  return result.rows[0];
};

// ─── Remove from wishlist ─────────────────────────────────────
const removeFromWishlist = async (userId, productId) => {
  await pool.query(
    `DELETE FROM wishlists
     WHERE user_id = $1 AND product_id = $2`,
    [userId, productId],
  );
};

// ─── Clear entire wishlist ────────────────────────────────────
const clearWishlist = async (userId) => {
  await pool.query(`DELETE FROM wishlists WHERE user_id = $1`, [userId]);
};

module.exports = {
  getWishlist,
  getWishlistItem,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};
