document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;
  await Navbar.render();

  Loader.show();
  const res = await api.get("/admin/orders");
  Loader.hide();

  if (!res?.ok) return;

  const orders = res.data.orders;
  const tbody = document.getElementById("orders-table");

  tbody.innerHTML = orders
    .map(
      (o) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50">
      <td class="px-6 py-4 font-medium text-gray-900">#${o.id}</td>
      <td class="px-6 py-4">
        <p class="text-sm text-gray-900">${o.buyer_name}</p>
        <p class="text-xs text-gray-400">${o.buyer_email}</p>
      </td>
      <td class="px-6 py-4 font-bold text-gray-900">
        ${Utils.formatPrice(o.total_amount)}
      </td>
      <td class="px-6 py-4">
        <p class="text-sm text-gray-900 font-mono">${o.paystack_ref || "-"}</p>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs
                     ${Utils.statusColor(o.status)}">
          ${o.status}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs
                     ${Utils.statusColor(o.payment_status)}">
          ${o.payment_status}
        </span>
      </td>
      <td class="px-6 py-4 text-sm text-gray-500">
        ${Utils.formatDate(o.created_at)}
      </td>
    </tr>
  `,
    )
    .join("");
});
