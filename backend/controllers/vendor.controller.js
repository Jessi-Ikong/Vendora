const slugify = require("../utils/slugify");
const {
  getVendorByUserId,
  getVendorBySlug,
  createVendorProfile,
  updateVendorProfile,
  getVendorStats,
  getVendorMonthlyRevenue,
  getVendorBestSellers,
  getLowStockProducts,
} = require("../queries/vendor.queries");
const {
  getVendorOrders,
  updateOrderItemStatus,
  updateOrderStatusFromItems,
  getOrderItems,
} = require("../queries/order.queries");
const pool = require("../config/db");

// ─── Setup store (vendor registration) ───────────────────────
const setupStore = async (req, res) => {
  try {
    const { store_name, description } = req.body;

    if (!store_name) {
      return res.status(400).json({ message: "Store name is required" });
    }

    // Check user is a vendor
    if (req.user.role !== "vendor") {
      return res.status(403).json({
        message: "Only vendor accounts can set up a store",
      });
    }

    // Check store doesn't already exist
    const existing = await getVendorByUserId(req.user.id);
    if (existing) {
      return res.status(400).json({
        message: "You already have a store",
      });
    }

    // Generate unique slug
    let slug = slugify(store_name);
    let slugCheck = await getVendorBySlug(slug);
    let counter = 1;

    while (slugCheck) {
      slug = `${slugify(store_name)}-${counter}`;
      slugCheck = await getVendorBySlug(slug);
      counter++;
    }

    const vendor = await createVendorProfile(
      req.user.id,
      store_name,
      slug,
      description || null,
    );

    res.status(201).json({
      message: "Store created successfully. Pending admin approval.",
      vendor,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get own store profile ────────────────────────────────────
const getMyStore = async (req, res) => {
  try {
    const vendor = await getVendorByUserId(req.user.id);

    if (!vendor) {
      return res.status(404).json({
        message: "Store not found. Please set up your store first.",
      });
    }

    res.status(200).json({ vendor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Update store profile ─────────────────────────────────────
const updateStore = async (req, res) => {
  try {
    const { store_name, description, logo, banner } = req.body;

    const existing = await getVendorByUserId(req.user.id);
    if (!existing) {
      return res.status(404).json({ message: "Store not found" });
    }

    // Regenerate slug if store name changed
    const newName = store_name || existing.store_name;
    const newSlug = store_name ? slugify(store_name) : existing.store_slug;

    const updated = await updateVendorProfile(req.user.id, {
      store_name: newName,
      store_slug: newSlug,
      description:
        description !== undefined ? description : existing.description,
      logo: logo !== undefined ? logo : existing.logo,
      banner: banner !== undefined ? banner : existing.banner,
    });

    res.status(200).json({
      message: "Store updated successfully",
      vendor: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get public store page ────────────────────────────────────
const getPublicStore = async (req, res) => {
  try {
    const vendor = await getVendorBySlug(req.params.slug);

    if (!vendor || !vendor.is_approved) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.status(200).json({ vendor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get vendor dashboard ─────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const vendor = await getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Store not found" });
    }

    const [stats, monthlyRevenue, bestSellers, lowStock, recentOrders] =
      await Promise.all([
        getVendorStats(vendor.id),
        getVendorMonthlyRevenue(vendor.id),
        getVendorBestSellers(vendor.id, 5),
        getLowStockProducts(vendor.id, 5),
        getVendorOrders(vendor.id),
      ]);

    res.status(200).json({
      stats,
      monthlyRevenue,
      bestSellers,
      lowStock,
      recentOrders: recentOrders.slice(0, 10), // last 10 orders
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get vendor orders ────────────────────────────────────────
const getOrders = async (req, res) => {
  try {
    const vendor = await getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Store not found" });
    }

    const orders = await getVendorOrders(vendor.id);
    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Update order item status ─────────────────────────────────
const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["processing", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be processing, shipped or delivered",
      });
    }

    const vendor = await getVendorByUserId(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Store not found" });
    }

    const updated = await updateOrderItemStatus(id, vendor.id, status);
    if (!updated) {
      return res.status(404).json({ message: "Order item not found" });
    }

    // Update the parent order's status based on all its items
    await updateOrderStatusFromItems(updated.order_id);

    res.status(200).json({
      message: `Order item marked as ${status}`,
      item: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  setupStore,
  getMyStore,
  updateStore,
  getPublicStore,
  getDashboard,
  getOrders,
  updateItemStatus,
};
