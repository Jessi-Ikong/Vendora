document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireVendor()) return;

  await Navbar.render();
  await loadDashboard();
});

// ─── Load Dashboard ───────────────────────────────────────────
const loadDashboard = async () => {
  Loader.show();
  const res = await api.get("/vendors/dashboard/stats");
  Loader.hide();

  if (!res?.ok) {
    // Vendor might not have a store yet
    if (res?.status === 404) {
      window.location.href = "store-profile.html";
    }
    return;
  }

  const { stats, monthlyRevenue, bestSellers, lowStock, recentOrders } =
    res.data;

  // Store name
  const vendorRes = await api.get("/vendors/store/profile");
  if (vendorRes?.ok) {
    const vendor = vendorRes.data.vendor;
    document.getElementById("store-name-display").textContent =
      `🏪 ${vendor.store_name}`;

    // Show approval banner if not approved
    if (!vendor.is_approved) {
      document.getElementById("approval-banner").classList.remove("hidden");
    }
  }

  // Stats
  document.getElementById("stat-revenue").textContent = Utils.formatPrice(
    stats.total_revenue || 0,
  );
  document.getElementById("stat-orders").textContent = stats.total_orders || 0;
  document.getElementById("stat-pending").textContent =
    stats.pending_orders || 0;
  document.getElementById("stat-products").textContent =
    stats.total_products || 0;

  // Revenue Chart
  renderRevenueChart(monthlyRevenue);

  // Best Sellers
  renderBestSellers(bestSellers);

  // Recent Orders
  renderRecentOrders(recentOrders);

  // Low Stock
  renderLowStock(lowStock);
};

// ─── Revenue Chart ────────────────────────────────────────────
const renderRevenueChart = (data) => {
  const ctx = document.getElementById("revenue-chart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((d) => d.month),
      datasets: [
        {
          label: "Revenue (₦)",
          data: data.map((d) => parseFloat(d.revenue)),
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#6366f1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true, // ← added
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `₦${(value / 1000).toFixed(0)}k`,
          },
        },
        x: {
          // ← added entire x section
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

// ─── Best Sellers ─────────────────────────────────────────────
const renderBestSellers = (products) => {
  const container = document.getElementById("best-sellers");

  if (!products || products.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 text-sm text-center py-4">
        No sales yet
      </p>
    `;
    return;
  }

  container.innerHTML = products
    .map(
      (p, i) => `
    <div class="flex items-center gap-3">
      <span class="w-6 h-6 bg-indigo-100 text-indigo-600
                   rounded-full flex items-center justify-center
                   text-xs font-bold flex-shrink-0">
        ${i + 1}
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">
          ${p.name}
        </p>
        <p class="text-xs text-gray-400">${p.total_sold} sold</p>
      </div>
      <p class="text-sm font-bold text-indigo-600 flex-shrink-0">
        ${Utils.formatPrice(p.price)}
      </p>
    </div>
  `,
    )
    .join("");
};

// ─── Recent Orders ────────────────────────────────────────────
const renderRecentOrders = (orders) => {
  const container = document.getElementById("recent-orders");

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 text-sm text-center py-4">
        No orders yet
      </p>
    `;
    return;
  }

  container.innerHTML = orders
    .slice(0, 5)
    .map(
      (order) => `
    <div class="flex items-center justify-between py-3
                border-b border-gray-50 last:border-0">
      <div>
        <p class="text-sm font-medium text-gray-900">
          ${order.product_name}
        </p>
        <p class="text-xs text-gray-400">
          ${order.buyer_name} •
          ${Utils.formatDate(order.created_at)}
        </p>
      </div>
      <div class="text-right">
        <p class="text-sm font-bold text-gray-900">
          ${Utils.formatPrice(order.subtotal)}
        </p>
        <span class="text-xs px-2 py-0.5 rounded-full
                     ${Utils.statusColor(order.status)}">
          ${order.status}
        </span>
      </div>
    </div>
  `,
    )
    .join("");
};

// ─── Low Stock ────────────────────────────────────────────────
const renderLowStock = (products) => {
  const container = document.getElementById("low-stock");

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <p class="text-green-600 text-sm font-medium">
          ✅ All products well stocked
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = products
    .map(
      (p) => `
    <div class="flex items-center justify-between py-3
                border-b border-gray-50 last:border-0">
      <div>
        <p class="text-sm font-medium text-gray-900">${p.name}</p>
        <p class="text-xs text-gray-400">
          ${p.is_published ? "Published" : "Draft"}
        </p>
      </div>
      <div class="text-right">
        <span class="text-sm font-bold
                     ${p.stock === 0 ? "text-red-600" : "text-orange-500"}">
          ${p.stock} left
        </span>
        <a href="edit-product.html?id=${p.id}"
           class="block text-xs text-indigo-600 hover:underline mt-1">
          Restock →
        </a>
      </div>
    </div>
  `,
    )
    .join("");
};
