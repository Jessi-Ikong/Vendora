const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const { verifyVendor } = require("../middleware/role.middleware");
const {
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
} = require("../controllers/product.controller");

// ─── Public routes ────────────────────────────────────────────
router.get("/", getProducts);
router.get("/search", search);
router.get("/best-sellers", bestSellers);
router.get("/top-rated", topRated);
router.get("/:slug", getProduct);

// ─── Vendor only routes ───────────────────────────────────────
router.get("/vendor/mine", verifyToken, verifyVendor, getMyProducts);
router.post("/", verifyToken, verifyVendor, createProductHandler);
router.put("/:id", verifyToken, verifyVendor, updateProductHandler);
router.put("/:id/publish", verifyToken, verifyVendor, togglePublishHandler);
router.delete("/:id", verifyToken, verifyVendor, deleteProductHandler);
// router.post("/:id/images", verifyToken, verifyVendor, addImageHandler);
const upload = require("../middleware/upload.middleware");

router.post(
  "/:id/images",
  verifyToken,
  verifyVendor,
  upload.single("image"),
  addImageHandler,
);

// New route for direct file upload
router.post(
  "/:id/images/upload",
  verifyToken,
  verifyVendor,
  upload.single("image"),
  uploadImageHandler,
);
router.put(
  "/:id/images/:imageId/primary",
  verifyToken,
  verifyVendor,
  setPrimaryImageHandler,
);
router.delete(
  "/:id/images/:imageId",
  verifyToken,
  verifyVendor,
  deleteImageHandler,
);

module.exports = router;
