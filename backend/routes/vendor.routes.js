const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { verifyVendor } = require("../middleware/role.middleware");
const {
  setupStore,
  getMyStore,
  updateStore,
  getPublicStore,
  getDashboard,
  getOrders,
  updateItemStatus,
} = require("../controllers/vendor.controller");

// Protected — any logged in user can setup a store
router.post("/setup", verifyToken, setupStore);

// Vendor only routes
router.get("/dashboard/stats", verifyToken, verifyVendor, getDashboard);
router.get("/store/profile", verifyToken, verifyVendor, getMyStore);
router.put("/store/profile", verifyToken, verifyVendor, updateStore);
router.get("/store/orders", verifyToken, verifyVendor, getOrders);
router.put(
  "/store/orders/:id/status",
  verifyToken,
  verifyVendor,
  updateItemStatus,
);

// Public route LAST — otherwise /:slug catches everything above
router.get("/:slug", getPublicStore);

module.exports = router;
