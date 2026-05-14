const { Pool } = require("pg");
require("dotenv").config();

// Configure pool based on environment
let poolConfig;

console.log("🔍 Checking database configuration...");
console.log(
  "   DATABASE_URL:",
  process.env.DATABASE_URL ? "SET (Render)" : "NOT SET",
);
console.log("   DB_HOST:", process.env.DB_HOST || "NOT SET");
console.log("   DB_PORT:", process.env.DB_PORT || "NOT SET");
console.log("   DB_NAME:", process.env.DB_NAME || "NOT SET");
console.log("   DB_USER:", process.env.DB_USER || "NOT SET");

if (process.env.DATABASE_URL) {
  console.log("\n✓ Using DATABASE_URL (Render/Production)");
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  };
} else if (
  process.env.DB_HOST &&
  process.env.DB_PORT &&
  process.env.DB_NAME &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD
) {
  console.log("\n✓ Using individual DB_* variables (Local Development)");
  poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  };
  console.log(
    `   Connecting to postgresql://${poolConfig.user}@${poolConfig.host}:${poolConfig.port}/${poolConfig.database}\n`,
  );
} else {
  console.error("\n❌ Missing database configuration!");
  console.error(
    "   Provide either DATABASE_URL or all DB_* variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)",
  );
  process.exit(1);
}

const pool = new Pool(poolConfig);

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:");
    console.error(`   Error: ${err.message}`);

    if (err.code === "ECONNREFUSED") {
      console.error("\n   📍 Troubleshooting ECONNREFUSED:");
      console.error("      1. Make sure PostgreSQL is running");
      console.error(`      2. Verify database '${poolConfig.database}' exists`);
      console.error(
        `      3. Check credentials: ${poolConfig.user}@${poolConfig.host}:${poolConfig.port}`,
      );
      console.error("      4. Run: psql -U postgres");
      console.error(`      5. Then: CREATE DATABASE ${poolConfig.database};`);
    } else if (err.code === "FATAL") {
      console.error("\n   📍 Check your database credentials (user/password)");
    } else {
      console.error(`\n   Error Code: ${err.code}`);
    }
  } else {
    console.log("✅ Database connected successfully");
    release();
  }
});

module.exports = pool;
