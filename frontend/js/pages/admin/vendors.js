let allVendors = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;
  await Navbar.render();
  await loadVendors();
});

const loadVendors = async () => {
  Loader.show();
  const res = await api.get("/admin/vendors");
  Loader.hide();
  if (!res?.ok) return;

  allVendors = res.data.vendors;
  renderVendors(allVendors);
};

const renderVendors = (vendors) => {
  const container = document.getElementById("vendors-table");

  container.innerHTML = vendors
    .map(
      (v) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition">
      <td class="px-6 py-4">
        <p class="font-medium text-gray-900">${v.store_name}</p>
        <p class="text-xs text-gray-400">${v.owner_email}</p>
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        ${v.owner_name}
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        ${v.product_count}
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs font-medium
                     ${
                       v.is_approved
                         ? "bg-green-100 text-green-700"
                         : "bg-yellow-100 text-yellow-700"
                     }">
          ${v.is_approved ? "Approved" : "Pending"}
        </span>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          ${
            !v.is_approved
              ? `
            <button onclick="approveVendor(${v.id})"
                    class="text-green-600 hover:text-green-800
                           text-sm font-medium">
              Approve
            </button>
            <span class="text-gray-300">|</span>
          `
              : ""
          }
          <button onclick="toggleSuspend(${v.user_id}, ${v.is_active})"
                  class="text-sm
                         ${v.is_active ? "text-orange-500" : "text-green-600"}">
            ${v.is_active ? "Suspend" : "Reactivate"}
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
};

const approveVendor = async (vendorId) => {
  Modal.confirm("Approve this vendor?", async () => {
    const res = await api.put(`/admin/vendors/${vendorId}/approve`);
    if (res?.ok) {
      Toast.show("Vendor approved! ✅", "success");
      await loadVendors();
    } else {
      Toast.show("Failed to approve", "error");
    }
  });
};

const toggleSuspend = async (userId, isActive) => {
  Modal.confirm(
    `${isActive ? "Suspend" : "Reactivate"} this vendor?`,
    async () => {
      const res = await api.put(`/admin/users/${userId}/suspend`);
      if (res?.ok) {
        Toast.show(
          `Vendor ${isActive ? "suspended" : "reactivated"}`,
          "success",
        );
        await loadVendors();
      }
    },
  );
};
