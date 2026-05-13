const slugify = require("../utils/slugify");
const { paginate, paginateMeta } = require("../utils/pagination");
const {
  getAllProducts,
  countAllProducts,
  getProductBySlug,
  getProductById,
  getProductBySlugSimple,
  searchProducts,
  getBestSellers,
  getTopRated,
  getVendorProducts,
  createProduct,
  updateProduct,
  togglePublish,
  deleteProduct,
  addProductImage,
  setPrimaryImage,
  deleteProductImage,
  getVendorProfileByUserId,
} = require("../queries/product.queries");

// ─── GET all products (public) ────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const {
      page,
      limit: lim,
      category,
      minPrice,
      maxPrice,
      rating,
      vendorId,
      sort,
    } = req.query;

    const { limit, offset, page: currentPage } = paginate(page, lim);

    const filters = { category, minPrice, maxPrice, rating, vendorId, sort };

    const [products, total] = await Promise.all([
      getAllProducts({ limit, offset, ...filters }),
      countAllProducts(filters),
    ]);

    res.status(200).json({
      products,
      pagination: paginateMeta(total, currentPage, limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET single product (public) ─────────────────────────────
const getProduct = async (req, res) => {
  try {
    const product = await getProductBySlug(req.params.slug);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Search products (public) ─────────────────────────────────
const search = async (req, res) => {
  try {
    const { q, page, limit: lim } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search keyword is required" });
    }

    const { limit, offset } = paginate(page, lim);
    const products = await searchProducts(q, limit, offset);

    res.status(200).json({ products, keyword: q });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET best sellers (public) ────────────────────────────────
const bestSellers = async (req, res) => {
  try {
    const products = await getBestSellers(req.query.limit || 8);
    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET top rated (public) ───────────────────────────────────
const topRated = async (req, res) => {
  try {
    const products = await getTopRated(req.query.limit || 8);
    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── GET vendor's own products (vendor only) ──────────────────
const getMyProducts = async (req, res) => {
  try {
    const vendorProfile = await getVendorProfileByUserId(req.user.id);

    if (!vendorProfile) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const { page, limit: lim } = req.query;
    const { limit, offset, page: currentPage } = paginate(page, lim);

    const products = await getVendorProducts(vendorProfile.id, limit, offset);

    res.status(200).json({ products });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── CREATE product (vendor only) ────────────────────────────
const createProductHandler = async (req, res) => {
  try {
    const { name, description, price, discount_price, stock, category_id } =
      req.body;

    // 1. Get vendor profile
    const vendorProfile = await getVendorProfileByUserId(req.user.id);
    if (!vendorProfile) {
      return res.status(404).json({
        message: "Vendor profile not found. Please set up your store first.",
      });
    }

    // 2. Check vendor is approved
    if (!vendorProfile.is_approved) {
      return res
        .status(403)
        .json({ message: "Your store is pending approval." });
    }

    // 3. Generate unique slug
    let slug = slugify(name);
    let existing = await getProductBySlugSimple(slug);
    let counter = 1;

    // If slug exists, append a number until unique
    while (existing) {
      slug = `${slugify(name)}-${counter}`;
      existing = await getProductBySlugSimple(slug);
      counter++;
    }

    // 4. Create product
    const product = await createProduct(
      vendorProfile.id,
      category_id || null,
      name,
      slug,
      description || null,
      price,
      discount_price || null,
      stock || 0,
    );

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── UPDATE product (vendor only) ────────────────────────────
const updateProductHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorProfile = await getVendorProfileByUserId(req.user.id);

    if (!vendorProfile) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    // Get existing product
    const existing = await getProductById(id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Make sure vendor owns this product
    if (existing.vendor_id !== vendorProfile.id) {
      return res
        .status(403)
        .json({ message: "You can only edit your own products" });
    }

    const { name, description, price, discount_price, stock, category_id } =
      req.body;

    // Regenerate slug if name changed
    const newName = name || existing.name;
    const newSlug = name ? slugify(name) : existing.slug;

    const updated = await updateProduct(id, vendorProfile.id, {
      name: newName,
      slug: newSlug,
      description:
        description !== undefined ? description : existing.description,
      price: price !== undefined ? price : existing.price,
      discount_price:
        discount_price !== undefined ? discount_price : existing.discount_price,
      stock: stock !== undefined ? stock : existing.stock,
      category_id:
        category_id !== undefined ? category_id : existing.category_id,
    });

    res.status(200).json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── TOGGLE publish (vendor only) ────────────────────────────
const togglePublishHandler = async (req, res) => {
  try {
    const vendorProfile = await getVendorProfileByUserId(req.user.id);
    if (!vendorProfile) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const product = await togglePublish(req.params.id, vendorProfile.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: `Product ${product.is_published ? "published" : "unpublished"} successfully`,
      product,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── DELETE product (vendor only) ────────────────────────────
const deleteProductHandler = async (req, res) => {
  try {
    const vendorProfile = await getVendorProfileByUserId(req.user.id);
    if (!vendorProfile) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    const existing = await getProductById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (existing.vendor_id !== vendorProfile.id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own products" });
    }

    await deleteProduct(req.params.id, vendorProfile.id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── ADD product image (vendor only) ─────────────────────────
const addImageHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, is_primary } = req.body;

    if (!image_url) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const image = await addProductImage(id, image_url, is_primary || false);

    res.status(201).json({
      message: "Image added successfully",
      image,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── SET primary image (vendor only) ─────────────────────────
const setPrimaryImageHandler = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const image = await setPrimaryImage(imageId, id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.status(200).json({
      message: "Primary image updated",
      image,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── DELETE product image (vendor only) ──────────────────────
const deleteImageHandler = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    await deleteProductImage(imageId, id);
    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const { uploadImage } = require("../utils/cloudinaryUpload");

// ─── UPLOAD product image file (vendor only) ──────────────────
const uploadImageHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check file was provided
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image file",
      });
    }

    // Check vendor owns this product
    const vendorProfile = await getVendorProfileByUserId(req.user.id);
    if (!vendorProfile) {
      return res.status(404).json({
        message: "Vendor profile not found",
      });
    }

    const product = await getProductById(id);
    if (!product || product.vendor_id !== vendorProfile.id) {
      return res.status(403).json({
        message: "You can only upload images for your own products",
      });
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.buffer, "vendora/products");

    // Save URL to database
    const isPrimary = req.body.is_primary === "true";
    const image = await addProductImage(id, result.secure_url, isPrimary);

    res.status(201).json({
      message: "Image uploaded successfully",
      image_url: result.secure_url,
      image,
    });
  } catch (err) {
    res.status(500).json({
      message: "Upload failed",
      error: err.message,
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  search,
  bestSellers,
  topRated,
  getMyProducts,
  createProductHandler,
  updateProductHandler,
  togglePublishHandler,
  deleteProductHandler,
  addImageHandler,
  setPrimaryImageHandler,
  deleteImageHandler,
  uploadImageHandler,
};
