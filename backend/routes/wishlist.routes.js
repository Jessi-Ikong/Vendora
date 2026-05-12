const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const {
  getUserWishlist,
  addItem,
  removeItem,
  moveToCart,
} = require("../controllers/wishlist.controller");

// All wishlist routes require login
router.get("/", verifyToken, getUserWishlist);
router.post("/:productId", verifyToken, addItem);
router.delete("/:productId", verifyToken, removeItem);
router.post("/:productId/move-to-cart", verifyToken, moveToCart);

module.exports = router;
