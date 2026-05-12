document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;
  await Navbar.render();

  await Promise.all([loadOverview(), loadRevenueChart()]);
});

const loadOverview = async () => {
  const res = await api.get("/admin/analytics/overview");
  if (!res?.ok) return;

  const o = res.data.overview;
  document.getElementById("total-revenue").textContent = Utils.formatPrice(
    o.total_revenue || 0,
  );
  document.getElementById("total-orders").textContent = o.total_orders || 0;
  document.getElementById("paid-orders").textContent = o.paid_orders || 0;
  document.getElementById("total-products").textContent = o.total_products || 0;
  document.getElementById("total-buyers").textContent = o.total_buyers || 0;
  document.getElementById("total-vendors").textContent =
    o.approved_vendors || 0;
};

const loadRevenueChart = async () => {
  const res = await api.get("/admin/analytics/revenue");
  if (!res?.ok) return;

  const data = res.data.revenue;
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
          backgroundColor: "rgba(99,102,241,0.1)",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Orders",
          data: data.map((d) => parseInt(d.order_count)),
          borderColor: "#10b981",
          tension: 0.4,
          yAxisID: "y2",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => `₦${(v / 1000).toFixed(0)}k`,
          },
        },
        y2: {
          position: "right",
          beginAtZero: true,
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
};
