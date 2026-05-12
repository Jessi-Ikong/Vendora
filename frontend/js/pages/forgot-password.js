document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    if (user.role === "admin")
      window.location.href = "/frontend/admin/dashboard.html";
    else if (user.role === "vendor")
      window.location.href = "/frontend/vendor/dashboard.html";
    else window.location.href = "/frontend/buyer/dashboard.html";
    return;
  }
});

// ─── Handle Form Submission ───────────────────────────────────
document.getElementById("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const btn = document.getElementById("submit-btn");

  // Clear previous errors
  document.getElementById("email-error").classList.add("hidden");

  // Validation
  if (!email) {
    document.getElementById("email-error").textContent = "Email is required";
    document.getElementById("email-error").classList.remove("hidden");
    return;
  }

  if (!isValidEmail(email)) {
    document.getElementById("email-error").textContent =
      "Please provide a valid email address";
    document.getElementById("email-error").classList.remove("hidden");
    return;
  }

  // Loading state
  btn.textContent = "Sending...";
  btn.disabled = true;

  // Send forgot password request
  const res = await api.post("/auth/forgot-password", { email });

  if (res?.ok) {
    // Show success message
    document.getElementById("forgot-form").classList.add("hidden");
    document.getElementById("success-message").classList.remove("hidden");
    Toast.show("Check your email for the reset link!", "success");
  } else {
    // Always show generic message for security (don't reveal if email exists)
    document.getElementById("forgot-form").classList.add("hidden");
    document.getElementById("success-message").classList.remove("hidden");
    Toast.show("If that email exists, we've sent a reset link", "info");
  }
});

// ─── Email Validation Helper ──────────────────────────────────
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
