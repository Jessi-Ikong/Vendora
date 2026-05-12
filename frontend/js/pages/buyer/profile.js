document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAuth()) return;

  await Navbar.render();
  loadProfile();
});

// ─── Load Profile ─────────────────────────────────────────────
const loadProfile = () => {
  const user = Auth.getUser();

  // Display info
  document.getElementById("avatar-display").textContent = user.name
    .charAt(0)
    .toUpperCase();
  document.getElementById("display-name").textContent = user.name;
  document.getElementById("display-email").textContent = user.email;
  document.getElementById("display-joined").textContent =
    `Member since ${Utils.formatDate(user.created_at)}`;

  // Form values
  document.getElementById("profile-name").value = user.name;
  document.getElementById("profile-email").value = user.email;
};

// ─── Update Profile ───────────────────────────────────────────
document
  .getElementById("profile-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("profile-name").value.trim();
    if (!name) {
      Toast.show("Name is required", "warning");
      return;
    }

    const btn = e.target.querySelector("button[type='submit']");
    btn.textContent = "Saving...";
    btn.disabled = true;

    const res = await api.put("/auth/update-profile", { name });

    if (res?.ok) {
      // Update stored user
      const user = Auth.getUser();
      Auth.updateUser({ ...user, name });

      Toast.show("Profile updated successfully!", "success");
      loadProfile();
    } else {
      Toast.show(res?.data?.message || "Update failed", "error");
    }

    btn.textContent = "Save Changes";
    btn.disabled = false;
  });

// ─── Update Password ──────────────────────────────────────────
document
  .getElementById("password-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show("Please fill in all fields", "warning");
      return;
    }

    if (newPassword.length < 6) {
      Toast.show("New password must be at least 6 characters", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show("Passwords do not match", "warning");
      return;
    }

    const btn = e.target.querySelector("button[type='submit']");
    btn.textContent = "Updating...";
    btn.disabled = true;

    const res = await api.put("/auth/update-password", {
      currentPassword,
      newPassword,
    });

    if (res?.ok) {
      Toast.show("Password updated successfully!", "success");
      e.target.reset();
    } else {
      Toast.show(res?.data?.message || "Failed to update password", "error");
    }

    btn.textContent = "Update Password";
    btn.disabled = false;
  });
