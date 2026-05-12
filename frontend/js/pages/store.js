let vendorId = null;
let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  await Navbar.render();

  const slug = new URLSearchParams(window.location.search).get("slug");

  if (!slug) {
    window.location.href = "index.html";
    return;
  }

  await loadStore(slug);
});

// ─── Load Store ───────────────────────────────────────────────
const loadStore = async (slug) => {
  Loader.show();
  const res = await api.get(`/vendors/${slug}`);
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Store not found", "error");
    setTimeout(() => (window.location.href = "index.html"), 1500);
    return;
  }

  const vendor = res.data.vendor;
  vendorId = vendor.id;

  document.title = `${vendor.store_name} — Vendora`;

  // Banner
  if (vendor.banner) {
    const bannerImg = document.getElementById("banner-img");
    bannerImg.src = vendor.banner;
    bannerImg.classList.remove("hidden");
  }

  // Logo
  const logoEl = document.getElementById("store-logo");
  if (vendor.logo) {
    logoEl.innerHTML = `
      <img src="${vendor.logo}" alt="${vendor.store_name}"
           class="w-full h-full object-cover rounded-xl"/>
    `;
  } else {
    logoEl.textContent = vendor.store_name.charAt(0).toUpperCase();
  }

  // Info
  document.getElementById("store-name").textContent = vendor.store_name;
  document.getElementById("store-description").textContent =
    vendor.description || "Welcome to our store";

  // Load products
  await loadStoreProducts(vendor.id);

  // Search on Enter
  document.getElementById("store-search").addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchStore();
  });
};

// ─── Load Store Products ──────────────────────────────────────
const loadStoreProducts = async (vId) => {
  const res = await api.get(`/products?vendorId=${vId}&limit=20`);

  if (!res?.ok) return;

  allProducts = res.data.products;

  document.getElementById("store-products").textContent =
    res.data.pagination.total;

  renderProducts(allProducts);
};

// ─── Render Products ──────────────────────────────────────────
const renderProducts = (products) => {
  const emptyState = document.getElementById("empty-state");

  if (products.length === 0) {
    document.getElementById("products-grid").innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  ProductCard.renderAll(products, "products-grid");
};

// ─── Search Store ─────────────────────────────────────────────
const searchStore = () => {
  const query = document
    .getElementById("store-search")
    .value.toLowerCase()
    .trim();

  if (!query) {
    renderProducts(allProducts);
    return;
  }

  const filtered = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      (p.description || "").toLowerCase().includes(query),
  );

  renderProducts(filtered);
};
