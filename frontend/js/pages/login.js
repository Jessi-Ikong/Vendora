document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    if (user.role === "admin") window.location.href = "admin/dashboard.html";
    else if (user.role === "vendor")
      window.location.href = "vendor/dashboard.html";
    else window.location.href = "buyer/dashboard.html";
    return;
  }
});

// Handle form submission
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.getElementById("login-btn");

  // Clear previous errors
  document.getElementById("email-error").classList.add("hidden");
  document.getElementById("password-error").classList.add("hidden");

  // Basic validation
  if (!email) {
    document.getElementById("email-error").textContent = "Email is required";
    document.getElementById("email-error").classList.remove("hidden");
    return;
  }

  if (!password) {
    document.getElementById("password-error").textContent =
      "Password is required";
    document.getElementById("password-error").classList.remove("hidden");
    return;
  }

  // Loading state
  btn.textContent = "Signing in...";
  btn.disabled = true;

  const res = await api.post("/auth/login", { email, password });

  if (res?.ok) {
    Auth.login(res.data.token, res.data.user);
    Toast.show("Welcome back!", "success");

    setTimeout(() => {
      const user = res.data.user;
      if (user.role === "admin") window.location.href = "admin/dashboard.html";
      else if (user.role === "vendor")
        window.location.href = "vendor/dashboard.html";
      else window.location.href = "buyer/dashboard.html";
    }, 800);
  } else {
    Toast.show(res?.data?.message || "Login failed", "error");
    btn.textContent = "Sign In";
    btn.disabled = false;
  }
});
