// ─── Login Rate Limiting Middleware ────────────────────────────────────
// Tracks failed login attempts and temporarily locks account after 5 failures
// Lock duration: 30 minutes (adjustable via RATE_LIMIT_LOCK_DURATION env var)

// Store for tracking failed attempts
// Structure: { email: { attempts: number, lockedUntil: timestamp } }
const loginAttempts = new Map();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = (process.env.RATE_LIMIT_LOCK_DURATION || 30) * 60 * 1000; // milliseconds

/**
 * Middleware to check if email is locked due to too many failed attempts
 */
const checkLoginRateLimit = (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailLower = email.toLowerCase();
    const now = Date.now();

    // Check if email has attempt record
    if (loginAttempts.has(emailLower)) {
      const record = loginAttempts.get(emailLower);

      // Check if currently locked
      if (record.lockedUntil && record.lockedUntil > now) {
        const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
        return res.status(429).json({
          message: `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`,
          retryAfter: remainingMinutes * 60, // seconds
        });
      }

      // If lock has expired, reset the record
      if (record.lockedUntil && record.lockedUntil <= now) {
        loginAttempts.delete(emailLower);
      }
    }

    // Attach email to request for later use
    req.body.emailLower = emailLower;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Record a failed login attempt
 */
const recordFailedAttempt = (email) => {
  const emailLower = email.toLowerCase();
  const now = Date.now();

  if (loginAttempts.has(emailLower)) {
    const record = loginAttempts.get(emailLower);
    record.attempts += 1;

    // Lock account if max attempts reached
    if (record.attempts >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCK_DURATION;
    }

    loginAttempts.set(emailLower, record);
  } else {
    loginAttempts.set(emailLower, {
      attempts: 1,
      lockedUntil: null,
    });
  }
};

/**
 * Clear failed attempts on successful login
 */
const clearLoginAttempts = (email) => {
  const emailLower = email.toLowerCase();
  if (loginAttempts.has(emailLower)) {
    loginAttempts.delete(emailLower);
  }
};

/**
 * Get attempt info for an email (useful for debugging/monitoring)
 */
const getAttemptInfo = (email) => {
  const emailLower = email.toLowerCase();
  return loginAttempts.get(emailLower) || { attempts: 0, lockedUntil: null };
};

module.exports = {
  checkLoginRateLimit,
  recordFailedAttempt,
  clearLoginAttempts,
  getAttemptInfo,
};
