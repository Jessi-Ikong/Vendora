require("dotenv").config();

// ─── Validate Required Environment Variables ──────────────────
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "PAYSTACK_SECRET_KEY",
];

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
