# Vendora Security Fix Implementation Guide

Quick reference for implementing each security fix.

---

## 1️⃣ FIX CORS (CRITICAL)

**File:** `backend/app.js`

Replace:

```javascript
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);
```

With:

```javascript
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 3600,
    optionsSuccessStatus: 200,
  }),
);
```

Add to `.env`:

```
CORS_ORIGIN=https://vendora.vercel.app
```

---

## 2️⃣ CONFIGURE HELMET (CRITICAL)

**File:** `backend/app.js`

Add at the top:

```javascript
const helmet = require("helmet");
```

Add after `const app = express();`:

```javascript
// Security Headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "data:"],
      fontSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ],
      connectSrc: ["'self'", "https://api.paystack.co"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : [],
    },
  }),
);

// HTTPS redirect in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure && req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 3️⃣ FIX ERROR HANDLER (CRITICAL)

**File:** `backend/app.js`

Replace:

```javascript
// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});
```

With:

```javascript
// ─── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  // Log full error details for debugging (server-side only)
  console.error("[ERROR]", {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Safe response to client (no sensitive details)
  if (statusCode === 500) {
    return res.status(500).json({
      message: "An error occurred. Please try again later.",
      ...(process.env.NODE_ENV === "development" && {
        error: err.message,
        stack: err.stack,
      }),
    });
  }

  res.status(statusCode).json({
    message: err.message || "An error occurred",
  });
});
```

---

## 4️⃣ ADD REQUEST SIZE LIMITS (CRITICAL)

**File:** `backend/app.js`

Replace:

```javascript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

With:

```javascript
app.use(
  express.json({
    limit: "10mb", // Prevent DoS from large payloads
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);
```

---

## 5️⃣ IMPLEMENT PRODUCT VALIDATORS (CRITICAL)

**File:** `backend/validators/product.validators.js`

Replace entire file with:

```javascript
const { body } = require("express-validator");

const validateCreateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Name must be 3-200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description is too long"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be greater than 0"),

  body("discount_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be non-negative")
    .custom((value, { req }) => {
      if (value && parseFloat(value) >= parseFloat(req.body.price)) {
        throw new Error("Discount price must be less than regular price");
      }
      return true;
    }),

  body("stock")
    .notEmpty()
    .withMessage("Stock quantity is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("category_id")
    .notEmpty()
    .withMessage("Category is required")
    .isInt()
    .withMessage("Invalid category ID"),
];

const validateUpdateProduct = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Name must be 3-200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description is too long"),

  body("price")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Price must be greater than 0"),

  body("discount_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be non-negative")
    .custom((value, { req }) => {
      if (
        value &&
        req.body.price &&
        parseFloat(value) >= parseFloat(req.body.price)
      ) {
        throw new Error("Discount price must be less than regular price");
      }
      return true;
    }),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("category_id").optional().isInt().withMessage("Invalid category ID"),
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
```

Use in routes:

```javascript
const {
  validateCreateProduct,
  validateUpdateProduct,
} = require("../validators/product.validators");

router.post(
  "/",
  verifyToken,
  verifyVendor,
  validateCreateProduct,
  validate,
  createProductHandler,
);
router.put(
  "/:id",
  verifyToken,
  verifyVendor,
  validateUpdateProduct,
  validate,
  updateProductHandler,
);
```

---

## 6️⃣ IMPLEMENT ORDER VALIDATORS (CRITICAL)

**File:** `backend/validators/order.validators.js`

```javascript
const { body } = require("express-validator");

const validateCheckout = [
  body("address_id").optional().isInt().withMessage("Invalid address ID"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes too long"),
];

module.exports = {
  validateCheckout,
};
```

Use in routes:

```javascript
router.post("/checkout", verifyToken, validateCheckout, validate, checkout);
```

---

## 7️⃣ IMPLEMENT REVIEW VALIDATORS (CRITICAL)

**File:** `backend/validators/review.validators.js`

```javascript
const { body } = require("express-validator");

const validateCreateReview = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment must not exceed 1000 characters"),
];

const validateUpdateReview = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment must not exceed 1000 characters"),
];

module.exports = {
  validateCreateReview,
  validateUpdateReview,
};
```

---

## 8️⃣ ADD XSS SANITIZATION (CRITICAL)

**File:** `backend/controllers/review.controller.js`

Add at top:

```javascript
const xss = require("xss");
```

In `addReview` function, after validation:

```javascript
const review = await createReview(
  productId,
  req.user.id,
  rating,
  xss(comment || "", {
    whiteList: {}, // No HTML tags allowed
    stripIgnoredTag: true,
  }),
);
```

In `editReview` function:

```javascript
const updated = await updateReview(
  id,
  rating,
  xss(comment || "", {
    whiteList: {},
    stripIgnoredTag: true,
  }),
);
```

---

## 9️⃣ UPDATE AUTH VALIDATORS (CRITICAL)

**File:** `backend/validators/auth.validators.js`

Replace password validation:

```javascript
body("password")
  .notEmpty().withMessage("Password is required")
  .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
  .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
  .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
  .matches(/[0-9]/).withMessage("Password must contain a number")
  .matches(/[!@#$%^&*]/).withMessage("Password must contain a special character (!@#$%^&*)"),

body("newPassword")
  .notEmpty().withMessage("New password is required")
  .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
  .matches(/[A-Z]/).withMessage("New password must contain an uppercase letter")
  .matches(/[a-z]/).withMessage("New password must contain a lowercase letter")
  .matches(/[0-9]/).withMessage("New password must contain a number")
  .matches(/[!@#$%^&*]/).withMessage("New password must contain a special character"),
```

---

## 🔟 ADD GLOBAL RATE LIMITING (HIGH PRIORITY)

**File:** `backend/app.js`

Add after helmet setup:

```javascript
const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    // Admin endpoints have higher limits
    if (req.user?.role === "admin") return 1000;
    return 100;
  },
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === "/";
  },
});

// Stricter limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later",
  skipSuccessfulRequests: true,
});

// Very strict limit for resource creation
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Too many products/content created, try again later",
});

// Apply limiters
app.use("/api/", apiLimiter);
app.post("/api/auth/login", authLimiter);
app.post("/api/products/", createLimiter);
app.post("/api/reviews/", createLimiter);
```

---

## 1️⃣1️⃣ FIX JWT VALIDATION (HIGH PRIORITY)

**File:** `backend/controllers/auth.controller.js`

Update `generateToken`:

```javascript
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
```

Update `register` and `login`:

```javascript
// In register
const token = generateToken(newUser.id, newUser.role);

// In login
const token = generateToken(user.id, user.role);
```

**File:** `backend/middleware/auth.middleware.js`

Replace verify logic:

```javascript
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    // ✅ NEW: Verify role hasn't changed
    if (decoded.role && decoded.role !== user.role) {
      return res.status(401).json({
        message: "Your role has changed. Please login again.",
      });
    }

    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: "Your account has been suspended." });
    }

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
    res.status(500).json({ message: "Server error" });
  }
};
```

---

## 1️⃣2️⃣ SANITIZE EMAIL TEMPLATES (HIGH PRIORITY)

**File:** `backend/utils/email.js`

Add at top:

```javascript
const xss = require("xss");
```

Update `sendWelcomeEmail`:

```javascript
const sendWelcomeEmail = async (name, email) => {
  const safeName = xss(name, { whiteList: {} });

  const html = `
    <h2>Hi ${safeName}!</h2>
    ...
  `;
};
```

Update `sendPasswordResetEmail`:

```javascript
const sendPasswordResetEmail = async (name, email, resetToken) => {
  const safeName = xss(name, { whiteList: {} });
  const safeToken = xss(resetToken, { whiteList: {} });

  const html = `
    <h2>Hi ${safeName}!</h2>
    ...
    <a href="${process.env.FRONTEND_URL}/reset-password.html?token=${safeToken}">
      Reset Password
    </a>
    ...
  `;
};
```

Update `sendOrderConfirmationEmail`:

```javascript
const sendOrderConfirmationEmail = async (name, email, order, items) => {
  const safeName = xss(name, { whiteList: {} });
  const safeOrderId = xss(String(order.id), { whiteList: {} });

  const itemRows = items
    .map((item) => {
      const safeName = xss(item.product_name, { whiteList: {} });
      return `
        <tr>
          <td>${safeName}</td>
          ...
        </tr>
      `;
    })
    .join("");

  const html = `
    <h2>Hi ${safeName}!</h2>
    <p>Order ID: <strong>#${safeOrderId}</strong></p>
    ...
    ${itemRows}
  `;
};
```

---

## 1️⃣3️⃣ ENVIRONMENT VALIDATION (HIGH PRIORITY)

**File:** `backend/config/db.js`

Add validation:

```javascript
const required = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
for (const env of required) {
  if (!process.env[env]) {
    throw new Error(`Missing required environment variable: ${env}`);
  }
}
```

**File:** `backend/config/cloudinary.js`

Add validation:

```javascript
const required = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
for (const env of required) {
  if (!process.env[env]) {
    throw new Error(`Missing required Cloudinary environment variable: ${env}`);
  }
}
```

**File:** `backend/controllers/auth.controller.js`

Add validation:

```javascript
const required = ["JWT_SECRET", "JWT_EXPIRES_IN"];
for (const env of required) {
  if (!process.env[env]) {
    throw new Error(`Missing required JWT environment variable: ${env}`);
  }
}
```

---

## .env Template

Add to `.env` file:

```env
# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://vendora.vercel.app

# CORS
CORS_ORIGIN=https://vendora.vercel.app

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=vendora_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars-long-random
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Paystack
PAYSTACK_SECRET_KEY=your-paystack-secret-key

# Rate Limiting
RATE_LIMIT_LOCK_DURATION=30
```

---

## Testing Checklist

- [ ] Test CORS with curl/Postman from different origin
- [ ] Verify security headers with `curl -I https://api.vendora.com`
- [ ] Test error messages don't leak info
- [ ] Test rate limiting blocks after N requests
- [ ] Test product creation with invalid inputs
- [ ] Test XSS payload in comments (should be sanitized)
- [ ] Test password strength validation
- [ ] Test JWT with old role still works (should fail after fix)
- [ ] Verify no console errors leak sensitive info
- [ ] Check that Cloudinary upload still works

---

## Security Headers Verification

Visit: https://securityheaders.com and enter your API URL to verify headers are set correctly.

Expected headers:

- Content-Security-Policy ✅
- X-Frame-Options ✅
- X-Content-Type-Options ✅
- Strict-Transport-Security ✅
- X-XSS-Protection ✅
- Referrer-Policy ✅
