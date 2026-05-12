const Navbar = {
  async render() {
    const user = Auth.getUser();
    const isLoggedIn = Auth.isLoggedIn();

    // Get cart count if logged in buyer
    let cartCount = 0;
    if (isLoggedIn && Auth.isBuyer()) {
      const res = await api.get("/cart");
      if (res?.ok) cartCount = res.data.cart.item_count;
    }

    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    navbar.innerHTML = `
      <nav class="bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">

            <!-- Logo -->
            <a href="${Auth.isLoggedIn() ? "../index.html" : "index.html"}"
            class="text-2xl font-bold text-indigo-600">
            Vendora
            </a>

            <!-- Search bar -->
            <div class="hidden md:flex flex-1 max-w-lg mx-8">
              <div class="relative w-full">
                <input
                  type="text"
                  id="navbar-search"
                  placeholder="Search products..."
                  class="w-full pl-4 pr-10 py-2 border border-gray-300
                         rounded-lg focus:outline-none focus:ring-2
                         focus:ring-indigo-500"
                />
                <button onclick="Navbar.search()"
                        class="absolute right-3 top-2.5 text-gray-400
                               hover:text-indigo-600">
                  🔍
                </button>
              </div>
            </div>

            <!-- Right side -->
            <div class="flex items-center gap-4">
              ${
                isLoggedIn
                  ? `
                <!-- Cart -->
                ${
                  Auth.isBuyer()
                    ? `
                  <a href="/buyer/cart.html"
                     class="relative text-gray-600 hover:text-indigo-600">
                    🛒
                    <span id="cart-count-badge"
                    class="absolute -top-2 -right-2 bg-indigo-600
                     text-white text-xs rounded-full
                    w-5 h-5 flex items-center justify-center
                    ${cartCount > 0 ? "" : "hidden"}">
                    ${cartCount}
                    </span>
                  </a>
                `
                    : ""
                }

                <!-- User menu -->
                <div x-data="{ open: false }" class="relative">
                  <button @click="open = !open"
                          class="flex items-center gap-2 text-gray-700
                                 hover:text-indigo-600">
                    <div class="w-8 h-8 bg-indigo-100 rounded-full
                                flex items-center justify-center
                                font-semibold text-indigo-600">
                      ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <span class="hidden md:block text-sm font-medium">
                      ${user.name.split(" ")[0]}
                    </span>
                    <span class="text-xs">▼</span>
                  </button>

                  <!-- Dropdown -->
                  <div x-show="open"
                       @click.away="open = false"
                       class="absolute right-0 mt-2 w-48 bg-white
                              rounded-xl shadow-lg border border-gray-100
                              py-1 z-50">
                    ${
                      Auth.isAdmin()
                        ? `
                      <a href="/admin/dashboard.html"
                         class="block px-4 py-2 text-sm text-gray-700
                                hover:bg-indigo-50">
                        Admin Dashboard
                      </a>
                    `
                        : ""
                    }
                    ${
                      Auth.isVendor()
                        ? `
                      <a href="/vendor/dashboard.html"
                         class="block px-4 py-2 text-sm text-gray-700
                                hover:bg-indigo-50">
                        Vendor Dashboard
                      </a>
                    `
                        : ""
                    }
                    ${
                      Auth.isBuyer()
                        ? `
                      <a href="/buyer/dashboard.html"
                         class="block px-4 py-2 text-sm text-gray-700
                                hover:bg-indigo-50">
                        My Account
                      </a>
                      <a href="/buyer/orders.html"
                         class="block px-4 py-2 text-sm text-gray-700
                                hover:bg-indigo-50">
                        My Orders
                      </a>
                      <a href="/buyer/wishlist.html"
                         class="block px-4 py-2 text-sm text-gray-700
                                hover:bg-indigo-50">
                        Wishlist
                      </a>
                    `
                        : ""
                    }
                    <hr class="my-1">
                    <button onclick="Auth.logout()"
                            class="block w-full text-left px-4 py-2
                                   text-sm text-red-600 hover:bg-red-50">
                      Logout
                    </button>
                  </div>
                </div>
              `
                  : `
                <a href="login.html"
                   class="text-gray-600 hover:text-indigo-600
                          text-sm font-medium">
                  Login
                </a>
                <a href="register.html"
                   class="bg-indigo-600 text-white px-4 py-2
                          rounded-lg text-sm font-medium
                          hover:bg-indigo-700 transition">
                  Sign Up
                </a>
              `
              }
            </div>
          </div>
        </div>
      </nav>
    `;

    // Search on Enter key
    const searchInput = document.getElementById("navbar-search");
    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") Navbar.search();
      });
    }
  },

  search() {
    const query = document.getElementById("navbar-search")?.value.trim();
    if (query) {
      // Handle path depth — works from any page level
      const depth = window.location.pathname.split("/").length - 2;
      const prefix = depth > 1 ? "../".repeat(depth - 1) : "";
      window.location.href = `${prefix}search.html?q=${encodeURIComponent(query)}`;
    }
  },
  // Call this after any cart action to update the count
  async updateCartCount() {
    if (!Auth.isLoggedIn() || !Auth.isBuyer()) return;

    const res = await api.get("/cart");
    if (!res?.ok) return;

    const count = res.data.cart.item_count;
    const badge = document.getElementById("cart-count-badge");

    if (!badge) return;

    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  },
};
