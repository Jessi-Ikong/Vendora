const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { verifyAdmin } = require("../middleware/role.middleware");
const {
  getCategories,
  getCategory,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} = require("../controllers/category.controller");

// Public routes
router.get("/", getCategories);
router.get("/:slug", getCategory);

// Admin only routes
router.post("/", verifyToken, verifyAdmin, createCategoryHandler);
router.put("/:id", verifyToken, verifyAdmin, updateCategoryHandler);
router.delete("/:id", verifyToken, verifyAdmin, deleteCategoryHandler);

module.exports = router;
