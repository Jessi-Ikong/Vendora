const cloudinary = require("../config/cloudinary");

// ─── Upload image to Cloudinary ───────────────────────────────
const uploadImage = (fileBuffer, folder = "vendora") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1000, crop: "limit" }, // max width 1000px
          { quality: "auto" }, // auto optimize quality
          { fetch_format: "auto" }, // auto best format
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(fileBuffer);
  });
};

// ─── Delete image from Cloudinary ────────────────────────────
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete image:", err.message);
  }
};

// ─── Extract public ID from Cloudinary URL ────────────────────
const getPublicId = (url) => {
  if (!url) return null;
  const parts = url.split("/");
  const file = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  return `${folder}/${file.split(".")[0]}`;
};

module.exports = { uploadImage, deleteImage, getPublicId };
