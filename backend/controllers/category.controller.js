const slugify = require("../utils/slugify");
const {
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../queries/category.queries");

// ─── Get all categories ───────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get single category ──────────────────────────────────────
const getCategory = async (req, res) => {
  try {
    const category = await getCategoryBySlug(req.params.slug);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ category });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Create category (Admin only) ────────────────────────────
const createCategoryHandler = async (req, res) => {
  try {
    const { name, description, image, parent_id } = req.body;

    // 1. Check name is provided
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // 2. Check for duplicate name
    const existing = await getCategoryByName(name);
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // 3. Generate slug from name
    const slug = slugify(name);

    // 4. Create category
    const category = await createCategory(
      name,
      slug,
      description || null,
      image || null,
      parent_id || null,
    );

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Update category (Admin only) ────────────────────────────
const updateCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, parent_id } = req.body;

    // 1. Check category exists
    const existing = await getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2. Generate new slug if name changed
    const newName = name || existing.name;
    const newSlug = slugify(newName);

    // 3. Update
    const updated = await updateCategory(
      id,
      newName,
      newSlug,
      description !== undefined ? description : existing.description,
      image !== undefined ? image : existing.image,
      parent_id !== undefined ? parent_id : existing.parent_id,
    );

    res.status(200).json({
      message: "Category updated successfully",
      category: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Delete category (Admin only) ────────────────────────────
const deleteCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check category exists
    const existing = await getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2. Delete it
    await deleteCategory(id);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
};
