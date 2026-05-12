const {
  getCartByUserId,
  getCartWithItems,
  getCartItem,
  getCartItemById,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} = require("../queries/cart.queries");
const { getProductById } = require("../queries/product.queries");

// ─── Helper — calculate cart total ───────────────────────────
const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    // If item has no product (empty cart row) skip it
    if (!item.product_id) return total;
    return total + parseFloat(item.subtotal || 0);
  }, 0);
};

// ─── GET cart ─────────────────────────────────────────────────
const getCart = async (req, res) => {
  try {
    const rows = await getCartWithItems(req.user.id);

    // If cart is empty, rows will have one row with null item_id
    const items = rows.filter((row) => row.item_id !== null);

    const total = calculateTotal(items);

    res.status(200).json({
      cart: {
        item_count: items.length,
        total: total.toFixed(2),
        items,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── ADD item to cart ─────────────────────────────────────────
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // 1. Get the product
    const product = await getProductById(product_id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Check product is published
    if (!product.is_published) {
      return res.status(400).json({ message: "Product is not available" });
    }

    // 3. Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // 4. Get user's cart
    const cart = await getCartByUserId(req.user.id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 5. Check if product already in cart
    const existingItem = await getCartItem(cart.id, product_id);

    if (existingItem) {
      // Update quantity instead of adding duplicate
      const newQuantity = existingItem.quantity + parseInt(quantity);

      // Check stock for new quantity
      if (product.stock < newQuantity) {
        return res.status(400).json({
          message: `Only ${product.stock} items available in stock`,
        });
      }

      const updated = await updateCartItemQuantity(
        existingItem.id,
        cart.id,
        newQuantity,
      );

      return res.status(200).json({
        message: "Cart updated successfully",
        item: updated,
      });
    }

    // 6. Add new item to cart
    const item = await addItemToCart(cart.id, product_id, quantity);

    res.status(201).json({
      message: "Item added to cart",
      item,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── UPDATE item quantity ─────────────────────────────────────
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1",
      });
    }

    // Get user's cart
    const cart = await getCartByUserId(req.user.id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check item exists in this cart
    const item = await getCartItemById(id, cart.id);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Check stock
    const product = await getProductById(item.product_id);
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available in stock`,
      });
    }

    const updated = await updateCartItemQuantity(id, cart.id, quantity);

    res.status(200).json({
      message: "Cart updated successfully",
      item: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── REMOVE item from cart ────────────────────────────────────
const removeItem = async (req, res) => {
  try {
    const { id } = req.params;

    const cart = await getCartByUserId(req.user.id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = await getCartItemById(id, cart.id);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await removeCartItem(id, cart.id);

    res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── CLEAR entire cart ────────────────────────────────────────
const emptyCart = async (req, res) => {
  try {
    const cart = await getCartByUserId(req.user.id);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    await clearCart(cart.id);

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateItem,
  removeItem,
  emptyCart,
};
