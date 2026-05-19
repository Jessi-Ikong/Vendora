const pool = require("../config/db");

// ─── Get all reviews for a product ───────────────────────────
const getProductReviews = async (productId) => {
  const result = await pool.query(
    `SELECT
      r.id, r.user_id, r.rating, r.comment, r.created_at,
      u.name AS buyer_name,
      u.avatar AS buyer_avatar
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [productId],
  );
  return result.rows;
};

// ─── Get single review ────────────────────────────────────────
const getReviewById = async (id) => {
  const result = await pool.query(`SELECT * FROM reviews WHERE id = $1`, [id]);
  return result.rows[0];
};

// ─── Check if buyer already reviewed this product ────────────
const getExistingReview = async (productId, userId) => {
  const result = await pool.query(
    `SELECT * FROM reviews
     WHERE product_id = $1 AND user_id = $2`,
    [productId, userId],
  );
  return result.rows[0];
};

// ─── Check if buyer purchased this product ───────────────────
const verifyPurchase = async (productId, userId) => {
  const result = await pool.query(
    `SELECT oi.id
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.product_id = $1
     AND o.buyer_id = $2
     AND o.payment_status = 'paid'
     AND oi.status = 'delivered'
     LIMIT 1`,
    [productId, userId],
  );
  return result.rows[0];
};

// ─── Create review ────────────────────────────────────────────
const createReview = async (productId, userId, rating, comment) => {
  const result = await pool.query(
    `INSERT INTO reviews (product_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [productId, userId, rating, comment || null],
  );
  return result.rows[0];
};

// ─── Update review ────────────────────────────────────────────
const updateReview = async (id, userId, rating, comment) => {
  const result = await pool.query(
    `UPDATE reviews
     SET rating = $1, comment = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [rating, comment, id, userId],
  );
  return result.rows[0];
};

// ─── Delete review ────────────────────────────────────────────
const deleteReview = async (id, userId) => {
  await pool.query(`DELETE FROM reviews WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
};

// ─── Update product average rating ───────────────────────────
// Called after every create, update or delete review
const updateProductRating = async (productId) => {
  await pool.query(
    `UPDATE products
     SET average_rating = (
       SELECT COALESCE(AVG(rating), 0)
       FROM reviews
       WHERE product_id = $1
     ),
     updated_at = NOW()
     WHERE id = $1`,
    [productId],
  );
};

module.exports = {
  getProductReviews,
  getReviewById,
  getExistingReview,
  verifyPurchase,
  createReview,
  updateReview,
  deleteReview,
  updateProductRating,
};
