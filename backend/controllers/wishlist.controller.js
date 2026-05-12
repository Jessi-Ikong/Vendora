const {
  getWishlist,
  getWishlistItem,
  addToWishlist,
  removeFromWishlist,
} = require("../queries/wishlist.queries");
const { getProductById } = require("../queries/product.queries");
const {
  getCartByUserId,
  getCartItem,
  addItemToCart,
  updateCartItemQuantity,
} = require("../queries/cart.queries");

// ─── GET wishlist ─────────────────────────────────────────────
const getUserWishlist = async (req, res) => {
  try {
    const items = await getWishlist(req.user.id);
    res.status(200).json({
      wishlist: {
        item_count: items.length,
        items,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── ADD to wishlist ──────────────────────────────────────────
const addItem = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Check product exists
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Check not already in wishlist
    const existing = await getWishlistItem(req.user.id, productId);
    if (existing) {
      return res.status(400).json({
        message: "Product already in wishlist",
      });
    }

    // 3. Add to wishlist
    await addToWishlist(req.user.id, productId);

    res.status(201).json({
      message: "Product added to wishlist",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── REMOVE from wishlist ─────────────────────────────────────
const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const existing = await getWishlistItem(req.user.id, productId);
    if (!existing) {
      return res.status(404).json({
        message: "Product not found in wishlist",
      });
    }

    await removeFromWishlist(req.user.id, productId);

    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── MOVE to cart ─────────────────────────────────────────────
const moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Check product exists and is available
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.is_published) {
      return res.status(400).json({
        message: "Product is no longer available",
      });
    }

    if (product.stock < 1) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    // 2. Get user's cart
    const cart = await getCartByUserId(req.user.id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 3. Check if already in cart
    const existingCartItem = await getCartItem(cart.id, productId);
    if (existingCartItem) {
      // Update quantity
      await updateCartItemQuantity(
        existingCartItem.id,
        cart.id,
        existingCartItem.quantity + 1,
      );
    } else {
      // Add to cart
      await addItemToCart(cart.id, productId, 1);
    }

    // 4. Remove from wishlist
    await removeFromWishlist(req.user.id, productId);

    res.status(200).json({
      message: "Product moved to cart successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getUserWishlist,
  addItem,
  removeItem,
  moveToCart,
};
