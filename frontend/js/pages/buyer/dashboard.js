document.addEventListener("DOMContentLoaded", async () => {
  // Protect route
  if (!Router.requireAuth()) return;
  if (!Auth.isBuyer() && !Auth.isAdmin()) {
    window.location.href = "../index.html";
    return;
  }

  await Navbar.render();

  const user = Auth.getUser();

  // Welcome message
  document.getElementById("welcome-msg").textContent =
    `Welcome back, ${user.name.split(" ")[0]}! 👋`;

  // Profile card
  document.getElementById("avatar-initial").textContent = user.name
    .charAt(0)
    .toUpperCase();
  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;

  // Load data
  await Promise.all([loadOrders(), loadWishlistCount()]);
});

// ─── Load Orders ──────────────────────────────────────────────
const loadOrders = async () => {
  const res = await api.get("/orders");
  if (!res?.ok) return;

  const orders = res.data.orders;

  // Stats
  document.getElementById("stat-orders").textContent = orders.length;
  document.getElementById("stat-pending").textContent = orders.filter(
    (o) => o.status === "pending" || o.status === "processing",
  ).length;
  document.getElementById("stat-delivered").textContent = orders.filter(
    (o) => o.status === "delivered",
  ).length;

  // Recent orders table
  const container = document.getElementById("recent-orders");

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <p class="text-4xl mb-3">📦</p>
        <p class="font-medium">No orders yet</p>
        <a href="../products.html"
           class="text-indigo-600 text-sm hover:underline mt-2 block">
          Start shopping →
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left py-3 text-gray-500 font-medium">
              Order
            </th>
            <th class="text-left py-3 text-gray-500 font-medium">
              Date
            </th>
            <th class="text-left py-3 text-gray-500 font-medium">
              Total
            </th>
            <th class="text-left py-3 text-gray-500 font-medium">
              Status
            </th>
            <th class="text-left py-3 text-gray-500 font-medium">
            </th>
          </tr>
        </thead>
        <tbody>
          ${orders
            .slice(0, 5)
            .map(
              (order) => `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 font-medium text-gray-900">
                #${order.id}
              </td>
              <td class="py-3 text-gray-500">
                ${Utils.formatDate(order.created_at)}
              </td>
              <td class="py-3 font-medium">
                ${Utils.formatPrice(order.total_amount)}
              </td>
              <td class="py-3">
                <span class="px-2 py-1 rounded-full text-xs
                             font-medium ${Utils.statusColor(order.status)}">
                  ${order.status}
                </span>
              </td>
              <td class="py-3">
                <a href="order.html?id=${order.id}"
                   class="text-indigo-600 hover:underline">
                  View
                </a>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
};

// ─── Load Wishlist Count ──────────────────────────────────────
const loadWishlistCount = async () => {
  const res = await api.get("/wishlist");
  if (!res?.ok) return;

  document.getElementById("stat-wishlist").textContent =
    res.data.wishlist.item_count;
};
