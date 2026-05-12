document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAuth()) return;

  await Navbar.render();
  await loadWishlist();
});

// ─── Load Wishlist ────────────────────────────────────────────
const loadWishlist = async () => {
  Loader.show();
  const res = await api.get("/wishlist");
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load wishlist", "error");
    return;
  }

  const { wishlist } = res.data;

  // Update count
  document.getElementById("wishlist-count").textContent =
    `${wishlist.item_count} item${wishlist.item_count !== 1 ? "s" : ""} saved`;

  if (wishlist.item_count === 0) {
    document.getElementById("empty-wishlist").classList.remove("hidden");
    document.getElementById("wishlist-grid").innerHTML = "";
    return;
  }

  document.getElementById("empty-wishlist").classList.add("hidden");
  renderWishlist(wishlist.items);
};

// ─── Render Wishlist ──────────────────────────────────────────
const renderWishlist = (items) => {
  const grid = document.getElementById("wishlist-grid");

  grid.innerHTML = items
    .map(
      (item) => `
    <div class="bg-white rounded-xl shadow-sm border
                border-gray-100 overflow-hidden hover:shadow-md
                transition group">

      <!-- Image -->
      <a href="../product.html?slug=${item.slug}"
         class="block h-44 overflow-hidden relative">
        ${
          item.primary_image
            ? `<img src="${item.primary_image}"
                  alt="${item.name}"
                  class="w-full h-full object-cover
                         group-hover:scale-105 transition duration-300"/>`
            : `<div class="w-full h-full bg-gray-100 flex items-center
                         justify-center text-4xl">📦</div>`
        }

        <!-- Remove Button -->
        <button onclick="removeFromWishlist(${item.product_id}, this)"
                class="absolute top-2 right-2 w-8 h-8 bg-white
                       rounded-full shadow flex items-center
                       justify-center text-red-400 hover:text-red-600
                       hover:shadow-md transition opacity-0
                       group-hover:opacity-100">
          ×
        </button>

        <!-- Out of Stock Badge -->
        ${
          item.stock === 0
            ? `
          <div class="absolute bottom-0 left-0 right-0 bg-black
                      bg-opacity-50 text-white text-xs text-center py-1">
            Out of Stock
          </div>
        `
            : ""
        }
      </a>

      <!-- Details -->
      <div class="p-4">
        <p class="text-xs text-gray-400 mb-1">${item.store_name || ""}</p>
        <a href="../product.html?slug=${item.slug}"
           class="font-medium text-gray-900 hover:text-indigo-600
                  line-clamp-2 block mb-2 text-sm">
          ${item.name}
        </a>

        <!-- Price -->
        <div class="flex items-center gap-2 mb-3">
          <span class="font-bold text-indigo-600">
            ${Utils.formatPrice(item.discount_price || item.price)}
          </span>
          ${
            item.discount_price
              ? `
            <span class="text-gray-400 line-through text-xs">
              ${Utils.formatPrice(item.price)}
            </span>
          `
              : ""
          }
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button onclick="moveToCart(${item.product_id}, this)"
                  ${item.stock === 0 ? "disabled" : ""}
                  class="flex-1 bg-indigo-600 text-white py-2
                         rounded-lg text-xs font-medium
                         hover:bg-indigo-700 transition
                         disabled:opacity-50 disabled:cursor-not-allowed">
            Add to Cart
          </button>
          <button onclick="removeFromWishlist(${item.product_id}, this)"
                  class="p-2 border border-gray-200 rounded-lg
                         hover:border-red-300 hover:text-red-500
                         transition text-gray-400">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
};

// ─── Remove From Wishlist ─────────────────────────────────────
const removeFromWishlist = async (productId, btn) => {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "...";

  const res = await api.delete(`/wishlist/${productId}`);

  if (res?.ok) {
    Toast.show("Removed from wishlist", "success");
    await loadWishlist();
    Navbar.updateCartCount();
  } else {
    Toast.show("Failed to remove", "error");
    btn.textContent = original;
    btn.disabled = false;
  }
};

// ─── Move to Cart ─────────────────────────────────────────────
const moveToCart = async (productId, btn) => {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Adding...";

  const res = await api.post(`/wishlist/${productId}/move-to-cart`);

  if (res?.ok) {
    Toast.show("Moved to cart! 🛒", "success");
    await loadWishlist();
    Navbar.updateCartCount();
  } else {
    Toast.show(res?.data?.message || "Failed to move to cart", "error");
    btn.textContent = original;
    btn.disabled = false;
  }
};
