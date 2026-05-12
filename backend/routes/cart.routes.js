const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const {
  getCart,
  addToCart,
  updateItem,
  removeItem,
  emptyCart,
} = require("../controllers/cart.controller");

// All cart routes require login
router.get("/", verifyToken, getCart);
router.post("/items", verifyToken, addToCart);
router.put("/items/:id", verifyToken, updateItem);
router.delete("/items/:id", verifyToken, removeItem);
router.delete("/clear", verifyToken, emptyCart);

module.exports = router;
