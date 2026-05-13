let productId = null;
let currentProduct = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireVendor()) return;

  await Navbar.render();

  productId = new URLSearchParams(window.location.search).get("id");

  if (!productId) {
    window.location.href = "products.html";
    return;
  }

  // Load categories first, then product
  // so category dropdown is ready when we set its value
  await loadCategories();
  await loadProduct();
});

// ─── Load Categories ──────────────────────────────────────────
const loadCategories = async () => {
  const res = await api.get("/categories");
  if (!res?.ok) return;

  const select = document.getElementById("product-category");
  res.data.categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    select.appendChild(option);
  });
};

// ─── Load Product ─────────────────────────────────────────────
const loadProduct = async () => {
  Loader.show();

  // Get all vendor products and find this one
  const res = await api.get("/products/vendor/mine");
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load product", "error");
    return;
  }

  currentProduct = res.data.products.find((p) => p.id === parseInt(productId));

  if (!currentProduct) {
    Toast.show("Product not found", "error");
    setTimeout(() => (window.location.href = "products.html"), 1500);
    return;
  }

  // Now get full product details including images
  const fullRes = await api.get(`/products/${currentProduct.slug}`);

  if (fullRes?.ok) {
    currentProduct = { ...currentProduct, ...fullRes.data.product };
  }

  populateForm(currentProduct);
};

// ─── Populate Form With Existing Data ────────────────────────
const populateForm = (product) => {
  document.title = `Edit: ${product.name} — Vendora`;

  // Text fields
  document.getElementById("product-name").value = product.name || "";
  document.getElementById("product-description").value =
    product.description || "";
  document.getElementById("product-price").value = product.price || "";
  document.getElementById("product-discount").value =
    product.discount_price || "";
  document.getElementById("product-stock").value = product.stock || 0;

  // Category dropdown
  if (product.category_id) {
    document.getElementById("product-category").value = product.category_id;
  }

  // Published toggle — set the hidden input
  document.getElementById("product-publish").value = product.is_published
    ? "true"
    : "false";

  // Try to set Alpine toggle visually
  const toggleEl = document.getElementById("publish-toggle");
  if (toggleEl) {
    // Wait for Alpine to initialize
    setTimeout(() => {
      const alpineEl = toggleEl.querySelector("[x-data]");
      if (alpineEl && alpineEl._x_dataStack) {
        alpineEl._x_dataStack[0].on = product.is_published;
      }
    }, 300);
  }

  // Load existing images
  renderExistingImages(product.images || []);
};

// ─── Render Existing Images ───────────────────────────────────
const renderExistingImages = (images) => {
  const container = document.getElementById("current-images");

  if (!images || images.length === 0) {
    container.innerHTML = `
      <p class="text-sm text-gray-400 mb-3">
        No images yet — add one below
      </p>
    `;
    return;
  }

  container.innerHTML = images
    .map(
      (img) => `
    <div class="relative group">
      <img src="${img.url}" alt="Product image"
           class="w-20 h-20 object-cover rounded-lg border-2
                  ${img.is_primary ? "border-indigo-500" : "border-gray-200"}"/>
      ${
        img.is_primary
          ? `
        <span class="absolute -top-1 -right-1 bg-indigo-600
                     text-white text-xs px-1.5 py-0.5 rounded-full">
          Main
        </span>
      `
          : `
        <button onclick="setPrimary(${img.id})"
                class="absolute -top-1 -right-1 bg-white border
                       border-gray-300 text-xs px-1.5 py-0.5
                       rounded-full hover:bg-indigo-50
                       opacity-0 group-hover:opacity-100
                       transition whitespace-nowrap">
          Set main
        </button>
      `
      }
      <button onclick="deleteImage(${img.id})"
              class="absolute -bottom-1 -right-1 bg-red-500
                     text-white w-5 h-5 rounded-full text-xs
                     flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition">
        ×
      </button>
    </div>
  `,
    )
    .join("");
};

// ─── Load Images (refresh) ────────────────────────────────────
const loadImages = async () => {
  const res = await api.get(`/products/${currentProduct.slug}`);
  if (!res?.ok) return;

  renderExistingImages(res.data.product.images || []);
};

// ─── Upload New Image File ────────────────────────────────────
const uploadNewImage = async () => {
  const fileInput = document.getElementById("new-image-file");
  const file = fileInput.files[0];

  if (!file) {
    Toast.show("Please select an image file", "warning");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    Toast.show("Image must be less than 5MB", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("is_primary", "false");

  const token = localStorage.getItem("vendora_token");

  Toast.show("Uploading...", "info");

  const response = await fetch(
    `${CONFIG.API_BASE_URL}/products/${productId}/images/upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );

  const data = await response.json();

  if (response.ok) {
    Toast.show("Image uploaded! ✅", "success");
    fileInput.value = "";
    await loadImages();
  } else {
    Toast.show(data.message || "Upload failed", "error");
  }
};

// ─── Add Image by URL ─────────────────────────────────────────
const addImageByUrl = async () => {
  const url = document.getElementById("new-image-url").value.trim();

  if (!url) {
    Toast.show("Please enter an image URL", "warning");
    return;
  }

  const res = await api.post(`/products/${productId}/images`, {
    image_url: url,
    is_primary: false,
  });

  if (res?.ok) {
    Toast.show("Image added!", "success");
    document.getElementById("new-image-url").value = "";
    await loadImages();
  } else {
    Toast.show("Failed to add image", "error");
  }
};

// ─── Set Primary Image ────────────────────────────────────────
const setPrimary = async (imageId) => {
  const res = await api.put(`/products/${productId}/images/${imageId}/primary`);
  if (res?.ok) {
    Toast.show("Primary image updated ✅", "success");
    await loadImages();
  } else {
    Toast.show("Failed to update", "error");
  }
};

// ─── Delete Image ─────────────────────────────────────────────
const deleteImage = (imageId) => {
  Modal.confirm("Delete this image?", async () => {
    const res = await api.delete(`/products/${productId}/images/${imageId}`);
    if (res?.ok) {
      Toast.show("Image deleted", "success");
      await loadImages();
    } else {
      Toast.show("Failed to delete image", "error");
    }
  });
};

// ─── Submit Form ──────────────────────────────────────────────
document
  .getElementById("product-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("product-name").value.trim();
    const description = document
      .getElementById("product-description")
      .value.trim();
    const category_id = document.getElementById("product-category").value;
    const price = document.getElementById("product-price").value;
    const discount = document.getElementById("product-discount").value;
    const stock = document.getElementById("product-stock").value;

    if (!name) {
      Toast.show("Product name is required", "warning");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Toast.show("Please enter a valid price", "warning");
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.textContent = "Saving...";
    btn.disabled = true;

    const res = await api.put(`/products/${productId}`, {
      name,
      description: description || undefined,
      category_id: category_id || undefined,
      price: parseFloat(price),
      discount_price: discount ? parseFloat(discount) : undefined,
      stock: parseInt(stock),
    });

    if (res?.ok) {
      Toast.show("Product updated successfully! ✅", "success");
      setTimeout(() => {
        window.location.href = "products.html";
      }, 1000);
    } else {
      Toast.show(res?.data?.message || "Failed to update product", "error");
      btn.textContent = "Save Changes";
      btn.disabled = false;
    }
  });
