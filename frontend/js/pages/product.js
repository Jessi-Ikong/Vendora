let currentProduct = null;
let selectedRating = 0;
let maxStock = 0;

document.addEventListener("DOMContentLoaded", async () => {
  await Navbar.render();

  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) {
    window.location.href = "products.html";
    return;
  }

  await Promise.all([loadProduct(slug)]);
});

// ─── Load Product ─────────────────────────────────────────────
const loadProduct = async (slug) => {
  const res = await api.get(`/products/${slug}`);

  // Hide skeleton
  document.getElementById("product-skeleton").classList.add("hidden");

  if (!res?.ok) {
    Toast.show("Product not found", "error");
    setTimeout(() => (window.location.href = "products.html"), 1500);
    return;
  }

  currentProduct = res.data.product;
  maxStock = currentProduct.stock;

  renderProduct(currentProduct);
  await loadReviews(currentProduct.id);

  // Show write review button if logged in buyer
  if (Auth.isLoggedIn() && Auth.isBuyer()) {
    document.getElementById("write-review-btn").classList.remove("hidden");
  }

  document.getElementById("product-content").classList.remove("hidden");
};

// ─── Render Product ───────────────────────────────────────────
const renderProduct = (product) => {
  document.title = `${product.name} — Vendora`;

  // Breadcrumb
  document.getElementById("breadcrumb-name").textContent = product.name;

  // Store link
  const storeLink = document.getElementById("store-link");
  storeLink.textContent = `🏪 ${product.store_name}`;
  storeLink.href = `store.html?slug=${product.store_slug}`;

  // Name
  document.getElementById("product-name").textContent = product.name;

  // Rating
  document.getElementById("product-stars").textContent = Utils.stars(
    product.average_rating,
  );
  document.getElementById("product-rating").textContent =
    `(${parseFloat(product.average_rating).toFixed(1)})`;
  document.getElementById("product-sold").textContent =
    `${product.total_sold} sold`;

  // Price
  document.getElementById("product-price").textContent = Utils.formatPrice(
    product.discount_price || product.price,
  );

  if (product.discount_price) {
    document.getElementById("product-original-price").textContent =
      Utils.formatPrice(product.price);

    const discount = Math.round(
      (1 - product.discount_price / product.price) * 100,
    );
    document.getElementById("product-discount").textContent =
      `${discount}% OFF`;
  }

  // Stock badge
  const stockBadge = document.getElementById("stock-badge");
  if (product.stock === 0) {
    stockBadge.textContent = "❌ Out of Stock";
    stockBadge.className = "text-red-600 text-sm font-medium";
    document.getElementById("add-to-cart-btn").disabled = true;
  } else if (product.stock <= 5) {
    stockBadge.textContent = `⚠️ Only ${product.stock} left!`;
    stockBadge.className = "text-orange-600 text-sm font-medium";
  } else {
    stockBadge.textContent = `✅ In Stock (${product.stock} available)`;
    stockBadge.className = "text-green-600 text-sm font-medium";
  }

  // Description
  document.getElementById("product-description").textContent =
    product.description || "No description available.";

  // Images
  const images = product.images || [];
  const mainImg = document.getElementById("main-image");

  if (images.length > 0) {
    const primary = images.find((i) => i.is_primary) || images[0];
    mainImg.src = primary.url;
    mainImg.alt = product.name;

    // Thumbnails
    const thumbs = document.getElementById("thumbnails");
    thumbs.innerHTML = images
      .map(
        (img, i) => `
      <img src="${img.url}" alt="${product.name}"
           onclick="document.getElementById('main-image').src='${img.url}'"
           class="w-16 h-16 object-cover rounded-lg border-2
                  border-transparent hover:border-indigo-500
                  cursor-pointer transition flex-shrink-0"/>
    `,
      )
      .join("");
  } else {
    mainImg.src = "assets/images/placeholder.png";
    mainImg.alt = product.name;
    mainImg.className = "w-full h-full object-contain p-8 opacity-30";
  }
};

// ─── Load Reviews ─────────────────────────────────────────────
const loadReviews = async (productId) => {
  const res = await api.get(`/reviews/product/${productId}`);
  if (!res?.ok) return;

  const { reviews, average_rating, total, breakdown } = res.data;

  // Average rating summary
  document.getElementById("avg-rating").textContent =
    parseFloat(average_rating).toFixed(1);
  document.getElementById("avg-stars").textContent =
    Utils.stars(average_rating);
  document.getElementById("review-count").textContent =
    `${total} review${total !== 1 ? "s" : ""}`;

  // Rating breakdown bars
  const breakdownEl = document.getElementById("rating-breakdown");
  breakdownEl.innerHTML = [5, 4, 3, 2, 1]
    .map((star) => {
      const count = breakdown[star] || 0;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return `
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 w-4">${star}</span>
        <span class="text-yellow-400 text-sm">★</span>
        <div class="flex-1 bg-gray-100 rounded-full h-2">
          <div class="bg-yellow-400 h-2 rounded-full transition-all"
               style="width: ${percent}%"></div>
        </div>
        <span class="text-xs text-gray-400 w-8">${count}</span>
      </div>
    `;
    })
    .join("");

  // Reviews list
  const list = document.getElementById("reviews-list");
  if (reviews.length === 0) {
    list.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <p class="text-3xl mb-2">💬</p>
        <p>No reviews yet. Be the first to review!</p>
      </div>
    `;
    return;
  }

  list.innerHTML = reviews
    .map(
      (review) => `
    <div class="border-b border-gray-100 pb-6 last:border-0">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-indigo-100 rounded-full flex
                      items-center justify-center font-bold
                      text-indigo-600">
            ${review.buyer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p class="font-medium text-gray-900 text-sm">
              ${review.buyer_name}
            </p>
            <p class="text-xs text-gray-400">
              ${Utils.formatDate(review.created_at)}
            </p>
          </div>
        </div>
        <span class="text-yellow-400">
          ${Utils.stars(review.rating)}
        </span>
      </div>
      ${
        review.comment
          ? `
        <p class="text-gray-600 text-sm leading-relaxed ml-12">
          ${review.comment}
        </p>
      `
          : ""
      }
    </div>
  `,
    )
    .join("");
};

// ─── Add to Cart ──────────────────────────────────────────────
const addToCart = async () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const qty = parseInt(
    document.querySelector("[x-text='qty']")?.textContent || 1,
  );

  const btn = document.getElementById("add-to-cart-btn");
  btn.textContent = "Adding...";
  btn.disabled = true;

  const res = await api.post("/cart/items", {
    product_id: currentProduct.id,
    quantity: qty,
  });

  if (res?.ok) {
    Toast.show("Added to cart! 🛒", "success");
    btn.textContent = "✓ Added to Cart";
    setTimeout(() => {
      btn.textContent = "🛒 Add to Cart";
      btn.disabled = false;
    }, 2000);
  } else {
    Toast.show(res?.data?.message || "Failed to add to cart", "error");
    btn.textContent = "🛒 Add to Cart";
    btn.disabled = false;
  }
};

// ─── Wishlist ─────────────────────────────────────────────────
const toggleWishlist = async () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  const btn = document.getElementById("wishlist-btn");
  const res = await api.post(`/wishlist/${currentProduct.id}`);

  if (res?.ok) {
    btn.textContent = "❤️";
    Toast.show("Added to wishlist!", "success");
  } else {
    Toast.show(res?.data?.message || "Failed", "error");
  }
};

// ─── Review Form ──────────────────────────────────────────────
const showReviewForm = () => {
  document.getElementById("review-form").classList.remove("hidden");
  document.getElementById("write-review-btn").classList.add("hidden");
};

const hideReviewForm = () => {
  document.getElementById("review-form").classList.add("hidden");
  document.getElementById("write-review-btn").classList.remove("hidden");
  selectedRating = 0;
  updateStars(0);
  document.getElementById("review-comment").value = "";
};

const setRating = (rating) => {
  selectedRating = rating;
  document.getElementById("selected-rating").value = rating;
  updateStars(rating);
};

const updateStars = (rating) => {
  document.querySelectorAll(".star-btn").forEach((btn, i) => {
    btn.classList.toggle("text-yellow-400", i < rating);
    btn.classList.toggle("text-gray-300", i >= rating);
  });
};

const submitReview = async () => {
  if (selectedRating === 0) {
    Toast.show("Please select a rating", "warning");
    return;
  }

  const comment = document.getElementById("review-comment").value.trim();
  const currentUser = Auth.getUser();

  // Check if user already has a review for this product
  const reviewsRes = await api.get(`/reviews/product/${currentProduct.id}`);
  let existingReview = null;

  if (reviewsRes?.ok) {
    const reviewsList = reviewsRes.data.reviews || [];
    existingReview = reviewsList.find((r) => r.user_id === currentUser?.id);
  }

  let res;
  if (existingReview) {
    // Update existing review
    res = await api.put(`/reviews/${existingReview.id}`, {
      rating: selectedRating,
      comment,
    });
  } else {
    // Create new review
    res = await api.post(`/reviews/product/${currentProduct.id}`, {
      rating: selectedRating,
      comment,
    });
  }

  if (res?.ok) {
    Toast.show("Review submitted! ⭐", "success");
    hideReviewForm();
    await loadReviews(currentProduct.id);
  } else {
    Toast.show(res?.data?.message || "Failed to submit review", "error");
  }
};
