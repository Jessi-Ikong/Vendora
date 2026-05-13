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

// ─── Preview File Upload ──────────────────────────────────────
const previewSelectedImage = (input) => {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    Toast.show("Image must be less than 5MB", "warning");
    input.value = "";
    return;
  }

  // Clear URL input since file takes priority
  document.getElementById("image-url").value = "";
  document.getElementById("url-preview").classList.add("hidden");

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("preview-img").src = e.target.result;
    document.getElementById("preview-filename").textContent = file.name;
    document.getElementById("upload-placeholder").classList.add("hidden");
    document.getElementById("upload-preview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
};

// ─── Preview URL Image ────────────────────────────────────────
const previewUrlImage = () => {
  const url = document.getElementById("image-url").value.trim();
  if (!url) {
    Toast.show("Please enter an image URL", "warning");
    return;
  }

  // Clear file input since URL takes priority
  document.getElementById("image-file").value = "";
  document.getElementById("upload-placeholder").classList.remove("hidden");
  document.getElementById("upload-preview").classList.add("hidden");

  const img = document.getElementById("url-preview-img");
  const preview = document.getElementById("url-preview");

  img.src = url;
  img.onerror = () => {
    Toast.show("Invalid image URL", "error");
    preview.classList.add("hidden");
  };
  img.onload = () => {
    preview.classList.remove("hidden");
  };
};

// ─── Upload Image File to Cloudinary ─────────────────────────
const uploadProductImage = async (productId) => {
  const fileInput = document.getElementById("image-file");
  const file = fileInput.files[0];

  if (!file) return null;

  const formData = new FormData();
  formData.append("image", file);
  formData.append("is_primary", "true");

  const token = localStorage.getItem("vendora_token");
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/products/${productId}/images/upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Upload failed");
  return data.image_url;
};

// ─── Add Image by URL ─────────────────────────────────────────
const addImageByUrl = async (productId) => {
  const url = document.getElementById("image-url").value.trim();
  if (!url) return null;

  const res = await api.post(`/products/${productId}/images`, {
    image_url: url,
    is_primary: true,
  });

  if (!res?.ok) throw new Error("Failed to save image URL");
  return url;
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
    const publish = document.getElementById("product-publish").value === "true";
    const fileInput = document.getElementById("image-file");
    const urlInput = document.getElementById("image-url").value.trim();

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
      Toast.show("Please enter stock quantity", "warning");
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.textContent = "Saving...";
    btn.disabled = true;

    try {
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

      // 2. Handle image — file upload takes priority over URL
      if (fileInput.files[0]) {
        btn.textContent = "Uploading image...";
        try {
          await uploadProductImage(product.id);
        } catch (err) {
          Toast.show(
            "Product saved but image upload failed. Add it later.",
            "warning",
          );
        }
      } else if (urlInput) {
        btn.textContent = "Saving image...";
        try {
          await addImageByUrl(product.id);
        } catch (err) {
          Toast.show(
            "Product saved but image URL failed. Add it later.",
            "warning",
          );
        }
      }

      // 3. Publish if toggled
      if (publish) {
        await api.put(`/products/${product.id}/publish`);
      }

      Toast.show("Product created successfully! 🎉", "success");
      setTimeout(() => {
        window.location.href = "products.html";
      }, 1000);
    } catch (err) {
      Toast.show("Something went wrong", "error");
      btn.textContent = "Save Product";
      btn.disabled = false;
    }
  });
