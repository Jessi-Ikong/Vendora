let currentPage = 1;
let currentFilters = {};

document.addEventListener("DOMContentLoaded", async () => {
  await Navbar.render();

  // Read URL params for pre-applied filters
  const params = new URLSearchParams(window.location.search);
  if (params.get("sort")) currentFilters.sort = params.get("sort");
  if (params.get("category")) currentFilters.category = params.get("category");

  // Set sort dropdown value
  if (currentFilters.sort) {
    document.getElementById("sort-select").value = currentFilters.sort;
  }

  await Promise.all([loadCategories(), loadProducts()]);
});

// ─── Load Categories into Sidebar ────────────────────────────
const loadCategories = async () => {
  const res = await api.get("/categories");
  if (!res?.ok) return;

  const container = document.getElementById("category-filters");
  container.innerHTML = res.data.categories
    .map(
      (cat) => `
    <label class="flex items-center gap-2 cursor-pointer group">
      <input type="radio" name="category" value="${cat.slug}"
             ${currentFilters.category === cat.slug ? "checked" : ""}
             onchange="selectCategory('${cat.slug}')"
             class="text-indigo-600"/>
      <span class="text-sm text-gray-700 group-hover:text-indigo-600
                   transition">
        ${cat.name}
      </span>
      <span class="text-xs text-gray-400 ml-auto">
        ${cat.product_count}
      </span>
    </label>
  `,
    )
    .join("");
};

// ─── Load Products ────────────────────────────────────────────
const loadProducts = async () => {
  Loader.show();

  // Build query string
  const params = new URLSearchParams({
    page: currentPage,
    limit: 12,
    ...currentFilters,
  });

  const res = await api.get(`/products?${params}`);
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load products", "error");
    return;
  }

  const { products, pagination } = res.data;

  // Update results count
  document.getElementById("results-count").textContent =
    `${pagination.total} products found`;

  document.getElementById("page-info").textContent =
    `Page ${pagination.currentPage} of ${pagination.totalPages}`;

  // Render products
  ProductCard.renderAll(products, "products-grid");

  // Render pagination
  Pagination.render(pagination, "pagination", (page) => {
    currentPage = page;
    loadProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

// ─── Apply Filters ────────────────────────────────────────────
const applyFilters = () => {
  const sort = document.getElementById("sort-select").value;
  const minPrice = document.getElementById("min-price").value;
  const maxPrice = document.getElementById("max-price").value;
  const rating = document.querySelector('input[name="rating"]:checked')?.value;

  currentFilters = {
    ...currentFilters,
    sort: sort || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    rating: rating || undefined,
  };

  // Remove undefined keys
  Object.keys(currentFilters).forEach((key) => {
    if (!currentFilters[key]) delete currentFilters[key];
  });

  currentPage = 1;
  loadProducts();
};

// ─── Select Category ──────────────────────────────────────────
const selectCategory = (slug) => {
  currentFilters.category = slug;
  currentPage = 1;
  loadProducts();
};

// ─── Clear Filters ────────────────────────────────────────────
const clearFilters = () => {
  currentFilters = {};
  currentPage = 1;

  document.getElementById("sort-select").value = "";
  document.getElementById("min-price").value = "";
  document.getElementById("max-price").value = "";

  const ratingChecked = document.querySelector('input[name="rating"]:checked');
  if (ratingChecked) ratingChecked.checked = false;

  const catChecked = document.querySelector('input[name="category"]:checked');
  if (catChecked) catChecked.checked = false;

  loadProducts();
};
