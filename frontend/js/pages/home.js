document.addEventListener("DOMContentLoaded", async () => {
  // Render navbar
  await Navbar.render();

  // Load all sections simultaneously
  await Promise.all([loadCategories(), loadBestSellers(), loadTopRated()]);
});

// ─── Load Categories ──────────────────────────────────────────
const loadCategories = async () => {
  const res = await api.get("/categories");
  if (!res?.ok) return;

  const categories = res.data.categories;

  // Quick category pills in hero
  const quickCats = document.getElementById("quick-categories");
  if (quickCats) {
    quickCats.innerHTML = categories
      .slice(0, 6)
      .map(
        (cat) => `
      <a href="category.html?slug=${cat.slug}"
         class="bg-white bg-opacity-20 hover:bg-opacity-30
                text-white px-4 py-2 rounded-full text-sm
                transition backdrop-blur-sm">
        ${cat.name}
      </a>
    `,
      )
      .join("");
  }

  // Categories grid
  const grid = document.getElementById("categories-grid");
  if (!grid) return;

  if (categories.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-8 text-gray-400">
        No categories yet
      </div>
    `;
    return;
  }

  const colors = [
    "bg-red-100 text-red-600",
    "bg-blue-100 text-blue-600",
    "bg-green-100 text-green-600",
    "bg-yellow-100 text-yellow-600",
    "bg-purple-100 text-purple-600",
    "bg-pink-100 text-pink-600",
    "bg-indigo-100 text-indigo-600",
    "bg-orange-100 text-orange-600",
  ];

  const emojis = ["📱", "👗", "🏠", "💄", "📚", "🎮", "🍕", "⚽"];

  grid.innerHTML = categories
    .map(
      (cat, i) => `
    <a href="category.html?slug=${cat.slug}"
       class="bg-white rounded-xl p-4 text-center shadow-sm
              border border-gray-100 hover:shadow-md
              hover:border-indigo-200 transition group">
      <div class="w-12 h-12 ${colors[i % colors.length]}
                  rounded-xl flex items-center justify-center
                  text-2xl mx-auto mb-3 group-hover:scale-110
                  transition">
        ${emojis[i % emojis.length]}
      </div>
      <p class="font-medium text-gray-900 text-sm">${cat.name}</p>
      <p class="text-xs text-gray-400 mt-1">
        ${cat.product_count} products
      </p>
    </a>
  `,
    )
    .join("");
};

// ─── Load Best Sellers ────────────────────────────────────────
const loadBestSellers = async () => {
  const res = await api.get("/products/best-sellers?limit=8");
  if (!res?.ok) return;

  ProductCard.renderAll(res.data.products, "best-sellers-grid");
};

// ─── Load Top Rated ───────────────────────────────────────────
const loadTopRated = async () => {
  const res = await api.get("/products/top-rated?limit=8");
  if (!res?.ok) return;

  ProductCard.renderAll(res.data.products, "top-rated-grid");
};

// ─── Hero Search ──────────────────────────────────────────────
const heroSearch = () => {
  const query = document.getElementById("hero-search")?.value.trim();
  if (query) {
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
  }
};

// Search on Enter key
document.getElementById("hero-search")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") heroSearch();
});
