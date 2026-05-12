const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const {
  getReviews,
  addReview,
  editReview,
  removeReview,
} = require("../controllers/review.controller");

// Public
router.get("/product/:productId", getReviews);

// Protected
router.post("/product/:productId", verifyToken, addReview);
router.put("/:id", verifyToken, editReview);
router.delete("/:id", verifyToken, removeReview);

module.exports = router;
