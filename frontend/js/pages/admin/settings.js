document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;

  await Navbar.render();
  setupPersonalSettings();
});

// ─── Setup Personal Settings Handlers ──────────────────────
const setupPersonalSettings = async () => {
  const user = Auth.getUser();

  if (user) {
    document.getElementById("user-name").value = user.name || "";
  }

  // Name form handler
  document.getElementById("name-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("user-name").value.trim();

    if (!name) {
      Toast.show("Name is required", "warning");
      return;
    }

    const res = await api.put("/auth/update-profile", { name });

    if (res?.ok) {
      Toast.show("Name updated successfully!", "success");
      Auth.setUser(res.data.user);
    } else {
      Toast.show(res?.data?.message || "Failed to update name", "error");
    }
  });

  // Password form handler
  document.getElementById("password-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show("All fields are required", "warning");
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

    const res = await api.put("/auth/update-password", {
      currentPassword,
      newPassword,
    });

    if (res?.ok) {
      Toast.show("Password changed successfully!", "success");
      document.getElementById("password-form").reset();
    } else {
      Toast.show(res?.data?.message || "Failed to change password", "error");
    }
  });
};
