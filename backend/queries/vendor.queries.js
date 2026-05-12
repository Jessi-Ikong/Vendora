const pool = require("../config/db");

// ─── Get vendor profile by user ID ───────────────────────────
const getVendorByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT
      vp.*,
      u.name AS owner_name,
      u.email AS owner_email,
      u.avatar AS owner_avatar
     FROM vendor_profiles vp
     JOIN users u ON vp.user_id = u.id
     WHERE vp.user_id = $1`,
    [userId],
  );
  return result.rows[0];
};

// ─── Get vendor profile by slug ───────────────────────────────
const getVendorBySlug = async (slug) => {
  const result = await pool.query(
    `SELECT
      vp.*,
      u.name AS owner_name,
      u.email AS owner_email
     FROM vendor_profiles vp
     JOIN users u ON vp.user_id = u.id
     WHERE vp.store_slug = $1`,
    [slug],
  );
  return result.rows[0];
};

// ─── Get vendor profile by ID ─────────────────────────────────
const getVendorById = async (id) => {
  const result = await pool.query(
    `SELECT
      vp.*,
      u.name AS owner_name,
      u.email AS owner_email
     FROM vendor_profiles vp
     JOIN users u ON vp.user_id = u.id
     WHERE vp.id = $1`,
    [id],
  );
  return result.rows[0];
};

// ─── Create vendor profile ────────────────────────────────────
const createVendorProfile = async (
  userId,
  storeName,
  storeSlug,
  description,
) => {
  const result = await pool.query(
    `INSERT INTO vendor_profiles
      (user_id, store_name, store_slug, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, storeName, storeSlug, description || null],
  );
  return result.rows[0];
};

// ─── Update vendor profile ────────────────────────────────────
const updateVendorProfile = async (userId, fields) => {
  const { store_name, store_slug, description, logo, banner } = fields;
  const result = await pool.query(
    `UPDATE vendor_profiles
     SET store_name  = $1,
         store_slug  = $2,
         description = $3,
         logo        = $4,
         banner      = $5,
         updated_at  = NOW()
     WHERE user_id = $6
     RETURNING *`,
    [store_name, store_slug, description, logo, banner, userId],
  );
  return result.rows[0];
};

// ─── Get vendor dashboard stats ───────────────────────────────
const getVendorStats = async (vendorId) => {
  const result = await pool.query(
    `SELECT
      -- Total revenue from paid orders
      COALESCE(SUM(oi.subtotal) FILTER (
        WHERE o.payment_status = 'paid'
      ), 0) AS total_revenue,

      -- Total orders count
      COUNT(DISTINCT o.id) FILTER (
        WHERE o.payment_status = 'paid'
      ) AS total_orders,

      -- Pending orders count
      COUNT(DISTINCT o.id) FILTER (
        WHERE oi.status = 'pending'
        AND o.payment_status = 'paid'
      ) AS pending_orders,

      -- Total products count
      (SELECT COUNT(*) FROM products
       WHERE vendor_id = $1) AS total_products,

      -- Published products count
      (SELECT COUNT(*) FROM products
       WHERE vendor_id = $1
       AND is_published = true) AS published_products
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.vendor_id = $1`,
    [vendorId],
  );
  return result.rows[0];
};

// ─── Get vendor monthly revenue (last 6 months) ───────────────
const getVendorMonthlyRevenue = async (vendorId) => {
  const result = await pool.query(
    `SELECT
      TO_CHAR(o.created_at, 'Mon YYYY') AS month,
      COALESCE(SUM(oi.subtotal), 0)     AS revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.vendor_id = $1
     AND o.payment_status = 'paid'
     AND o.created_at >= NOW() - INTERVAL '6 months'
     GROUP BY TO_CHAR(o.created_at, 'Mon YYYY'),
              DATE_TRUNC('month', o.created_at)
     ORDER BY DATE_TRUNC('month', o.created_at) ASC`,
    [vendorId],
  );
  return result.rows;
};

// ─── Get vendor best selling products ────────────────────────
const getVendorBestSellers = async (vendorId, limit) => {
  const result = await pool.query(
    `SELECT
      p.id, p.name, p.slug, p.price,
      p.total_sold, p.average_rating,
      pi.image_url AS primary_image
     FROM products p
     LEFT JOIN product_images pi
       ON pi.product_id = p.id AND pi.is_primary = true
     WHERE p.vendor_id = $1
     ORDER BY p.total_sold DESC
     LIMIT $2`,
    [vendorId, limit || 5],
  );
  return result.rows;
};

// ─── Get low stock products ───────────────────────────────────
const getLowStockProducts = async (vendorId, threshold) => {
  const result = await pool.query(
    `SELECT id, name, slug, stock, is_published
     FROM products
     WHERE vendor_id = $1
     AND stock <= $2
     AND is_published = true
     ORDER BY stock ASC`,
    [vendorId, threshold || 5],
  );
  return result.rows;
};

// ─── Get all vendors (admin) ──────────────────────────────────
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

// ─── Approve vendor ───────────────────────────────────────────
const approveVendor = async (vendorId) => {
  const result = await pool.query(
    `UPDATE vendor_profiles
     SET is_approved = true, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [vendorId],
  );
  return result.rows[0];
};

// ─── Reject vendor ────────────────────────────────────────────
const rejectVendor = async (vendorId) => {
  const result = await pool.query(
    `UPDATE vendor_profiles
     SET is_approved = false, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [vendorId],
  );
  return result.rows[0];
};

module.exports = {
  getVendorByUserId,
  getVendorBySlug,
  getVendorById,
  createVendorProfile,
  updateVendorProfile,
  getVendorStats,
  getVendorMonthlyRevenue,
  getVendorBestSellers,
  getLowStockProducts,
  getAllVendors,
  approveVendor,
  rejectVendor,
};
