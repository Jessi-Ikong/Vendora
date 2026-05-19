let hasStore = false;

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireVendor()) return;

  await Navbar.render();
  await loadStoreProfile();
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

// ─── Load Store Profile ───────────────────────────────────────
const loadStoreProfile = async () => {
  const res = await api.get("/vendors/store/profile");

  if (!res?.ok) {
    // No store yet — show setup banner
    document.getElementById("no-store-banner").classList.remove("hidden");
    document.getElementById("save-btn").textContent = "Create Store";
    hasStore = false;
    return;
  }

  hasStore = true;
  const vendor = res.data.vendor;

  // Populate form
  document.getElementById("store-name").value = vendor.store_name || "";
  document.getElementById("store-description").value = vendor.description || "";
  document.getElementById("store-logo").value = vendor.logo || "";
  document.getElementById("store-banner").value = vendor.banner || "";

  // View store link
  const viewBtn = document.getElementById("view-store-btn");
  viewBtn.href = `../store.html?slug=${vendor.store_slug}`;
  viewBtn.classList.remove("hidden");

  // Store status
  const statusContent = document.getElementById("store-status-content");
  statusContent.innerHTML = `
    <div class="flex items-center gap-3 p-4 rounded-xl
                ${vendor.is_approved ? "bg-green-50" : "bg-yellow-50"}">
      <span class="text-2xl">
        ${vendor.is_approved ? "✅" : "⏳"}
      </span>
      <div>
        <p class="font-medium
                  ${vendor.is_approved ? "text-green-800" : "text-yellow-800"}">
          ${vendor.is_approved ? "Store Approved" : "Pending Approval"}
        </p>
        <p class="text-sm
                  ${vendor.is_approved ? "text-green-600" : "text-yellow-600"}">
          ${
            vendor.is_approved
              ? "Your store is live and visible to buyers"
              : "Admin is reviewing your store application"
          }
        </p>
      </div>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-gray-400">Store Slug</p>
        <p class="font-medium text-gray-700">
          ${vendor.store_slug}
        </p>
      </div>
      <div>
        <p class="text-gray-400">Member Since</p>
        <p class="font-medium text-gray-700">
          ${Utils.formatDate(vendor.created_at)}
        </p>
      </div>
    </div>
  `;
};

// ─── Save Store ───────────────────────────────────────────────
document.getElementById("store-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const store_name = document.getElementById("store-name").value.trim();
  const description = document.getElementById("store-description").value.trim();
  const logo = document.getElementById("store-logo").value.trim();
  const banner = document.getElementById("store-banner").value.trim();

  if (!store_name) {
    Toast.show("Store name is required", "warning");
    return;
  }

  const btn = document.getElementById("save-btn");
  btn.textContent = "Saving...";
  btn.disabled = true;

  let res;

  if (hasStore) {
    // Update existing store
    res = await api.put("/vendors/store/profile", {
      store_name,
      description: description || undefined,
      logo: logo || undefined,
      banner: banner || undefined,
    });
  } else {
    // Create new store
    res = await api.post("/vendors/setup", {
      store_name,
      description: description || undefined,
    });
  }

  if (res?.ok) {
    Toast.show(
      hasStore
        ? "Store updated successfully!"
        : "Store created! Pending admin approval.",
      "success",
    );
    hasStore = true;
    await loadStoreProfile();
  } else {
    Toast.show(res?.data?.message || "Failed to save store", "error");
  }

  btn.textContent = "Save Changes";
  btn.disabled = false;
});
