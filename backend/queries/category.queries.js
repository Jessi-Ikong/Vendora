const pool = require("../config/db");

// ─── Get all categories ───────────────────────────────────────
const getAllCategories = async () => {
  const result = await pool.query(
    `SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.image,
      c.parent_id,
      p.name AS parent_name,
      COUNT(pr.id) AS product_count
     FROM categories c
     LEFT JOIN categories p ON c.parent_id = p.id
     LEFT JOIN products pr ON pr.category_id = c.id AND pr.is_published = true
     GROUP BY c.id, p.name
     ORDER BY c.name ASC`,
  );
  return result.rows;
};

// ─── Get single category by slug ─────────────────────────────
const getCategoryBySlug = async (slug) => {
  const result = await pool.query(
    `SELECT
      c.*,
      p.name AS parent_name
     FROM categories c
     LEFT JOIN categories p ON c.parent_id = p.id
     WHERE c.slug = $1`,
    [slug],
  );
  return result.rows[0];
};

// ─── Get category by ID ───────────────────────────────────────
const getCategoryById = async (id) => {
  const result = await pool.query(`SELECT * FROM categories WHERE id = $1`, [
    id,
  ]);
  return result.rows[0];
};

// ─── Get category by name ─────────────────────────────────────
const getCategoryByName = async (name) => {
  const result = await pool.query(
    `SELECT * FROM categories WHERE LOWER(name) = LOWER($1)`,
    [name],
  );
  return result.rows[0];
};

// ─── Create category ──────────────────────────────────────────
const createCategory = async (name, slug, description, image, parent_id) => {
  const result = await pool.query(
    `INSERT INTO categories (name, slug, description, image, parent_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, slug, description, image, parent_id],
  );
  return result.rows[0];
};

// ─── Update category ──────────────────────────────────────────
const updateCategory = async (
  id,
  name,
  slug,
  description,
  image,
  parent_id,
) => {
  const result = await pool.query(
    `UPDATE categories
     SET name = $1, slug = $2, description = $3,
         image = $4, parent_id = $5
     WHERE id = $6
     RETURNING *`,
    [name, slug, description, image, parent_id, id],
  );
  return result.rows[0];
};

// ─── Delete category ──────────────────────────────────────────
const deleteCategory = async (id) => {
  await pool.query(`DELETE FROM categories WHERE id = $1`, [id]);
};

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
};
