require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

// ─── Validate Required Environment Variables ──────────────────
const requiredEnvVars = [
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "PAYSTACK_SECRET_KEY",
];

// Check for database config: either DATABASE_URL (Render) or individual DB_* vars (local)
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasIndividualDbVars =
  process.env.DB_HOST &&
  process.env.DB_PORT &&
  process.env.DB_NAME &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD;

if (!hasDatabaseUrl && !hasIndividualDbVars) {
  console.error("❌ Missing database configuration:");
  console.error(
    "   Provide either DATABASE_URL or individual DB_* variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)",
  );
  process.exit(1);
}

const missingEnvVars = requiredEnvVars.filter((env) => !process.env[env]);
if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((env) => console.error(`   - ${env}`));
  process.exit(1);
}

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Vendora server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
