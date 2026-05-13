let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireVendor()) return;

  await Navbar.render();
  await loadProducts();

  // Search on input
  document
    .getElementById("search-input")
    .addEventListener("input", filterProducts);
});

// ─── Load Products ────────────────────────────────────────────
const loadProducts = async () => {
  Loader.show();
  const res = await api.get("/products/vendor/mine");
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load products", "error");
    return;
  }

  allProducts = (res.data.products || []).sort((a, b) => {
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  document.getElementById("products-count").textContent =
    `${allProducts.length} product${allProducts.length !== 1 ? "s" : ""}`;

  renderProducts(allProducts);
};

// ─── Render Products ──────────────────────────────────────────
const renderProducts = (products) => {
  const tbody = document.getElementById("products-table");
  const emptyState = document.getElementById("empty-state");

  if (products.length === 0) {
    tbody.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  tbody.innerHTML = products
    .map(
      (product) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition">

      <!-- Product -->
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gray-100 rounded-lg
                      overflow-hidden flex-shrink-0 flex items-center
                      justify-center text-xl">
            📦
          </div>
          <div>
            <p class="font-medium text-gray-900">${product.name}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              ${product.category_name || "Uncategorized"}
            </p>
          </div>
        </div>
      </td>

      <!-- Price -->
      <td class="px-6 py-4">
        <p class="font-medium text-gray-900">
          ${Utils.formatPrice(product.price)}
        </p>
        ${
          product.discount_price
            ? `
          <p class="text-xs text-green-600">
            Sale: ${Utils.formatPrice(product.discount_price)}
          </p>
        `
            : ""
        }
      </td>

      <!-- Stock -->
      <td class="px-6 py-4">
        <span class="font-medium
                     ${
                       product.stock === 0
                         ? "text-red-600"
                         : product.stock <= 5
                           ? "text-orange-500"
                           : "text-gray-900"
                     }">
          ${product.stock}
        </span>
      </td>

      <!-- Status -->
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs font-medium
                     ${
                       product.is_published
                         ? "bg-green-100 text-green-700"
                         : "bg-gray-100 text-gray-500"
                     }">
          ${product.is_published ? "Published" : "Draft"}
        </span>
      </td>

      <!-- Actions -->
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <a href="edit-product.html?id=${product.id}"
             class="text-indigo-600 hover:underline text-sm">
            Edit
          </a>
          <span class="text-gray-300">|</span>
          <button onclick="togglePublish(${product.id}, this)"
                  class="text-sm
                         ${
                           product.is_published
                             ? "text-orange-500 hover:text-orange-700"
                             : "text-green-600 hover:text-green-800"
                         }">
            ${product.is_published ? "Unpublish" : "Publish"}
          </button>
          <span class="text-gray-300">|</span>
          <button onclick="deleteProduct(${product.id})"
                  class="text-red-500 hover:text-red-700 text-sm">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
};

// ─── Filter Products ──────────────────────────────────────────
const filterProducts = () => {
  const search = document.getElementById("search-input").value.toLowerCase();
  const status = document.getElementById("status-filter").value;

  const filtered = allProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search);
    const matchesStatus =
      status === "all"
        ? true
        : status === "published"
          ? p.is_published
          : !p.is_published;

    return matchesSearch && matchesStatus;
  });

  renderProducts(filtered);
};

// ─── Toggle Publish ───────────────────────────────────────────
const togglePublish = async (productId, btn) => {
  const original = btn.textContent.trim();
  btn.textContent = "...";
  btn.disabled = true;

  const res = await api.put(`/products/${productId}/publish`);

  if (res?.ok) {
    Toast.show(
      `Product ${
        res.data.product.is_published ? "published" : "unpublished"
      } successfully`,
      "success",
    );
    await loadProducts();
  } else {
    Toast.show("Failed to update product", "error");
    btn.textContent = original;
    btn.disabled = false;
  }
};

// ─── Delete Product ───────────────────────────────────────────
const deleteProduct = (productId) => {
  Modal.confirm("Delete this product? This cannot be undone.", async () => {
    const res = await api.delete(`/products/${productId}`);
    if (res?.ok) {
      Toast.show("Product deleted", "success");
      await loadProducts();
    } else {
      Toast.show(res?.data?.message || "Failed to delete product", "error");
    }
  });
};
