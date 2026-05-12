const pool = require("../config/db");

// ─── Find user by email ───────────────────────────────────────
// Used during login to check if email exists
const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return result.rows[0]; // returns one user or undefined
};

// ─── Find user by ID ─────────────────────────────────────────
// Used to get current logged in user's data
const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, role, avatar, is_active, is_verified, created_at
     FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0];
  // Notice we don't select password here — never send password to frontend
};

// ─── Create new user ─────────────────────────────────────────
// Used during registration
const createUser = async (name, email, hashedPassword, role) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword, role],
  );
  return result.rows[0];
  // RETURNING gives us back the newly created row immediately
  // without needing a second SELECT query
};

// ─── Update user profile ─────────────────────────────────────
const updateUserProfile = async (id, name, avatar) => {
  const result = await pool.query(
    `UPDATE users
     SET name = $1, avatar = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, email, role, avatar`,
    [name, avatar, id],
  );
  return result.rows[0];
};

// ─── Update user password ─────────────────────────────────────
const updateUserPassword = async (id, hashedPassword) => {
  await pool.query(
    `UPDATE users
     SET password = $1, updated_at = NOW()
     WHERE id = $2`,
    [hashedPassword, id],
  );
};

// ─── Save password reset token ────────────────────────────────
const saveResetToken = async (email, token, expires) => {
  await pool.query(
    `UPDATE users
     SET reset_token = $1, reset_token_expires = $2
     WHERE email = $3`,
    [token, expires, email],
  );
};

// ─── Find user by reset token ─────────────────────────────────
const findUserByResetToken = async (token) => {
  const result = await pool.query(
    `SELECT * FROM users
     WHERE reset_token = $1
     AND reset_token_expires > NOW()`,
    // NOW() check ensures expired tokens are rejected
    [token],
  );
  return result.rows[0];
};

// ─── Clear reset token after use ─────────────────────────────
const clearResetToken = async (id) => {
  await pool.query(
    `UPDATE users
     SET reset_token = NULL, reset_token_expires = NULL
     WHERE id = $1`,
    [id],
  );
};

// ─── Create cart for new user ─────────────────────────────────
// Every buyer gets a cart automatically on registration
const createCartForUser = async (userId) => {
  await pool.query(`INSERT INTO carts (user_id) VALUES ($1)`, [userId]);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  updateUserPassword,
  saveResetToken,
  findUserByResetToken,
  clearResetToken,
  createCartForUser,
};
