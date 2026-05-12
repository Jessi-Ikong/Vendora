// ─── Vendor Guard ─────────────────────────────────────────────
const verifyVendor = (req, res, next) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({
      message: "Access denied. Vendor account required.",
    });
  }
  next();
};

// ─── Admin Guard ──────────────────────────────────────────────
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin account required.",
    });
  }
  next();
};

module.exports = { verifyVendor, verifyAdmin };
