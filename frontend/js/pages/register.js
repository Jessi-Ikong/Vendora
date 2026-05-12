document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
//   if (Auth.isLoggedIn()) {
//     const user = Auth.getUser();
//     if (user.role === "admin") window.location.href = "admin/dashboard.html";
//     else if (user.role === "vendor")
//       window.location.href = "vendor/dashboard.html";
//     else window.location.href = "buyer/dashboard.html";
//     return;
//   }
});

document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.querySelector('input[name="role"]:checked').value;
    const terms = document.getElementById("terms").checked;
    const btn = document.getElementById("register-btn");

    // Clear errors
    ["name", "email", "password", "terms"].forEach((id) => {
      document.getElementById(`${id}-error`).classList.add("hidden");
    });

    // Validate
    let hasError = false;

    if (!name || name.length < 2) {
      document.getElementById("name-error").textContent =
        "Name must be at least 2 characters";
      document.getElementById("name-error").classList.remove("hidden");
      hasError = true;
    }

    if (!email || !email.includes("@")) {
      document.getElementById("email-error").textContent =
        "Please enter a valid email";
      document.getElementById("email-error").classList.remove("hidden");
      hasError = true;
    }

    if (!password || password.length < 6) {
      document.getElementById("password-error").textContent =
        "Password must be at least 6 characters";
      document.getElementById("password-error").classList.remove("hidden");
      hasError = true;
    }

    if (!terms) {
      document.getElementById("terms-error").textContent =
        "Please accept the terms to continue";
      document.getElementById("terms-error").classList.remove("hidden");
      hasError = true;
    }

    if (hasError) return;

    // Submit
    btn.textContent = "Creating account...";
    btn.disabled = true;

    const res = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
    });

    if (res?.ok) {
      Auth.login(res.data.token, res.data.user);
      Toast.show("Account created successfully! 🎉", "success");

      setTimeout(() => {
        if (role === "vendor") window.location.href = "vendor/dashboard.html";
        else window.location.href = "buyer/dashboard.html";
      }, 800);
    } else {
      Toast.show(res?.data?.message || "Registration failed", "error");
      btn.textContent = "Create Account";
      btn.disabled = false;
    }
  });
