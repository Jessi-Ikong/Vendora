let currentSlug = "";
let currentPage = 1;
let currentFilters = {};

document.addEventListener("DOMContentLoaded", async () => {
  await Navbar.render();

  currentSlug = new URLSearchParams(window.location.search).get("slug");

  if (!currentSlug) {
    window.location.href = "products.html";
    return;
  }

  await Promise.all([loadCategory(), loadProducts()]);
});

// ─── Load Category Info ───────────────────────────────────────
const loadCategory = async () => {
  const res = await api.get(`/categories/${currentSlug}`);
  if (!res?.ok) return;

  const cat = res.data.category;

  document.title = `${cat.name} — Vendora`;
  document.getElementById("breadcrumb-name").textContent = cat.name;
  document.getElementById("category-name").textContent = cat.name;
  document.getElementById("category-description").textContent =
    cat.description || `Browse all ${cat.name} products`;
};

// ─── Load Products ────────────────────────────────────────────
const loadProducts = async () => {
  Loader.show();

  const params = new URLSearchParams({
    page: currentPage,
    limit: 12,
    category: currentSlug,
    ...currentFilters,
  });

  const res = await api.get(`/products?${params}`);
  Loader.hide();

  if (!res?.ok) return;

  const { products, pagination } = res.data;

  document.getElementById("category-count").textContent =
    `${pagination.total} products found`;

  ProductCard.renderAll(products, "products-grid");

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

  currentFilters = {};
  if (sort) currentFilters.sort = sort;
  if (minPrice) currentFilters.minPrice = minPrice;
  if (maxPrice) currentFilters.maxPrice = maxPrice;

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

  loadProducts();
};
