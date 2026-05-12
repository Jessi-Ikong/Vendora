document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;

  await Navbar.render();

  await Promise.all([
    loadOverview(),
    loadRevenue(),
    loadTopVendors(),
    loadTopProducts(),
    loadRecentOrders(),
  ]);

  // Auto-refresh every 30 seconds to pick up new payments
  setInterval(async () => {
    await Promise.all([
      loadOverview(),
      loadRevenue(),
      loadTopVendors(),
      loadTopProducts(),
      loadRecentOrders(),
    ]);
  }, 30000);
});

// ─── Manual Refresh Function ──────────────────────────────────
const refreshDashboard = async () => {
  const btn = document.getElementById("refresh-btn");
  if (btn) btn.disabled = true;

  await Promise.all([
    loadOverview(),
    loadRevenue(),
    loadTopVendors(),
    loadTopProducts(),
    loadRecentOrders(),
  ]);

  if (btn) {
    btn.disabled = false;
    Toast.show("Dashboard refreshed!", "success");
  }
};

// ─── Overview Stats ───────────────────────────────────────────
const loadOverview = async () => {
  const res = await api.get("/admin/analytics/overview");
  if (!res?.ok) return;

  const o = res.data.overview;

  document.getElementById("stat-revenue").textContent = Utils.formatPrice(
    o.total_revenue || 0,
  );
  document.getElementById("stat-orders").textContent = o.total_orders || 0;
  document.getElementById("stat-users").textContent =
    parseInt(o.total_buyers || 0) + parseInt(o.total_vendors || 0);
  document.getElementById("stat-vendors").textContent = o.approved_vendors || 0;
};

// ─── Revenue Chart ────────────────────────────────────────────
const loadRevenue = async () => {
  const res = await api.get("/admin/analytics/revenue");
  if (!res?.ok) return;

  const data = res.data.revenue;
  const ctx = document.getElementById("revenue-chart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map((d) => d.month),
      datasets: [
        {
          label: "Revenue (₦)",
          data: data.map((d) => parseFloat(d.revenue)),
          backgroundColor: "rgba(99, 102, 241, 0.8)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => `₦${(v / 1000).toFixed(0)}k`,
          },
        },
        x: {
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
          },
        },
      },
    },
  });
};

// ─── Top Vendors ──────────────────────────────────────────────
const loadTopVendors = async () => {
  const res = await api.get("/admin/analytics/top-vendors");
  if (!res?.ok) return;

  const container = document.getElementById("top-vendors");
  const vendors = res.data.vendors;

  if (vendors.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 text-sm text-center py-4">
        No vendors yet
      </p>
    `;
    return;
  }

  container.innerHTML = vendors
    .map(
      (v, i) => `
    <div class="flex items-center gap-3">
      <span class="w-6 h-6 bg-indigo-100 text-indigo-600
                   rounded-full flex items-center justify-center
                   text-xs font-bold flex-shrink-0">
        ${i + 1}
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">
          ${v.store_name}
        </p>
        <p class="text-xs text-gray-400">
          ${v.product_count} products
        </p>
      </div>
      <p class="text-sm font-bold text-indigo-600 flex-shrink-0">
        ${Utils.formatPrice(v.revenue)}
      </p>
    </div>
  `,
    )
    .join("");
};

// ─── Top Products ─────────────────────────────────────────────
const loadTopProducts = async () => {
  const res = await api.get("/admin/analytics/top-products");
  if (!res?.ok) return;

  const container = document.getElementById("top-products");
  const products = res.data.products;

  if (products.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 text-sm text-center py-4">
        No products yet
      </p>
    `;
    return;
  }

  container.innerHTML = products
    .map(
      (p, i) => `
    <div class="flex items-center gap-3 py-2 border-b
                border-gray-50 last:border-0">
      <span class="w-6 h-6 bg-purple-100 text-purple-600
                   rounded-full flex items-center justify-center
                   text-xs font-bold flex-shrink-0">
        ${i + 1}
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">
          ${p.name}
        </p>
        <p class="text-xs text-gray-400">
          ${p.total_sold} sold • ${p.store_name}
        </p>
      </div>
      <p class="text-sm font-bold text-gray-900 flex-shrink-0">
        ${Utils.formatPrice(p.price)}
      </p>
    </div>
  `,
    )
    .join("");
};

// ─── Recent Orders ────────────────────────────────────────────
const loadRecentOrders = async () => {
  const res = await api.get("/admin/orders");
  if (!res?.ok) return;

  const container = document.getElementById("recent-orders");
  const orders = res.data.orders.slice(0, 5);

  if (orders.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 text-sm text-center py-4">
        No orders yet
      </p>
    `;
    return;
  }

  container.innerHTML = orders
    .map(
      (order) => `
    <div class="flex items-center justify-between py-3
                border-b border-gray-50 last:border-0">
      <div>
        <p class="text-sm font-medium text-gray-900">
          #${order.id} — ${order.buyer_name}
        </p>
        <p class="text-xs text-gray-400">
          ${Utils.formatDate(order.created_at)}
        </p>
      </div>
      <div class="text-right">
        <p class="text-sm font-bold text-gray-900">
          ${Utils.formatPrice(order.total_amount)}
        </p>
        <span class="text-xs px-2 py-0.5 rounded-full
                     ${Utils.statusColor(order.payment_status)}">
          ${order.payment_status}
        </span>
      </div>
    </div>
  `,
    )
    .join("");
};
