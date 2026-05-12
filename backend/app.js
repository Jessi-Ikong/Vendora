const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/cart",       require("./routes/cart.routes"));
app.use("/api/orders",     require("./routes/order.routes"));
app.use("/api/payments",   require("./routes/payment.routes"));
app.use("/api/reviews",    require("./routes/review.routes"));
app.use("/api/wishlist",   require("./routes/wishlist.routes"));
app.use("/api/addresses",  require("./routes/address.routes"));
app.use("/api/vendors",    require("./routes/vendor.routes"));
// app.use("/api/buyers",     require("./routes/buyer.routes"));
app.use("/api/admin",      require("./routes/admin.routes"));

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
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

module.exports = app;
