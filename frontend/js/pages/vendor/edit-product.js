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

  await Promise.all([loadProduct(), loadCategories()]);
});

// ─── Load Product ─────────────────────────────────────────────
const loadProduct = async () => {
  Loader.show();
  const res = await api.get(`/products/vendor/mine`);
  Loader.hide();

  if (!res?.ok) return;

  currentProduct = res.data.products.find((p) => p.id === parseInt(productId));

  if (!currentProduct) {
    Toast.show("Product not found", "error");
    setTimeout(() => (window.location.href = "products.html"), 1500);
    return;
  }

  populateForm(currentProduct);
};

// ─── Populate Form ────────────────────────────────────────────
const populateForm = (product) => {
  document.title = `Edit: ${product.name} — Vendora`;

  document.getElementById("product-name").value = product.name || "";
  document.getElementById("product-description").value =
    product.description || "";
  document.getElementById("product-price").value = product.price || "";
  document.getElementById("product-discount").value =
    product.discount_price || "";
  document.getElementById("product-stock").value = product.stock || 0;

  // Set category
  if (product.category_id) {
    setTimeout(() => {
      const select = document.getElementById("product-category");
      select.value = product.category_id;
    }, 500);
  }

  // Set publish toggle using Alpine
  if (product.is_published) {
    const toggle =
      document.querySelector("#publish-toggle [x-data]") ||
      document.getElementById("publish-toggle");
    if (toggle?.__x) {
      toggle.__x.$data.on = product.is_published;
    }
    document.getElementById("product-publish").value = product.is_published
      ? "true"
      : "false";
  }

  // Load images
  loadImages();
};

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

// ─── Load Images ──────────────────────────────────────────────
const loadImages = async () => {
  const res = await api.get(`/products/${currentProduct.slug}`);
  if (!res?.ok) return;

  const images = res.data.product.images || [];
  const container = document.getElementById("current-images");

  if (images.length === 0) {
    container.innerHTML = `
      <p class="text-sm text-gray-400">No images yet</p>
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
                     text-white text-xs px-1 rounded">
          Main
        </span>
      `
          : `
        <button onclick="setPrimary(${img.id})"
                class="absolute -top-1 -right-1 bg-white border
                       border-gray-200 text-xs px-1 rounded
                       hover:bg-indigo-50 opacity-0
                       group-hover:opacity-100 transition">
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

// ─── Add Image ────────────────────────────────────────────────
const addImage = async () => {
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
    Toast.show("Primary image updated", "success");
    await loadImages();
  }
};

// ─── Delete Image ─────────────────────────────────────────────
const deleteImage = (imageId) => {
  Modal.confirm("Delete this image?", async () => {
    const res = await api.delete(`/products/${productId}/images/${imageId}`);
    if (res?.ok) {
      Toast.show("Image deleted", "success");
      await loadImages();
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
      Toast.show("Product updated successfully!", "success");
      setTimeout(() => {
        window.location.href = "products.html";
      }, 1000);
    } else {
      Toast.show(res?.data?.message || "Failed to update product", "error");
      btn.textContent = "Save Changes";
      btn.disabled = false;
    }
  });
