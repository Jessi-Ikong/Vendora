const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// ─── Security Headers ─────────────────────────────────────────
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "data:"],
      fontSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ],
      connectSrc: ["'self'", "https://api.paystack.co"],
      objectSrc: ["'none'"],
    },
  }),
);

// HTTPS Redirect in Production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure && req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

// ─── CORS Configuration ───────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://vendora-1.vercel.app/",
      /\.vercel\.app$/,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);

// ─── Request Size Limits ──────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Global Rate Limiter (15 min window, 100 requests) ────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/", // Skip health checks
});

app.use("/api/", apiLimiter);

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/reviews", require("./routes/review.routes"));
app.use("/api/wishlist", require("./routes/wishlist.routes"));
app.use("/api/addresses", require("./routes/address.routes"));
app.use("/api/vendors", require("./routes/vendor.routes"));
// app.use("/api/buyers",     require("./routes/buyer.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// ─── Health Check ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Vendora API 🛒" });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  // Log full error details for debugging (server-side only)
  console.error("[ERROR]", {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Safe response to client (no sensitive details)
  if (statusCode === 500) {
    return res.status(500).json({
      message: "An error occurred. Please try again later.",
      ...(process.env.NODE_ENV === "development" && {
        error: err.message,
        stack: err.stack,
      }),
    });
  }

  res.status(statusCode).json({
    message: err.message || "An error occurred",
  });
});

module.exports = app;
