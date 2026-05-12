let selectedAddressId = null;
let cartData = null;
let savedAddresses = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAuth()) return;

  await Navbar.render();

  await Promise.all([loadAddresses(), loadCartSummary()]);
});

// ─── Load Addresses ───────────────────────────────────────────
const loadAddresses = async () => {
  const res = await api.get("/addresses");
  if (!res?.ok) return;

  savedAddresses = res.data.addresses;
  const container = document.getElementById("saved-addresses");

  if (savedAddresses.length === 0) {
    container.innerHTML = `
      <p class="text-sm text-gray-400">
        No saved addresses. Add one below.
      </p>
    `;
    return;
  }

  const defaultAddr =
    savedAddresses.find((a) => a.is_default) || savedAddresses[0];
  selectedAddressId = defaultAddr.id;

  container.innerHTML = savedAddresses
    .map(
      (addr) => `
    <label class="flex gap-3 p-4 border-2 rounded-xl cursor-pointer
                  transition ${
                    addr.id === selectedAddressId
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }">
      <input type="radio" name="address"
             value="${addr.id}"
             ${addr.id === selectedAddressId ? "checked" : ""}
             onchange="selectAddress(${addr.id})"
             class="mt-1 text-indigo-600"/>
      <div>
        <p class="font-medium text-gray-900 text-sm">
          ${addr.full_name}
          ${
            addr.is_default
              ? `<span class="ml-2 text-xs bg-indigo-100
                            text-indigo-600 px-2 py-0.5
                            rounded-full">Default</span>`
              : ""
          }
        </p>
        <p class="text-sm text-gray-500 mt-1">
          ${addr.address_line1}
          ${addr.address_line2 ? `, ${addr.address_line2}` : ""}
        </p>
        <p class="text-sm text-gray-500">
          ${addr.city}, ${addr.state}
        </p>
        <p class="text-sm text-gray-500">${addr.phone}</p>
      </div>
    </label>
  `,
    )
    .join("");
};

// ─── Select Address ───────────────────────────────────────────
const selectAddress = (id) => {
  selectedAddressId = id;
  document.querySelectorAll('input[name="address"]').forEach((input) => {
    const label = input.closest("label");
    if (parseInt(input.value) === id) {
      label.classList.add("border-indigo-500", "bg-indigo-50");
      label.classList.remove("border-gray-200");
    } else {
      label.classList.remove("border-indigo-500", "bg-indigo-50");
      label.classList.add("border-gray-200");
    }
  });
};

// ─── Go to Payment Step ───────────────────────────────────────
const goToPayment = () => {
  if (!selectedAddressId) {
    Toast.show("Please select a delivery address", "warning");
    return;
  }

  // Show address summary on step 2
  const addr = savedAddresses.find((a) => a.id === selectedAddressId);
  if (addr) {
    document.getElementById("selected-addr-summary").textContent =
      `${addr.full_name} — ${addr.address_line1}, ${addr.city}, ${addr.state}`;
  }

  // Update pay button text
  document.getElementById("place-order-btn").textContent =
    `Pay ${Utils.formatPrice(cartData?.total || 0)} →`;

  // Activate step 2 indicator
  document.getElementById("indicator-1").textContent = "✓";
  document.getElementById("indicator-2").className =
    "w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold";
  document.getElementById("label-2").className =
    "text-sm font-medium text-indigo-600";
  document.getElementById("line-1").className =
    "w-16 h-0.5 bg-indigo-600 transition";

  // Show step 2
  document.getElementById("step-1-content").classList.add("hidden");
  document.getElementById("step-2-content").classList.remove("hidden");
};

// ─── Go Back to Step 1 ────────────────────────────────────────
const goBack = () => {
  document.getElementById("step-2-content").classList.add("hidden");
  document.getElementById("step-1-content").classList.remove("hidden");

  // Reset indicators
  document.getElementById("indicator-1").textContent = "1";
  document.getElementById("indicator-2").className =
    "w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold";
  document.getElementById("label-2").className =
    "text-sm font-medium text-gray-400";
  document.getElementById("line-1").className =
    "w-16 h-0.5 bg-gray-200 transition";
};

// ─── Load Cart Summary ────────────────────────────────────────
const loadCartSummary = async () => {
  const res = await api.get("/cart");
  if (!res?.ok) return;

  cartData = res.data.cart;

  if (cartData.item_count === 0) {
    window.location.href = "cart.html";
    return;
  }

  const container = document.getElementById("checkout-items");
  container.innerHTML = cartData.items
    .map(
      (item) => `
    <div class="flex gap-3">
      <div class="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden
                  flex-shrink-0">
        ${
          item.product_image
            ? `<img src="${item.product_image}"
                  class="w-full h-full object-cover"/>`
            : `<div class="w-full h-full flex items-center
                         justify-center text-xl">📦</div>`
        }
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 line-clamp-1">
          ${item.product_name}
        </p>
        <p class="text-xs text-gray-400">Qty: ${item.quantity}</p>
      </div>
      <p class="text-sm font-semibold text-gray-900 flex-shrink-0">
        ${Utils.formatPrice(item.subtotal)}
      </p>
    </div>
  `,
    )
    .join("");

  document.getElementById("checkout-subtotal").textContent = Utils.formatPrice(
    cartData.total,
  );
  document.getElementById("checkout-total").textContent = Utils.formatPrice(
    cartData.total,
  );
};

// ─── Save New Address ─────────────────────────────────────────
const saveNewAddress = async () => {
  const full_name = document.getElementById("new-full-name").value.trim();
  const phone = document.getElementById("new-phone").value.trim();
  const address_line1 = document.getElementById("new-address1").value.trim();
  const address_line2 = document.getElementById("new-address2").value.trim();
  const city = document.getElementById("new-city").value.trim();
  const state = document.getElementById("new-state").value.trim();

  if (!full_name || !phone || !address_line1 || !city || !state) {
    Toast.show("Please fill in all required fields", "warning");
    return;
  }

  const res = await api.post("/addresses", {
    full_name,
    phone,
    address_line1,
    address_line2: address_line2 || undefined,
    city,
    state,
  });

  if (res?.ok) {
    Toast.show("Address saved!", "success");
    await loadAddresses();
  } else {
    Toast.show(res?.data?.message || "Failed to save address", "error");
  }
};

// ─── Place Order ──────────────────────────────────────────────
const placeOrder = async () => {
  const btn = document.getElementById("place-order-btn");
  btn.textContent = "Processing...";
  btn.disabled = true;

  const notes = document.getElementById("order-notes").value.trim();

  // 1. Create order
  const orderRes = await api.post("/orders/checkout", {
    address_id: selectedAddressId,
    notes: notes || undefined,
  });

  if (!orderRes?.ok) {
    Toast.show(orderRes?.data?.message || "Failed to create order", "error");
    btn.textContent = `Pay ${Utils.formatPrice(cartData?.total || 0)} →`;
    btn.disabled = false;
    return;
  }

  const order = orderRes.data.order;

  // 2. Initialize payment
  const payRes = await api.post("/payments/initialize", {
    order_id: order.id,
  });

  if (!payRes?.ok) {
    Toast.show("Payment initialization failed", "error");
    btn.textContent = `Pay ${Utils.formatPrice(cartData?.total || 0)} →`;
    btn.disabled = false;
    return;
  }

  // 3. Activate step 3 indicator
  document.getElementById("indicator-2").textContent = "✓";
  document.getElementById("indicator-3").className =
    "w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold";
  document.getElementById("label-3").className =
    "text-sm font-medium text-indigo-600";
  document.getElementById("line-2").className =
    "w-16 h-0.5 bg-indigo-600 transition";

  // 4. Hide step 2 and redirect
  document.getElementById("step-2-content").classList.add("hidden");

  Toast.show("Redirecting to payment...", "info");
  setTimeout(() => {
    window.location.href = payRes.data.authorization_url;
  }, 1000);
};
