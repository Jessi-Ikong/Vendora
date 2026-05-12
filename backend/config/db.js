const { Pool } = require("pg");
require("dotenv").config();

// Create a connection pool
// A pool manages multiple database connections efficiently
// Instead of opening and closing a connection for every query,
// the pool keeps connections open and reuses them
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection when the server starts
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected successfully");
    release(); // return the connection back to the pool
  }
});

module.exports = pool;
