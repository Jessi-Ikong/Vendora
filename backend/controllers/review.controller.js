const xss = require("xss");
const {
  getProductReviews,
  getReviewById,
  getExistingReview,
  verifyPurchase,
  createReview,
  updateReview,
  deleteReview,
  updateProductRating,
} = require("../queries/review.queries");
const { getProductById } = require("../queries/product.queries");

// ─── GET all reviews for a product ───────────────────────────
const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = await getProductReviews(productId);

    // Calculate rating breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => breakdown[r.rating]++);

    res.status(200).json({
      reviews,
      total: reviews.length,
      average_rating: product.average_rating,
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── ADD review ───────────────────────────────────────────────
const addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // 1. Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // 2. Check product exists
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 3. Check buyer actually purchased this product
    const purchased = await verifyPurchase(productId, req.user.id);
    if (!purchased) {
      return res.status(403).json({
        message: "You can only review products you have purchased",
      });
    }

    // 4. Check buyer hasn't already reviewed this product
    const existing = await getExistingReview(productId, req.user.id);
    if (existing) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    // 5. Create review
    const review = await createReview(
      productId,
      req.user.id,
      rating,
      xss(comment || "", {
        whiteList: {}, // No HTML tags allowed
        stripIgnoredTag: true,
      }),
    );

    // 6. Update product average rating
    await updateProductRating(productId);

    res.status(201).json({
      message: "Review added successfully",
      review,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── EDIT review ──────────────────────────────────────────────
const editReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // 1. Check review exists and belongs to user
    const existing = await getReviewById(id);
    if (!existing) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only edit your own reviews",
      });
    }

    // 2. Update review
    const updated = await updateReview(
      id,
      req.user.id,
      rating || existing.rating,
      comment !== undefined
        ? xss(comment || "", {
            whiteList: {},
            stripIgnoredTag: true,
          })
        : existing.comment,
    );

    // 3. Update product average rating
    await updateProductRating(existing.product_id);

    res.status(200).json({
      message: "Review updated successfully",
      review: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── DELETE review ────────────────────────────────────────────
const removeReview = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await getReviewById(id);
    if (!existing) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only delete your own reviews",
      });
    }

    await deleteReview(id, req.user.id);

    // Update product average rating after deletion
    await updateProductRating(existing.product_id);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getReviews,
  addReview,
  editReview,
  removeReview,
};
