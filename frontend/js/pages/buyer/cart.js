document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAuth()) return;

  await Navbar.render();
  await loadCart();
});

// ─── Load Cart ────────────────────────────────────────────────
const loadCart = async () => {
  Loader.show();
  const res = await api.get("/cart");
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load cart", "error");
    return;
  }

  const { cart } = res.data;

  if (cart.item_count === 0) {
    document.getElementById("empty-cart").classList.remove("hidden");
    document.getElementById("cart-content").classList.add("hidden");
    return;
  }

  document.getElementById("empty-cart").classList.add("hidden");
  document.getElementById("cart-content").classList.remove("hidden");

  renderCartItems(cart.items);
  renderSummary(cart);
};

// ─── Render Cart Items ────────────────────────────────────────
const renderCartItems = (items) => {
  const container = document.getElementById("cart-items");

  container.innerHTML = items
    .map(
      (item) => `
    <div class="bg-white rounded-xl shadow-sm border
                border-gray-100 p-4 flex gap-4"
         id="cart-item-${item.item_id}"
         data-stock="${item.stock}"
         data-qty="${item.quantity}">

      <!-- Image -->
      <div class="w-24 h-24 flex-shrink-0 bg-gray-50
                  rounded-lg overflow-hidden">
        ${
          item.product_image
            ? `<img src="${item.product_image}"
                  alt="${item.product_name}"
                  class="w-full h-full object-cover"/>`
            : `<div class="w-full h-full flex items-center
                         justify-center text-3xl">📦</div>`
        }
      </div>

      <!-- Details -->
      <div class="flex-1 min-w-0">
        <div class="flex justify-between gap-2">
          <div>
            <p class="text-xs text-gray-400 mb-1">
              ${item.store_name || ""}
            </p>
            <a href="../product.html?slug=${item.product_slug}"
               class="font-medium text-gray-900 hover:text-indigo-600
                      line-clamp-2">
              ${item.product_name}
            </a>
            <p class="text-xs text-gray-500 mt-1">
              Stock: ${item.stock} available
            </p>
          </div>
          <button onclick="removeItem(${item.item_id})"
                  class="text-gray-300 hover:text-red-500
                         transition flex-shrink-0 text-xl">
            ×
          </button>
        </div>

        <div class="flex items-center justify-between mt-3">
          <!-- Quantity Controls -->
          <div class="flex items-center border border-gray-200
                      rounded-lg overflow-hidden">
            <button onclick="updateQty(${item.item_id}, ${item.quantity - 1}, ${item.stock})"
                    class="px-3 py-1 bg-gray-50 hover:bg-gray-100
                           text-gray-600 font-bold transition"
                    ${item.quantity <= 1 ? "disabled" : ""}>
              −
            </button>
            <span class="px-4 py-1 font-semibold text-sm
                         text-gray-900">
              ${item.quantity}
            </span>
            <button onclick="updateQty(${item.item_id}, ${item.quantity + 1}, ${item.stock})"
                    class="px-3 py-1 bg-gray-50 hover:bg-gray-100
                           text-gray-600 font-bold transition"
                    ${item.quantity >= item.stock ? "disabled" : ""}>
              +
            </button>
          </div>

          <!-- Price -->
          <div class="text-right">
            <p class="font-bold text-indigo-600">
              ${Utils.formatPrice(item.subtotal)}
            </p>
            <p class="text-xs text-gray-400">
              ${Utils.formatPrice(item.discount_price || item.price)} each
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
};
          <div class="text-right">
            <p class="font-bold text-indigo-600">
              ${Utils.formatPrice(item.subtotal)}
            </p>
            <p class="text-xs text-gray-400">
              ${Utils.formatPrice(item.discount_price || item.price)} each
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
};

// ─── Render Summary ───────────────────────────────────────────
const renderSummary = (cart) => {
  document.getElementById("item-count").textContent = cart.item_count;
  document.getElementById("subtotal").textContent = Utils.formatPrice(
    cart.total,
  );
  document.getElementById("total").textContent = Utils.formatPrice(cart.total);
};

// ─── Update Quantity ──────────────────────────────────────────
const updateQty = async (itemId, newQty, availableStock) => {
  if (newQty < 1) return;

  // Prevent exceeding stock
  if (newQty > availableStock) {
    Toast.show(`Only ${availableStock} items available in stock`, "error");
    return;
  }

  const res = await api.put(`/cart/items/${itemId}`, {
    quantity: newQty,
  });

  if (res?.ok) {
    await loadCart();
    Navbar.updateCartCount();
    Toast.show("Cart updated", "success");
  } else {
    Toast.show(res?.data?.message || "Failed to update", "error");
  }
};

// ─── Remove Item ──────────────────────────────────────────────
const removeItem = async (itemId) => {
  Modal.confirm("Remove this item from your cart?", async () => {
    const res = await api.delete(`/cart/items/${itemId}`);
    if (res?.ok) {
      Toast.show("Item removed", "success");
      await loadCart();
      Navbar.updateCartCount();
    } else {
      Toast.show("Failed to remove item", "error");
    }
  });
};

// ─── Clear Cart ───────────────────────────────────────────────
const clearCart = async () => {
  Modal.confirm("Clear your entire cart? This cannot be undone.", async () => {
    const res = await api.delete("/cart/clear");
    if (res?.ok) {
      Toast.show("Cart cleared", "success");
      await loadCart();
      Navbar.updateCartCount();
    } else {
      Toast.show("Failed to clear cart", "error");
    }
  });
};
