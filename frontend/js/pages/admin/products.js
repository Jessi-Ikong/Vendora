document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;
  await Navbar.render();

  Loader.show();
  const res = await api.get("/admin/products");
  Loader.hide();

  if (!res?.ok) return;

  const products = res.data.products;
  const tbody = document.getElementById("products-table");

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50">
      <td class="px-6 py-4">
        <p class="font-medium text-gray-900">${p.name}</p>
        <p class="text-xs text-gray-400">${p.category_name || "Uncategorized"}</p>
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        ${p.store_name}
      </td>
      <td class="px-6 py-4 font-medium text-gray-900">
        ${Utils.formatPrice(p.price)}
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">${p.stock}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs
                     ${
                       p.is_published
                         ? "bg-green-100 text-green-700"
                         : "bg-gray-100 text-gray-500"
                     }">
          ${p.is_published ? "Published" : "Draft"}
        </span>
      </td>
      <td class="px-6 py-4">
        <button onclick="deleteProduct(${p.id})"
                class="text-red-500 hover:text-red-700 text-sm">
          Remove
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
});

const deleteProduct = (id) => {
  Modal.confirm("Remove this product from the platform?", async () => {
    const res = await api.delete(`/admin/products/${id}`);
    if (res?.ok) {
      Toast.show("Product removed", "success");
      location.reload();
    } else {
      Toast.show("Failed to remove", "error");
    }
  });
};
