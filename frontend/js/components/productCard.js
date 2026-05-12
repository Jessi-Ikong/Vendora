const ProductCard = {
  // Render a single product card
  render(product) {
    const price = product.discount_price
      ? `<span class="text-indigo-600 font-bold">
           ${Utils.formatPrice(product.discount_price)}
         </span>
         <span class="text-gray-400 line-through text-sm ml-1">
           ${Utils.formatPrice(product.price)}
         </span>`
      : `<span class="text-indigo-600 font-bold">
           ${Utils.formatPrice(product.price)}
         </span>`;

    const image = product.primary_image
      ? `<img src="${product.primary_image}"
              alt="${product.name}"
              class="w-full h-full object-cover group-hover:scale-105
                     transition duration-300"/>`
      : `<div class="w-full h-full bg-gray-100 flex items-center
                     justify-center text-4xl">📦</div>`;

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100
                  overflow-hidden hover:shadow-md transition group">
        <!-- Image -->
        <a href="product.html?slug=${product.slug}"
           class="block h-48 overflow-hidden">
          ${image}
        </a>

        <!-- Details -->
        <div class="p-4">
          <!-- Store name -->
          <p class="text-xs text-gray-400 mb-1">${product.store_name || ""}</p>

          <!-- Product name -->
          <a href="product.html?slug=${product.slug}"
             class="font-medium text-gray-900 hover:text-indigo-600
                    line-clamp-2 block mb-2">
            ${product.name}
          </a>

          <!-- Rating -->
          <div class="flex items-center gap-1 mb-3">
            <span class="text-yellow-400 text-sm">
              ${Utils.stars(product.average_rating)}
            </span>
            <span class="text-xs text-gray-400">
              (${parseFloat(product.average_rating).toFixed(1)})
            </span>
          </div>

          <!-- Price and cart -->
          <div class="flex items-center justify-between">
            <div>${price}</div>
            ${
              Auth.isLoggedIn() && Auth.isBuyer()
                ? `
              <button onclick="ProductCard.addToCart(${product.id}, this)"
                      class="bg-indigo-600 text-white px-3 py-1.5
                             rounded-lg text-sm hover:bg-indigo-700
                             transition">
                + Cart
              </button>
            `
                : `
              <a href="login.html"
                 class="bg-indigo-600 text-white px-3 py-1.5
                        rounded-lg text-sm hover:bg-indigo-700 transition">
                Buy
              </a>
            `
            }
          </div>
        </div>
      </div>
    `;
  },

  // Render multiple product cards into a container
  renderAll(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-16 text-gray-400">
          <p class="text-4xl mb-4">📦</p>
          <p class="text-lg">No products found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map((p) => this.render(p)).join("");
  },

  // Add to cart from product card
  async addToCart(productId, button) {
    if (!Auth.isLoggedIn()) {
      window.location.href = "/login.html";
      return;
    }

    const original = button.textContent;
    button.textContent = "Adding...";
    button.disabled = true;

    const res = await api.post("/cart/items", {
      product_id: productId,
      quantity: 1,
    });

    if (res?.ok) {
      Toast.show("Added to cart! 🛒", "success");
      button.textContent = "✓ Added";

      // Update navbar cart count in real time
      Navbar.updateCartCount();

      setTimeout(() => {
        button.textContent = original;
        button.disabled = false;
      }, 2000);
    } else {
      Toast.show(res?.data?.message || "Failed to add to cart", "error");
      button.textContent = original;
      button.disabled = false;
    }
  },
};
