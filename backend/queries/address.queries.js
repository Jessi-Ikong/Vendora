const pool = require("../config/db");

// ─── Get all addresses for a user ────────────────────────────
const getUserAddresses = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return result.rows;
};

// ─── Get single address ───────────────────────────────────────
const getAddressById = async (id, userId) => {
  const result = await pool.query(
    `SELECT * FROM addresses
     WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0];
};

// ─── Create address ───────────────────────────────────────────
const createAddress = async (userId, fields) => {
  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    country,
  } = fields;

  const result = await pool.query(
    `INSERT INTO addresses
      (user_id, full_name, phone, address_line1,
       address_line2, city, state, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      full_name,
      phone,
      address_line1,
      address_line2 || null,
      city,
      state,
      country || "Nigeria",
    ],
  );
  return result.rows[0];
};

// ─── Update address ───────────────────────────────────────────
const updateAddress = async (id, userId, fields) => {
  const {
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    country,
  } = fields;

  const result = await pool.query(
    `UPDATE addresses
     SET full_name = $1, phone = $2, address_line1 = $3,
         address_line2 = $4, city = $5, state = $6, country = $7
     WHERE id = $8 AND user_id = $9
     RETURNING *`,
    [
      full_name,
      phone,
      address_line1,
      address_line2 || null,
      city,
      state,
      country || "Nigeria",
      id,
      userId,
    ],
  );
  return result.rows[0];
};

// ─── Delete address ───────────────────────────────────────────
const deleteAddress = async (id, userId) => {
  await pool.query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
};

// ─── Set default address ──────────────────────────────────────
const setDefaultAddress = async (id, userId) => {
  // First remove default from all user's addresses
  await pool.query(
    `UPDATE addresses SET is_default = false WHERE user_id = $1`,
    [userId],
  );

  // Then set the selected one as default
  const result = await pool.query(
    `UPDATE addresses SET is_default = true
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId],
  );
  return result.rows[0];
};

// ─── Get default address ──────────────────────────────────────
const getDefaultAddress = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM addresses
     WHERE user_id = $1 AND is_default = true`,
    [userId],
  );
  return result.rows[0];
};

module.exports = {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
};
