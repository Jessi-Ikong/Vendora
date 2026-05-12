let currentOrder = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireVendor()) return;

  await Navbar.render();

  // Get order item ID from URL
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    window.location.href = "orders.html";
    return;
  }

  await loadOrder(id);
});

// ─── Load Order ───────────────────────────────────────────────
const loadOrder = async (id) => {
  Loader.show();
  const res = await api.get("/vendors/store/orders");
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load order", "error");
    return;
  }

  // Find all items belonging to this order
  const allItems = res.data.orders;
  const orderItems = allItems.filter((item) => item.order_id === parseInt(id));

  if (orderItems.length === 0) {
    Toast.show("Order not found", "error");
    setTimeout(() => (window.location.href = "orders.html"), 1500);
    return;
  }

  currentOrder = orderItems;
  renderOrder(orderItems);
};

// ─── Render Order ─────────────────────────────────────────────
const renderOrder = (items) => {
  const first = items[0];

  document.title = `Order #${first.order_id} — Vendora`;

  // Order meta
  document.getElementById("order-id").textContent = `#${first.order_id}`;
  document.getElementById("order-date").textContent = Utils.formatDate(
    first.created_at,
  );
  document.getElementById("buyer-name").textContent = first.buyer_name;

  // Total earnings from this order
  const total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  document.getElementById("order-total").textContent = Utils.formatPrice(total);

  // Payment badge
  const badge = document.getElementById("payment-badge");
  badge.textContent = first.payment_status;
  badge.className = `px-3 py-1 rounded-full text-sm font-medium
    ${Utils.statusColor(first.payment_status)}`;

  // Order items
  const itemsEl = document.getElementById("order-items");
  itemsEl.innerHTML = items
    .map(
      (item) => `
    <div class="flex gap-4 pb-4 border-b border-gray-50
                last:border-0 last:pb-0">

      <!-- Image -->
      <div class="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden
                  flex-shrink-0">
        ${
          item.product_image
            ? `<img src="${item.product_image}"
                  class="w-full h-full object-cover"/>`
            : `<div class="w-full h-full flex items-center
                         justify-center text-2xl">📦</div>`
        }
      </div>

      <!-- Details -->
      <div class="flex-1">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-gray-900">
              ${item.product_name}
            </p>
            <p class="text-sm text-gray-400 mt-1">
              Qty: ${item.quantity} ×
              ${Utils.formatPrice(item.price)}
            </p>
          </div>
          <div class="text-right">
            <p class="font-bold text-gray-900">
              ${Utils.formatPrice(item.subtotal)}
            </p>
            <span class="text-xs px-2 py-0.5 rounded-full
                         mt-1 inline-block
                         ${Utils.statusColor(item.status)}">
              ${item.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  // Status update buttons
  const statusSection = document.getElementById("status-buttons");
  const firstItem = items[0];

  if (first.payment_status !== "paid") {
    document.getElementById("status-section").innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200
                  rounded-xl p-4">
        <p class="text-yellow-700 text-sm font-medium">
          ⏳ Waiting for payment confirmation before
          you can update fulfilment status.
        </p>
      </div>
    `;
    return;
  }

  if (firstItem.status === "delivered") {
    document.getElementById("status-section").innerHTML = `
      <div class="bg-green-50 border border-green-200
                  rounded-xl p-4">
        <p class="text-green-700 text-sm font-medium">
          ✅ This order has been delivered successfully.
        </p>
      </div>
    `;
    return;
  }

  // Show relevant status buttons
  const statuses = [
    {
      value: "processing",
      label: "Mark as Processing",
      desc: "You are preparing this order",
      color: "bg-blue-600 hover:bg-blue-700",
      show: firstItem.status === "pending",
    },
    {
      value: "shipped",
      label: "Mark as Shipped",
      desc: "Order has been dispatched to buyer",
      color: "bg-purple-600 hover:bg-purple-700",
      show: firstItem.status === "pending" || firstItem.status === "processing",
    },
    {
      value: "delivered",
      label: "Mark as Delivered",
      desc: "Buyer has received the order",
      color: "bg-green-600 hover:bg-green-700",
      show: firstItem.status !== "delivered",
    },
  ];

  statusSection.innerHTML = statuses
    .filter((s) => s.show)
    .map(
      (s) => `
      <div class="flex items-center justify-between p-4
                  border border-gray-100 rounded-xl">
        <div>
          <p class="font-medium text-gray-900">${s.label}</p>
          <p class="text-sm text-gray-500">${s.desc}</p>
        </div>
        <button onclick="updateStatus('${s.value}')"
                class="${s.color} text-white px-4 py-2
                       rounded-lg text-sm font-medium transition">
          Update
        </button>
      </div>
    `,
    )
    .join("");

  // Buyer info
  document.getElementById("buyer-info").innerHTML = `
    <div class="flex gap-8">
      <div>
        <p class="text-gray-400 text-xs mb-1">Name</p>
        <p class="font-medium text-gray-900">
          ${first.buyer_name}
        </p>
      </div>
      <div>
        <p class="text-gray-400 text-xs mb-1">Email</p>
        <p class="font-medium text-gray-900">
          ${first.buyer_email}
        </p>
      </div>
    </div>
  `;
};

// ─── Update Status ────────────────────────────────────────────
const updateStatus = async (status) => {
  Modal.confirm(`Mark this order as "${status}"?`, async () => {
    // Update all items in this order
    let success = true;

    for (const item of currentOrder) {
      const res = await api.put(
        `/vendors/store/orders/${item.item_id}/status`,
        { status },
      );
      if (!res?.ok) {
        success = false;
      }
    }

    if (success) {
      Toast.show(`Order marked as ${status}! ✅`, "success");
      // Reload to reflect new status
      const id = new URLSearchParams(window.location.search).get("id");
      await loadOrder(id);
    } else {
      Toast.show("Failed to update some items", "error");
    }
  });
};
