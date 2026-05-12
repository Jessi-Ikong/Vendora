const pool = require("../config/db");

// ─── Get all published products (with filters & pagination) ───
const getAllProducts = async ({
  limit,
  offset,
  category,
  minPrice,
  maxPrice,
  rating,
  vendorId,
  sort,
}) => {
  let query = `
    SELECT
      p.id, p.name, p.slug, p.price, p.discount_price,
      p.stock, p.total_sold, p.average_rating,
      p.created_at,
      c.name AS category_name, c.slug AS category_slug,
      v.store_name, v.store_slug,
      pi.image_url AS primary_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
    WHERE p.is_published = true
  `;

  const values = [];
  let count = 1;

  // Dynamic filters
  if (category) {
    query += ` AND c.slug = $${count++}`;
    values.push(category);
  }
  if (minPrice) {
    query += ` AND p.price >= $${count++}`;
    values.push(minPrice);
  }
  if (maxPrice) {
    query += ` AND p.price <= $${count++}`;
    values.push(maxPrice);
  }
  if (rating) {
    query += ` AND p.average_rating >= $${count++}`;
    values.push(rating);
  }
  if (vendorId) {
    query += ` AND p.vendor_id = $${count++}`;
    values.push(vendorId);
  }

  // Sorting
  switch (sort) {
    case "price_asc":
      query += ` ORDER BY p.price ASC`;
      break;
    case "price_desc":
      query += ` ORDER BY p.price DESC`;
      break;
    case "popular":
      query += ` ORDER BY p.total_sold DESC`;
      break;
    case "rated":
      query += ` ORDER BY p.average_rating DESC`;
      break;
    default:
      query += ` ORDER BY p.created_at DESC`;
      break;
  }

  // Pagination
  query += ` LIMIT $${count++} OFFSET $${count++}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);
  return result.rows;
};

// ─── Count total products (for pagination) ───────────────────
const countAllProducts = async ({
  category,
  minPrice,
  maxPrice,
  rating,
  vendorId,
}) => {
  let query = `
    SELECT COUNT(p.id) AS total
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_published = true
  `;

  const values = [];
  let count = 1;

  if (category) {
    query += ` AND c.slug = $${count++}`;
    values.push(category);
  }
  if (minPrice) {
    query += ` AND p.price >= $${count++}`;
    values.push(minPrice);
  }
  if (maxPrice) {
    query += ` AND p.price <= $${count++}`;
    values.push(maxPrice);
  }
  if (rating) {
    query += ` AND p.average_rating >= $${count++}`;
    values.push(rating);
  }
  if (vendorId) {
    query += ` AND p.vendor_id = $${count++}`;
    values.push(vendorId);
  }

  const result = await pool.query(query, values);
  return parseInt(result.rows[0].total);
};

// ─── Get single product by slug ───────────────────────────────
const getProductBySlug = async (slug) => {
  const result = await pool.query(
    `SELECT
      p.*,
      c.name AS category_name, c.slug AS category_slug,
      v.store_name, v.store_slug, v.id AS vendor_profile_id,
      u.name AS vendor_name,
      COALESCE(
        json_agg(
          json_build_object('id', pi.id, 'url', pi.image_url, 'is_primary', pi.is_primary)
        ) FILTER (WHERE pi.id IS NOT NULL), '[]'
      ) AS images
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
     LEFT JOIN users u ON v.user_id = u.id
     LEFT JOIN product_images pi ON pi.product_id = p.id
     WHERE p.slug = $1
     GROUP BY p.id, c.name, c.slug, v.store_name, v.store_slug, v.id, u.name`,
    [slug],
  );
  return result.rows[0];
};

// ─── Get product by ID ────────────────────────────────────────
const getProductById = async (id) => {
  const result = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);
  return result.rows[0];
};

// ─── Get product by slug (simple) ────────────────────────────
const getProductBySlugSimple = async (slug) => {
  const result = await pool.query(`SELECT * FROM products WHERE slug = $1`, [
    slug,
  ]);
  return result.rows[0];
};

// ─── Search products ──────────────────────────────────────────
const searchProducts = async (keyword, limit, offset) => {
  const result = await pool.query(
    `SELECT
      p.id, p.name, p.slug, p.price, p.discount_price,
      p.stock, p.average_rating,
      c.name AS category_name,
      v.store_name,
      pi.image_url AS primary_image
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
     WHERE p.is_published = true
     AND (
       p.name ILIKE $1 OR
       p.description ILIKE $1 OR
       c.name ILIKE $1
     )
     ORDER BY p.total_sold DESC
     LIMIT $2 OFFSET $3`,
    [`%${keyword}%`, limit, offset],
  );
  return result.rows;
};

// ─── Get best sellers ─────────────────────────────────────────
const getBestSellers = async (limit) => {
  const result = await pool.query(
    `SELECT
      p.id, p.name, p.slug, p.price, p.discount_price,
      p.total_sold, p.average_rating,
      v.store_name,
      pi.image_url AS primary_image
     FROM products p
     LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
     WHERE p.is_published = true
     ORDER BY p.total_sold DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
};

// ─── Get top rated ────────────────────────────────────────────
const getTopRated = async (limit) => {
  const result = await pool.query(
    `SELECT
      p.id, p.name, p.slug, p.price, p.discount_price,
      p.total_sold, p.average_rating,
      v.store_name,
      pi.image_url AS primary_image
     FROM products p
     LEFT JOIN vendor_profiles v ON p.vendor_id = v.id
     LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
     WHERE p.is_published = true
     AND p.average_rating > 0
     ORDER BY p.average_rating DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
};

// ─── Get vendor's own products ────────────────────────────────
const getVendorProducts = async (vendorId, limit, offset) => {
  const result = await pool.query(
    `SELECT
      p.*,
      c.name AS category_name,
      COUNT(pi.id) AS image_count
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN product_images pi ON pi.product_id = p.id
     WHERE p.vendor_id = $1
     GROUP BY p.id, c.name
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [vendorId, limit, offset],
  );
  return result.rows;
};

// ─── Create product ───────────────────────────────────────────
const createProduct = async (
  vendorId,
  categoryId,
  name,
  slug,
  description,
  price,
  discountPrice,
  stock,
) => {
  const result = await pool.query(
    `INSERT INTO products
      (vendor_id, category_id, name, slug, description, price, discount_price, stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      vendorId,
      categoryId,
      name,
      slug,
      description,
      price,
      discountPrice,
      stock,
    ],
  );
  return result.rows[0];
};

// ─── Update product ───────────────────────────────────────────
const updateProduct = async (id, vendorId, fields) => {
  const { name, slug, description, price, discount_price, stock, category_id } =
    fields;
  const result = await pool.query(
    `UPDATE products
     SET name = $1, slug = $2, description = $3, price = $4,
         discount_price = $5, stock = $6, category_id = $7,
         updated_at = NOW()
     WHERE id = $8 AND vendor_id = $9
     RETURNING *`,
    [
      name,
      slug,
      description,
      price,
      discount_price,
      stock,
      category_id,
      id,
      vendorId,
    ],
  );
  return result.rows[0];
};

// ─── Toggle publish status ────────────────────────────────────
const togglePublish = async (id, vendorId) => {
  const result = await pool.query(
    `UPDATE products
     SET is_published = NOT is_published, updated_at = NOW()
     WHERE id = $1 AND vendor_id = $2
     RETURNING id, name, is_published`,
    [id, vendorId],
  );
  return result.rows[0];
};

// ─── Delete product ───────────────────────────────────────────
const deleteProduct = async (id, vendorId) => {
  await pool.query(`DELETE FROM products WHERE id = $1 AND vendor_id = $2`, [
    id,
    vendorId,
  ]);
};

// ─── Add product image ────────────────────────────────────────
const addProductImage = async (productId, imageUrl, isPrimary) => {
  const result = await pool.query(
    `INSERT INTO product_images (product_id, image_url, is_primary)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [productId, imageUrl, isPrimary],
  );
  return result.rows[0];
};

// ─── Set primary image ────────────────────────────────────────
const setPrimaryImage = async (imageId, productId) => {
  // First remove primary from all images of this product
  await pool.query(
    `UPDATE product_images SET is_primary = false WHERE product_id = $1`,
    [productId],
  );
  // Then set the selected one as primary
  const result = await pool.query(
    `UPDATE product_images SET is_primary = true
     WHERE id = $1 AND product_id = $2
     RETURNING *`,
    [imageId, productId],
  );
  return result.rows[0];
};

// ─── Delete product image ─────────────────────────────────────
const deleteProductImage = async (imageId, productId) => {
  await pool.query(
    `DELETE FROM product_images WHERE id = $1 AND product_id = $2`,
    [imageId, productId],
  );
};

// ─── Get vendor profile by user ID ───────────────────────────
const getVendorProfileByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM vendor_profiles WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0];
};

module.exports = {
  getAllProducts,
  countAllProducts,
  getProductBySlug,
  getProductById,
  getProductBySlugSimple,
  searchProducts,
  getBestSellers,
  getTopRated,
  getVendorProducts,
  createProduct,
  updateProduct,
  togglePublish,
  deleteProduct,
  addProductImage,
  setPrimaryImage,
  deleteProductImage,
  getVendorProfileByUserId,
};
