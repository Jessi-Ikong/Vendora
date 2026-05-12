const pool = require("../config/db");

// ─── Get all users ────────────────────────────────────────────
const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT
      id, name, email, role,
      is_active, is_verified, created_at
     FROM users
     ORDER BY created_at DESC`,
  );
  return result.rows;
};

// ─── Get single user ──────────────────────────────────────────
const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT
      id, name, email, role,
      is_active, is_verified, created_at
     FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0];
};

// ─── Suspend or reactivate user ───────────────────────────────
const toggleUserStatus = async (id) => {
  const result = await pool.query(
    `UPDATE users
     SET is_active = NOT is_active,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, role, is_active`,
    [id],
  );
  return result.rows[0];
};

// ─── Delete user ──────────────────────────────────────────────
const deleteUser = async (id) => {
  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
};

// ─── Get all vendors ──────────────────────────────────────────
const getAllVendors = async () => {
  const result = await pool.query(
    `SELECT
      vp.*,
      u.name AS owner_name,
      u.email AS owner_email,
      u.is_active,
      COUNT(p.id) AS product_count
     FROM vendor_profiles vp
     JOIN users u ON vp.user_id = u.id
     LEFT JOIN products p ON p.vendor_id = vp.id
     GROUP BY vp.id, u.name, u.email, u.is_active
     ORDER BY vp.created_at DESC`,
  );
  return result.rows;
};

// ─── Get vendor by ID ─────────────────────────────────────────
const getVendorById = async (id) => {
  const result = await pool.query(
    `SELECT
      vp.*,
      u.name AS owner_name,
      u.email AS owner_email,
      u.is_active
     FROM vendor_profiles vp
     JOIN users u ON vp.user_id = u.id
     WHERE vp.id = $1`,
    [id],
  );
  return result.rows[0];
};

// ─── Approve vendor ───────────────────────────────────────────
const approveVendor = async (id) => {
  const result = await pool.query(
    `UPDATE vendor_profiles
     SET is_approved = true, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id],
  );
  return result.rows[0];
};

// ─── Reject vendor ────────────────────────────────────────────
const rejectVendor = async (id) => {
  const result = await pool.query(
    `UPDATE vendor_profiles
     SET is_approved = false, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id],
  );
  return result.rows[0];
};

// ─── Get all products ─────────────────────────────────────────
const getAllProducts = async () => {
  const result = await pool.query(
    `SELECT
      p.id, p.name, p.slug, p.price,
      p.stock, p.is_published, p.created_at,
      c.name AS category_name,
      v.store_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
     ORDER BY p.created_at DESC`,
  );
  return result.rows;
};

// ─── Delete any product ───────────────────────────────────────
const deleteProduct = async (id) => {
  await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
};

// ─── Get all orders ───────────────────────────────────────────
const getAllOrders = async ({ status, paymentStatus }) => {
  let query = `
    SELECT
      o.id, o.total_amount, o.status,
      o.payment_status, o.paystack_ref, o.created_at,
      u.name AS buyer_name,
      u.email AS buyer_email,
      COUNT(oi.id) AS item_count
     FROM orders o
     JOIN users u ON o.buyer_id = u.id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE 1=1
  `;

  const values = [];
  let count = 1;

  if (status) {
    query += ` AND o.status = $${count++}`;
    values.push(status);
  }

  if (paymentStatus) {
    query += ` AND o.payment_status = $${count++}`;
    values.push(paymentStatus);
  }

  query += ` GROUP BY o.id, u.name, u.email ORDER BY o.created_at DESC`;

  const result = await pool.query(query, values);
  return result.rows;
};

// ─── Get single order ─────────────────────────────────────────
const getOrderById = async (id) => {
  const result = await pool.query(
    `SELECT
      o.*,
      u.name AS buyer_name,
      u.email AS buyer_email,
      a.full_name, a.phone,
      a.address_line1, a.address_line2,
      a.city, a.state, a.country
     FROM orders o
     JOIN users u ON o.buyer_id = u.id
     LEFT JOIN addresses a ON o.address_id = a.id
     WHERE o.id = $1`,
    [id],
  );
  return result.rows[0];
};

// ─── Get all reviews ──────────────────────────────────────────
const getAllReviews = async () => {
  const result = await pool.query(
    `SELECT
      r.id, r.rating, r.comment, r.created_at,
      u.name AS buyer_name,
      p.name AS product_name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     JOIN products p ON r.product_id = p.id
     ORDER BY r.created_at DESC`,
  );
  return result.rows;
};

// ─── Delete any review ────────────────────────────────────────
const deleteReview = async (id) => {
  await pool.query(`DELETE FROM reviews WHERE id = $1`, [id]);
};

// ─── Platform analytics overview ─────────────────────────────
const getAnalyticsOverview = async () => {
  const result = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM users
       WHERE role = 'buyer')                    AS total_buyers,
      (SELECT COUNT(*) FROM users
       WHERE role = 'vendor')                   AS total_vendors,
      (SELECT COUNT(*) FROM vendor_profiles
       WHERE is_approved = true)                AS approved_vendors,
      (SELECT COUNT(*) FROM orders)             AS total_orders,
      (SELECT COUNT(*) FROM orders
       WHERE payment_status = 'paid')           AS paid_orders,
      (SELECT COALESCE(SUM(total_amount), 0)
       FROM orders
       WHERE payment_status = 'paid')           AS total_revenue,
      (SELECT COUNT(*) FROM products
       WHERE is_published = true)               AS total_products`,
  );
  return result.rows[0];
};

// ─── Platform monthly revenue ─────────────────────────────────
const getMonthlyRevenue = async () => {
  const result = await pool.query(
    `SELECT
      TO_CHAR(created_at, 'Mon YYYY') AS month,
      COALESCE(SUM(total_amount), 0)  AS revenue,
      COUNT(*)                         AS order_count
     FROM orders
     WHERE payment_status = 'paid'
     AND created_at >= NOW() - INTERVAL '6 months'
     GROUP BY TO_CHAR(created_at, 'Mon YYYY'),
              DATE_TRUNC('month', created_at)
     ORDER BY DATE_TRUNC('month', created_at) ASC`,
  );
  return result.rows;
};

// ─── Top vendors ──────────────────────────────────────────────
const getTopVendors = async (limit) => {
  const result = await pool.query(
    `SELECT
      vp.id, vp.store_name, vp.store_slug,
      vp.logo, vp.total_sales,
      COUNT(p.id)              AS product_count,
      COALESCE(SUM(oi.subtotal)
        FILTER (WHERE o.payment_status = 'paid'), 0) AS revenue
     FROM vendor_profiles vp
     LEFT JOIN products p ON p.vendor_id = vp.id
     LEFT JOIN order_items oi ON oi.vendor_id = vp.id
     LEFT JOIN orders o ON oi.order_id = o.id
     GROUP BY vp.id
     ORDER BY revenue DESC
     LIMIT $1`,
    [limit || 5],
  );
  return result.rows;
};

// ─── Top products ─────────────────────────────────────────────
const getTopProducts = async (limit) => {
  const result = await pool.query(
    `SELECT
      p.id, p.name, p.slug, p.price,
      p.total_sold, p.average_rating,
      v.store_name
     FROM products p
     LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
     WHERE p.is_published = true
     ORDER BY p.total_sold DESC
     LIMIT $1`,
    [limit || 5],
  );
  return result.rows;
};

module.exports = {
  getAllUsers,
  getUserById,
  toggleUserStatus,
  deleteUser,
  getAllVendors,
  getVendorById,
  approveVendor,
  rejectVendor,
  getAllProducts,
  deleteProduct,
  getAllOrders,
  getOrderById,
  getAllReviews,
  deleteReview,
  getAnalyticsOverview,
  getMonthlyRevenue,
  getTopVendors,
  getTopProducts,
};
