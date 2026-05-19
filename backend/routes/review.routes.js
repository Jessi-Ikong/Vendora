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
  checkReviewEligibility,
} = require("../controllers/review.controller");

// ─── Optional Auth Middleware ─────────────────────────────────
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    verifyToken(req, res, next);
  } else {
    // User not authenticated, but that's OK for this endpoint
    next();
  }
};

// Public
router.get("/product/:productId", getReviews);

// Check eligibility (optional auth)
router.get("/product/:productId/check-eligibility", optionalAuth, checkReviewEligibility);

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
