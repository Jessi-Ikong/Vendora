const jwt = require("jsonwebtoken");
const { findUserById } = require("../queries/auth.queries");

const verifyToken = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // 2. Extract token — remove "Bearer " prefix
    const token = authHeader.split(" ")[1];

    // 3. Verify token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find the user this token belongs to
    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    // 5. Check user is not suspended
    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: "Your account has been suspended." });
    }

    // 6. Attach user to request — available in all subsequent middleware and controllers
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token has expired. Please login again." });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = verifyToken;
