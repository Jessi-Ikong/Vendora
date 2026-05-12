document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;
  await Navbar.render();

  Loader.show();
  const res = await api.get("/admin/reviews");
  Loader.hide();

  if (!res?.ok) return;

  const reviews = res.data.reviews;
  const tbody = document.getElementById("reviews-table");

  tbody.innerHTML = reviews
    .map(
      (r) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50">
      <td class="px-6 py-4">
        <p class="font-medium text-gray-900 text-sm">
          ${r.product_name}
        </p>
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        ${r.buyer_name}
      </td>
      <td class="px-6 py-4">
        <span class="text-yellow-400">
          ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
        </span>
      </td>
      <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
        ${r.comment || "—"}
      </td>
      <td class="px-6 py-4 text-sm text-gray-400">
        ${Utils.formatDate(r.created_at)}
      </td>
      <td class="px-6 py-4">
        <button onclick="deleteReview(${r.id})"
                class="text-red-500 hover:text-red-700 text-sm">
          Delete
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
});

const deleteReview = (id) => {
  Modal.confirm("Delete this review?", async () => {
    const res = await api.delete(`/admin/reviews/${id}`);
    if (res?.ok) {
      Toast.show("Review deleted", "success");
      location.reload();
    } else {
      Toast.show("Failed to delete", "error");
    }
  });
};
