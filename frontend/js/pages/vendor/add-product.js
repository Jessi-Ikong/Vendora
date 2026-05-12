document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireVendor()) return;

  await Navbar.render();
  await loadCategories();
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

// ─── Preview Image ────────────────────────────────────────────
const previewImage = () => {
  const url = document.getElementById("image-url").value.trim();
  const preview = document.getElementById("image-preview");
  const img = document.getElementById("preview-img");

  if (!url) {
    Toast.show("Please enter an image URL", "warning");
    return;
  }

  img.src = url;
  img.onerror = () => {
    Toast.show("Invalid image URL", "error");
    preview.classList.add("hidden");
  };
  img.onload = () => {
    preview.classList.remove("hidden");
  };
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
    const imageUrl = document.getElementById("image-url").value.trim();
    const publish = document.getElementById("product-publish").value === "true";

    // Validate
    if (!name) {
      Toast.show("Product name is required", "warning");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Toast.show("Please enter a valid price", "warning");
      return;
    }
    if (!stock || parseInt(stock) < 0) {
      Toast.show("Please enter a valid stock quantity", "warning");
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.textContent = "Saving...";
    btn.disabled = true;

    // 1. Create product
    const res = await api.post("/products", {
      name,
      description: description || undefined,
      category_id: category_id || undefined,
      price: parseFloat(price),
      discount_price: discount ? parseFloat(discount) : undefined,
      stock: parseInt(stock),
    });

    if (!res?.ok) {
      Toast.show(res?.data?.message || "Failed to create product", "error");
      btn.textContent = "Save Product";
      btn.disabled = false;
      return;
    }

    const product = res.data.product;

    // 2. Add image if provided
    if (imageUrl) {
      await api.post(`/products/${product.id}/images`, {
        image_url: imageUrl,
        is_primary: true,
      });
    }

    // 3. Publish if toggled
    if (publish) {
      await api.put(`/products/${product.id}/publish`);
    }

    Toast.show("Product created successfully! 🎉", "success");
    setTimeout(() => {
      window.location.href = "products.html";
    }, 1000);
  });
