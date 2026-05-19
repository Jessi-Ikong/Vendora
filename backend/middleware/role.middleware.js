// ─── Flexible Role Guard (accepts array of roles) ─────────────
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

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

module.exports = { requireRole, verifyVendor, verifyAdmin };
