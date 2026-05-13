let allOrders = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireVendor()) return;

  await Navbar.render();
  await loadOrders();
});

// ─── Load Orders ──────────────────────────────────────────────
const loadOrders = async () => {
  Loader.show();
  const res = await api.get("/vendors/store/orders");
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load orders", "error");
    return;
  }

  allOrders = res.data.orders;
  renderOrders(allOrders);
};

// ─── Render Orders ────────────────────────────────────────────
const renderOrders = (orders) => {
  const tbody = document.getElementById("orders-table");
  const emptyState = document.getElementById("empty-state");
  if (orders.length === 0) {
    tbody.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  tbody.innerHTML = orders
    .map(
      (order) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition">

      <!-- Product -->
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 rounded-lg
                      overflow-hidden flex-shrink-0">
            ${
              order.product_image
                ? `<img src="${order.product_image}"
                      class="w-full h-full object-cover"/>`
                : `<div class="w-full h-full flex items-center
                             justify-center text-lg">📦</div>`
            }
          </div>
          <div>
            <p class="font-medium text-gray-900 text-sm">
              ${order.product_name}
            </p>
            <p class="text-xs text-gray-400">
              Qty: ${order.quantity} ×
              ${Utils.formatPrice(order.price)}
            </p>
          </div>
        </div>
      </td>

      <!-- Buyer -->
      <td class="px-6 py-4">
        <p class="text-sm font-medium text-gray-900">
          ${order.buyer_name}
        </p>
        <p class="text-xs text-gray-400">${order.buyer_email}</p>
      </td>

      <!-- Reference -->
      <td class="px-6 py-4">
        <p class="text-xs text-gray-900 font-mono">${order.paystack_ref || "-"}</p>
      </td>

      <!-- Amount -->
      <td class="px-6 py-4">
        <p class="font-bold text-gray-900">
          ${Utils.formatPrice(order.subtotal)}
        </p>
        <span class="text-xs px-2 py-0.5 rounded-full
                     ${Utils.statusColor(order.payment_status)}">
          ${order.payment_status}
        </span>
      </td>

      <!-- Date -->
      <td class="px-6 py-4 text-sm text-gray-500">
        ${Utils.formatDate(order.created_at)}
      </td>

      <!-- Status -->
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs font-medium
                     ${Utils.statusColor(order.status)}">
          ${order.status}
        </span>
      </td>

      <!-- Action -->
      <td class="px-6 py-4">
        ${
          order.payment_status === "paid" && order.status !== "delivered"
            ? `
          <select onchange="updateStatus(${order.item_id}, this.value, this)"
                  class="text-sm border border-gray-300 rounded-lg
                         px-2 py-1 focus:outline-none
                         focus:ring-2 focus:ring-indigo-500">
            <option value="">Update status</option>
            ${
              order.status === "pending"
                ? `
              <option value="processing">Processing</option>
            `
                : ""
            }
            ${
              order.status !== "shipped" && order.status !== "delivered"
                ? `
              <option value="shipped">Shipped</option>
            `
                : ""
            }
            ${
              order.status !== "delivered"
                ? `
              <option value="delivered">Delivered</option>
            `
                : ""
            }
          </select>
        `
            : `
          <span class="text-xs text-gray-400">
            ${
              order.status === "delivered"
                ? "✅ Completed"
                : "⏳ Awaiting payment"
            }
          </span>
        `
        }
      </td>
    </tr>
  `,
    )
    .join("");
};

// ─── Filter Orders. ────────────────────────────────────────────
const filterOrders = (status) => {
  document.querySelectorAll("[id^='tab-']").forEach((tab) => {
    tab.className = `px-4 py-2 rounded-lg text-sm font-medium
                     whitespace-nowrap bg-white text-gray-600
                     border border-gray-200 hover:border-indigo-300`;
  });

  document.getElementById(`tab-${status}`).className =
    `px-4 py-2 rounded-lg text-sm font-medium
     whitespace-nowrap bg-indigo-600 text-white`;

  const filtered =
    status === "all" ? allOrders : allOrders.filter((o) => o.status === status);

  renderOrders(filtered);
};

// ─── Update Order Status ──────────────────────────────────────
const updateStatus = async (itemId, status, select) => {
  if (!status) return;

  select.disabled = true;

  const res = await api.put(`/vendors/store/orders/${itemId}/status`, {
    status,
  });

  if (res?.ok) {
    Toast.show(`Order marked as ${status}`, "success");
    await loadOrders();
  } else {
    Toast.show(res?.data?.message || "Failed to update status", "error");
    select.disabled = false;
    select.value = "";
  }
};
