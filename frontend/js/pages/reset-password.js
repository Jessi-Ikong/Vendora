let resetToken = null;

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

  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  resetToken = urlParams.get("token");

  if (!resetToken) {
    // No token provided — show error
    document.getElementById("reset-form").classList.add("hidden");
    document.getElementById("error-message").classList.remove("hidden");
    Toast.show("Invalid reset link", "error");
  }
});

// ─── Handle Form Submission ───────────────────────────────────
document.getElementById("reset-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const btn = document.getElementById("submit-btn");

  // Clear previous errors
  document.getElementById("password-error").classList.add("hidden");
  document.getElementById("confirm-error").classList.add("hidden");

  // Validation
  if (!password) {
    document.getElementById("password-error").textContent =
      "Password is required";
    document.getElementById("password-error").classList.remove("hidden");
    return;
  }

  if (password.length < 6) {
    document.getElementById("password-error").textContent =
      "Password must be at least 6 characters";
    document.getElementById("password-error").classList.remove("hidden");
    return;
  }

  if (!confirmPassword) {
    document.getElementById("confirm-error").textContent =
      "Please confirm your password";
    document.getElementById("confirm-error").classList.remove("hidden");
    return;
  }

  if (password !== confirmPassword) {
    document.getElementById("confirm-error").textContent =
      "Passwords do not match";
    document.getElementById("confirm-error").classList.remove("hidden");
    return;
  }

  // Loading state
  btn.textContent = "Resetting...";
  btn.disabled = true;

  // Submit reset password request
  const res = await api.post(`/auth/reset-password/${resetToken}`, {
    newPassword: password,
  });

  if (res?.ok) {
    Toast.show("Password reset successful! Redirecting to login...", "success");

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500);
  } else {
    // Token expired or invalid
    if (res?.status === 400) {
      document.getElementById("reset-form").classList.add("hidden");
      document.getElementById("error-message").classList.remove("hidden");
      Toast.show("Reset link has expired", "error");
    } else {
      Toast.show(res?.data?.message || "Password reset failed", "error");
      btn.textContent = "Reset Password";
      btn.disabled = false;
    }
  }
});
