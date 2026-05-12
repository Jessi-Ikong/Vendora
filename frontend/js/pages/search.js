let currentQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
  await Navbar.render();

  // Get query from URL
  const params = new URLSearchParams(window.location.search);
  currentQuery = params.get("q") || "";

  if (currentQuery) {
    document.getElementById("search-input").value = currentQuery;
    await doSearch();
  }

  // Search on Enter key
  document.getElementById("search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") doSearch();
  });
});

const doSearch = async () => {
  const query = document.getElementById("search-input").value.trim();
  if (!query) return;

  currentQuery = query;

  // Update URL without reloading
  window.history.pushState(
    {},
    "",
    `search.html?q=${encodeURIComponent(query)}`,
  );

  Loader.show();
  const res = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
  Loader.hide();

  const emptyState = document.getElementById("empty-state");
  const resultsCount = document.getElementById("results-count");

  if (!res?.ok) {
    Toast.show("Search failed", "error");
    return;
  }

  const products = res.data.products;

  if (products.length === 0) {
    document.getElementById("products-grid").innerHTML = "";
    emptyState.classList.remove("hidden");
    resultsCount.textContent = `No results for "${query}"`;
    return;
  }

  emptyState.classList.add("hidden");
  resultsCount.textContent = `${products.length} results for "${query}"`;

  ProductCard.renderAll(products, "products-grid");
};
