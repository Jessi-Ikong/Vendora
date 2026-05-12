let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAuth()) return;

  await Navbar.render();
  await loadAddresses();
});

// ─── Load Addresses ───────────────────────────────────────────
const loadAddresses = async () => {
  Loader.show();
  const res = await api.get("/addresses");
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load addresses", "error");
    return;
  }

  const addresses = res.data.addresses;
  const list = document.getElementById("addresses-list");
  const emptyState = document.getElementById("empty-state");

  if (addresses.length === 0) {
    list.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  list.innerHTML = addresses
    .map(
      (addr) => `
    <div class="bg-white rounded-xl shadow-sm border
                ${addr.is_default ? "border-indigo-300" : "border-gray-100"}
                p-6">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <p class="font-bold text-gray-900">${addr.full_name}</p>
            ${
              addr.is_default
                ? `
              <span class="bg-indigo-100 text-indigo-600 text-xs
                           px-2 py-0.5 rounded-full font-medium">
                Default
              </span>
            `
                : ""
            }
          </div>
          <p class="text-gray-600 text-sm">
            ${addr.address_line1}
            ${addr.address_line2 ? `, ${addr.address_line2}` : ""}
          </p>
          <p class="text-gray-600 text-sm">
            ${addr.city}, ${addr.state}, ${addr.country}
          </p>
          <p class="text-gray-500 text-sm mt-1">
            📞 ${addr.phone}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2 flex-shrink-0 ml-4">
          <button onclick="editAddress(${addr.id})"
                  class="text-indigo-600 hover:underline text-sm">
            Edit
          </button>
          ${
            !addr.is_default
              ? `
            <button onclick="setDefault(${addr.id})"
                    class="text-gray-500 hover:text-indigo-600
                           text-sm">
              Set Default
            </button>
            <button onclick="deleteAddress(${addr.id})"
                    class="text-red-500 hover:text-red-700 text-sm">
              Delete
            </button>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `,
    )
    .join("");
};

// ─── Show Add Form ────────────────────────────────────────────
const showAddForm = () => {
  editingId = null;
  document.getElementById("form-title").textContent = "Add New Address";
  document.getElementById("address-form").reset();
  document.getElementById("editing-id").value = "";
  document.getElementById("address-form-card").classList.remove("hidden");
  document
    .getElementById("address-form-card")
    .scrollIntoView({ behavior: "smooth" });
};

// ─── Hide Form ────────────────────────────────────────────────
const hideForm = () => {
  document.getElementById("address-form-card").classList.add("hidden");
  editingId = null;
};

// ─── Edit Address ─────────────────────────────────────────────
const editAddress = async (id) => {
  const res = await api.get("/addresses");
  if (!res?.ok) return;

  const addr = res.data.addresses.find((a) => a.id === id);
  if (!addr) return;

  editingId = id;
  document.getElementById("form-title").textContent = "Edit Address";
  document.getElementById("editing-id").value = id;
  document.getElementById("addr-full-name").value = addr.full_name;
  document.getElementById("addr-phone").value = addr.phone;
  document.getElementById("addr-line1").value = addr.address_line1;
  document.getElementById("addr-line2").value = addr.address_line2 || "";
  document.getElementById("addr-city").value = addr.city;
  document.getElementById("addr-state").value = addr.state;

  document.getElementById("address-form-card").classList.remove("hidden");
  document
    .getElementById("address-form-card")
    .scrollIntoView({ behavior: "smooth" });
};

// ─── Set Default ──────────────────────────────────────────────
const setDefault = async (id) => {
  const res = await api.put(`/addresses/${id}/set-default`);
  if (res?.ok) {
    Toast.show("Default address updated", "success");
    await loadAddresses();
  } else {
    Toast.show("Failed to update", "error");
  }
};

// ─── Delete Address ───────────────────────────────────────────
const deleteAddress = (id) => {
  Modal.confirm("Delete this address?", async () => {
    const res = await api.delete(`/addresses/${id}`);
    if (res?.ok) {
      Toast.show("Address deleted", "success");
      await loadAddresses();
    } else {
      Toast.show("Failed to delete", "error");
    }
  });
};

// ─── Submit Form ──────────────────────────────────────────────
document
  .getElementById("address-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const full_name = document.getElementById("addr-full-name").value.trim();
    const phone = document.getElementById("addr-phone").value.trim();
    const address_line1 = document.getElementById("addr-line1").value.trim();
    const address_line2 = document.getElementById("addr-line2").value.trim();
    const city = document.getElementById("addr-city").value.trim();
    const state = document.getElementById("addr-state").value.trim();

    if (!full_name || !phone || !address_line1 || !city || !state) {
      Toast.show("Please fill in all required fields", "warning");
      return;
    }

    const btn = document.getElementById("save-addr-btn");
    btn.textContent = "Saving...";
    btn.disabled = true;

    const body = {
      full_name,
      phone,
      address_line1,
      address_line2: address_line2 || undefined,
      city,
      state,
    };

    const res = editingId
      ? await api.put(`/addresses/${editingId}`, body)
      : await api.post("/addresses", body);

    if (res?.ok) {
      Toast.show(editingId ? "Address updated!" : "Address added!", "success");
      hideForm();
      await loadAddresses();
    } else {
      Toast.show(res?.data?.message || "Failed to save address", "error");
    }

    btn.textContent = "Save Address";
    btn.disabled = false;
  });
