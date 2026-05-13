const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  checkLoginRateLimit,
} = require("../middleware/loginRateLimit.middleware");
const {
  validateRegister,
  validateLogin,
  validateUpdatePassword,
} = require("../validators/auth.validators");
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

// Public routes
router.post("/register", validateRegister, validate, register);
router.post("/login", checkLoginRateLimit, validateLogin, validate, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.get("/me", verifyToken, getMe);
router.put("/update-profile", verifyToken, updateProfile);
router.put(
  "/update-password",
  verifyToken,
  validateUpdatePassword,
  validate,
  updatePassword,
);

module.exports = router;
