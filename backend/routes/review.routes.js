const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  validateCreateReview,
  validateUpdateReview,
} = require("../validators/review.validators");
const {
  getReviews,
  addReview,
  editReview,
  removeReview,
} = require("../controllers/review.controller");

// Public
router.get("/product/:productId", getReviews);

// Protected
router.post(
  "/product/:productId",
  verifyToken,
  validateCreateReview,
  validate,
  addReview,
);
router.put("/:id", verifyToken, validateUpdateReview, validate, editReview);
router.delete("/:id", verifyToken, removeReview);

module.exports = router;
