const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { verifyAdmin } = require("../middleware/role.middleware");
const {
  getUsers,
  getUser,
  toggleStatus,
  removeUser,
  getVendors,
  getVendor,
  approve,
  reject,
  getProducts,
  removeProduct,
  getOrders,
  getOrder,
  getReviews,
  removeReview,
  analyticsOverview,
  analyticsRevenue,
  analyticsTopVendors,
  analyticsTopProducts,
} = require("../controllers/admin.controller");

// All admin routes require login AND admin role
router.use(verifyToken, verifyAdmin);

// ─── Analytics — defined FIRST to avoid /:id conflicts ────────
router.get("/analytics/overview", analyticsOverview);
router.get("/analytics/revenue", analyticsRevenue);
router.get("/analytics/top-vendors", analyticsTopVendors);
router.get("/analytics/top-products", analyticsTopProducts);

// ─── User Management ──────────────────────────────────────────
router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.put("/users/:id/suspend", toggleStatus);
router.delete("/users/:id", removeUser);

// ─── Vendor Management ────────────────────────────────────────
router.get("/vendors", getVendors);
router.get("/vendors/:id", getVendor);
router.put("/vendors/:id/approve", approve);
router.put("/vendors/:id/reject", reject);

// ─── Product Management ───────────────────────────────────────
router.get("/products", getProducts);
router.delete("/products/:id", removeProduct);

// ─── Order Management ─────────────────────────────────────────
router.get("/orders", getOrders);
router.get("/orders/:id", getOrder);

// ─── Review Management ────────────────────────────────────────
router.get("/reviews", getReviews);
router.delete("/reviews/:id", removeReview);

module.exports = router;
