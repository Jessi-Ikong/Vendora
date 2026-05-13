const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  updateUserPassword,
  saveResetToken,
  findUserByResetToken,
  clearResetToken,
  createCartForUser,
} = require("../queries/auth.queries");
const {
  recordFailedAttempt,
  clearLoginAttempts,
} = require("../middleware/loginRateLimit.middleware");

// ─── Helper — Generate JWT ────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// ─── Register ─────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role = "buyer" } = req.body;

    // 1. Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user
    const newUser = await createUser(name, email, hashedPassword, role);

    // 4. If buyer, create their cart automatically
    if (role === "buyer") {
      await createCartForUser(newUser.id);
    }

    // 5. Generate token
    const token = generateToken(newUser.id);

    // 6. Send welcome email in background
    const { sendWelcomeEmail } = require("../utils/email");
    sendWelcomeEmail(newUser.name, newUser.email).catch((err) =>
      console.error("Welcome email failed:", err.message),
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: newUser,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Login ────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      recordFailedAttempt(email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2. Check account is active
    if (!user.is_active) {
      recordFailedAttempt(email);
      return res
        .status(403)
        .json({ message: "Your account has been suspended" });
    }

    // 3. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordFailedAttempt(email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Clear failed attempts on successful login
    clearLoginAttempts(email);

    // 5. Generate token
    const token = generateToken(user.id);

    // 6. Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Get Current User ─────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Update Profile ───────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user.id;

    const updatedUser = await updateUserProfile(
      userId,
      name || req.user.name,
      avatar || req.user.avatar,
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Update Password ──────────────────────────────────────────
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 1. Get full user record including password
    const user = await findUserByEmail(req.user.email);

    // 2. Verify current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Save new password
    await updateUserPassword(userId, hashedPassword);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Forgot Password ──────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check user exists
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(200).json({
        message: "If that email exists, a reset link has been sent",
      });
    }

    // 2. Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000);

    // 3. Save token to database
    await saveResetToken(email, resetToken, resetExpires);

    // 4. Send password reset email in background
    const { sendPasswordResetEmail } = require("../utils/email");
    sendPasswordResetEmail(user.name, email, resetToken).catch((err) =>
      console.error("Reset email failed:", err.message),
    );

    res.status(200).json({
      message: "If that email exists, a reset link has been sent",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Reset Password ───────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // 1. Find user with this valid token
    const user = await findUserByResetToken(token);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update password
    await updateUserPassword(user.id, hashedPassword);

    // 4. Clear the reset token so it can't be used again
    await clearResetToken(user.id);

    res
      .status(200)
      .json({ message: "Password reset successful. Please login." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
};
