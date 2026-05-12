const {
  getAllUsers,
  getUserById,
  toggleUserStatus,
  deleteUser,
  getAllVendors,
  getVendorById,
  approveVendor,
  rejectVendor,
  getAllProducts,
  deleteProduct,
  getAllOrders,
  getOrderById,
  getAllReviews,
  deleteReview,
  getAnalyticsOverview,
  getMonthlyRevenue,
  getTopVendors,
  getTopProducts,
} = require("../queries/admin.queries");
const { getOrderItems } = require("../queries/order.queries");

// ─── Get all users ────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get single user ──────────────────────────────────────────
const getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Suspend or reactivate user ───────────────────────────────
const toggleStatus = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from suspending themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot suspend your own account",
      });
    }

    const updated = await toggleUserStatus(req.params.id);
    res.status(200).json({
      message: `User ${updated.is_active ? "reactivated" : "suspended"} successfully`,
      user: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Delete user ──────────────────────────────────────────────
const removeUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    await deleteUser(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get all vendors ──────────────────────────────────────────
const getVendors = async (req, res) => {
  try {
    const vendors = await getAllVendors();
    res.status(200).json({ vendors });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get single vendor ────────────────────────────────────────
const getVendor = async (req, res) => {
  try {
    const vendor = await getVendorById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.status(200).json({ vendor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Approve vendor ───────────────────────────────────────────
const approve = async (req, res) => {
  try {
    const vendor = await getVendorById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const approved = await approveVendor(req.params.id);
    res.status(200).json({
      message: "Vendor approved successfully",
      vendor: approved,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Reject vendor ────────────────────────────────────────────
const reject = async (req, res) => {
  try {
    const vendor = await getVendorById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const rejected = await rejectVendor(req.params.id);
    res.status(200).json({
      message: "Vendor rejected",
      vendor: rejected,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get all products ─────────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Delete any product ───────────────────────────────────────
const removeProduct = async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get all orders ───────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const { status, payment_status } = req.query;
    const orders = await getAllOrders({
      status,
      paymentStatus: payment_status,
    });
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get single order ─────────────────────────────────────────
const getOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const items = await getOrderItems(order.id);
    res.status(200).json({ order: { ...order, items } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get all reviews ──────────────────────────────────────────
const getReviews = async (req, res) => {
  try {
    const reviews = await getAllReviews();
    res.status(200).json({ reviews });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Delete any review ────────────────────────────────────────
const removeReview = async (req, res) => {
  try {
    await deleteReview(req.params.id);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Analytics overview ───────────────────────────────────────
const analyticsOverview = async (req, res) => {
  try {
    const overview = await getAnalyticsOverview();
    res.status(200).json({ overview });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Monthly revenue ──────────────────────────────────────────
const analyticsRevenue = async (req, res) => {
  try {
    const revenue = await getMonthlyRevenue();
    res.status(200).json({ revenue });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Top vendors ──────────────────────────────────────────────
const analyticsTopVendors = async (req, res) => {
  try {
    const vendors = await getTopVendors(req.query.limit || 5);
    res.status(200).json({ vendors });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Top products ─────────────────────────────────────────────
const analyticsTopProducts = async (req, res) => {
  try {
    const products = await getTopProducts(req.query.limit || 5);
    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  toggleStatus,
  removeUser,
  getVendors,
  getVendor,
  approve,
  reject,
  getProducts,
  removeProduct,
  getOrders,
  getOrder,
  getReviews,
  removeReview,
  analyticsOverview,
  analyticsRevenue,
  analyticsTopVendors,
  analyticsTopProducts,
};
