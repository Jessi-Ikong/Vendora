let allOrders = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAuth()) return;

  await Navbar.render();
  await loadOrders();
});

// ─── Load Orders ──────────────────────────────────────────────
const loadOrders = async () => {
  Loader.show();
  const res = await api.get("/orders");
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Failed to load orders", "error");
    return;
  }

  allOrders = res.data.orders;
  renderOrders(allOrders);
};

// ─── Render Orders ────────────────────────────────────────────
const renderOrders = (orders) => {
  const list = document.getElementById("orders-list");
  const emptyState = document.getElementById("empty-state");

  if (orders.length === 0) {
    list.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  list.innerHTML = orders
    .map(
      (order) => `
    <div class="bg-white rounded-xl shadow-sm border
                border-gray-100 p-6 hover:shadow-md transition">

      <!-- Order Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <div>
            <p class="font-bold text-gray-900">Order #${order.id}</p>
            <p class="text-xs text-gray-400 font-mono">${order.paystack_ref || "-"}</p>
            <p class="text-sm text-gray-400">
              ${Utils.formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-xs font-medium
                       ${Utils.statusColor(order.status)}">
            ${order.status}
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-medium
                       ${Utils.statusColor(order.payment_status)}">
            ${order.payment_status}
          </span>
        </div>
      </div>

      <!-- Order Info -->
      <div class="flex items-center justify-between
                  border-t border-gray-50 pt-4">
        <div class="flex items-center gap-6 text-sm text-gray-500">
          <span>📦 ${order.item_count} item${order.item_count != 1 ? "s" : ""}</span>
          <span class="font-bold text-gray-900 text-base">
            ${Utils.formatPrice(order.total_amount)}
          </span>
        </div>

        <div class="flex items-center gap-3">
          ${
            order.status === "pending"
              ? `
            <button onclick="cancelOrder(${order.id})"
                    class="text-red-500 text-sm hover:underline">
              Cancel
            </button>
          `
              : ""
          }
          ${
            order.status === "delivered" && order.payment_status === "paid"
              ? `
            <button onclick="openReviewModal(${order.id})"
                    class="bg-green-600 text-white px-4 py-2
                           rounded-lg text-sm hover:bg-green-700
                           transition">
              ⭐ Review Order
            </button>
          `
              : ""
          }
          <a href="order.html?id=${order.id}"
             class="bg-indigo-600 text-white px-4 py-2
                    rounded-lg text-sm hover:bg-indigo-700
                    transition">
            View Details →
          </a>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
};

// ─── Filter Orders ────────────────────────────────────────────
const filterOrders = (status) => {
  currentFilter = status;

  // Update tab styles
  document.querySelectorAll("[id^='tab-']").forEach((tab) => {
    tab.className = `px-4 py-2 rounded-lg text-sm font-medium
                     whitespace-nowrap transition
                     bg-white text-gray-600 border border-gray-200
                     hover:border-indigo-300`;
  });

  document.getElementById(`tab-${status}`).className =
    `px-4 py-2 rounded-lg text-sm font-medium
     whitespace-nowrap transition bg-indigo-600 text-white`;

  // Filter
  const filtered =
    status === "all" ? allOrders : allOrders.filter((o) => o.status === status);

  renderOrders(filtered);
};

// ─── Cancel Order ─────────────────────────────────────────────
const cancelOrder = (orderId) => {
  Modal.confirm("Are you sure you want to cancel this order?", async () => {
    const res = await api.put(`/orders/${orderId}/cancel`);
    if (res?.ok) {
      Toast.show("Order cancelled successfully", "success");
      await loadOrders();
    } else {
      Toast.show(res?.data?.message || "Failed to cancel order", "error");
    }
  });
};

// ─── Open Review Modal ─────────────────────────────────────────
const openReviewModal = (orderId) => {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  // Get modal or create it
  let modal = document.getElementById("review-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "review-modal";
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-xl max-w-md w-full mx-4 p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Rate & Review Order</h2>
          <p class="text-sm text-gray-500 mb-6">Order #${orderId}</p>

          <!-- Rating Stars -->
          <div class="mb-6">
            <p class="text-sm font-medium text-gray-700 mb-3">Rating</p>
            <div class="flex gap-2" id="rating-stars">
              ${[1, 2, 3, 4, 5]
                .map(
                  (star) => `
                <button onclick="setRating(${star})"
                        class="text-3xl transition hover:scale-110"
                        data-rating="${star}">
                  ⭐
                </button>
              `,
                )
                .join("")}
            </div>
            <input type="hidden" id="selected-rating" value="0">
          </div>

          <!-- Comment -->
          <div class="mb-6">
            <label class="text-sm font-medium text-gray-700 mb-2 block">
              Your Review (optional)
            </label>
            <textarea id="review-comment"
                      placeholder="Share your experience..."
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg
                             text-sm focus:outline-none focus:ring-2
                             focus:ring-indigo-500"
                      rows="4"></textarea>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button onclick="closeReviewModal()"
                    class="flex-1 px-4 py-2 border border-gray-300
                           rounded-lg text-gray-700 font-medium
                           hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onclick="submitReview(${orderId})"
                    class="flex-1 px-4 py-2 bg-indigo-600 text-white
                           rounded-lg font-medium hover:bg-indigo-700
                           transition">
              Submit Review
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Reset form
  document.getElementById("selected-rating").value = "0";
  document.getElementById("review-comment").value = "";
  resetRatingStars();

  // Show modal
  modal.style.display = "flex";
};

// ─── Set Rating ───────────────────────────────────────────────
const setRating = (rating) => {
  document.getElementById("selected-rating").value = rating;

  // Update star styles
  const stars = document.querySelectorAll("[data-rating]");
  stars.forEach((star) => {
    const starRating = parseInt(star.dataset.rating);
    if (starRating <= rating) {
      star.classList.add("scale-110");
      star.textContent = "⭐";
    } else {
      star.classList.remove("scale-110");
      star.textContent = "☆";
    }
  });
};

// ─── Reset Rating Stars ───────────────────────────────────────
const resetRatingStars = () => {
  document.querySelectorAll("[data-rating]").forEach((star) => {
    star.classList.remove("scale-110");
    star.textContent = "☆";
  });
};

// ─── Close Review Modal ────────────────────────────────────────
const closeReviewModal = () => {
  const modal = document.getElementById("review-modal");
  if (modal) modal.style.display = "none";
};

// ─── Get existing reviews for products ────────────────────────
const getExistingReviews = async (productIds) => {
  const reviews = {};
  const currentUser = Auth.getUser();

  for (const productId of productIds) {
    const res = await api.get(`/reviews/product/${productId}`);
    if (res?.ok) {
      const reviewsList = res.data.reviews || [];
      const userReview = reviewsList.find((r) => r.user_id === currentUser?.id);
      if (userReview) {
        reviews[productId] = userReview;
      }
    }
  }
  return reviews;
};

// ─── Submit Review ────────────────────────────────────────────
const submitReview = async (orderId) => {
  const rating = parseInt(document.getElementById("selected-rating").value);
  const comment = document.getElementById("review-comment").value.trim();

  if (rating === 0) {
    Toast.show("Please select a rating", "error");
    return;
  }

  // Get products from this order
  const res = await api.get(`/orders/${orderId}`);
  if (!res?.ok) {
    Toast.show("Failed to load order details", "error");
    return;
  }

  const order = res.data.order;
  const items = res.data.order.items || res.data.items || [];
  const productIds = items.map((item) => item.product_id);

  // Check for existing reviews
  const existingReviews = await getExistingReviews(productIds);

  // Submit or update reviews for all products in the order
  let successCount = 0;
  for (const item of items) {
    const existingReview = existingReviews[item.product_id];

    let reviewRes;
    if (existingReview) {
      // Update existing review
      reviewRes = await api.put(`/reviews/${existingReview.id}`, {
        rating,
        comment: comment ? `${comment}` : "",
      });
    } else {
      // Create new review
      reviewRes = await api.post(`/reviews/product/${item.product_id}`, {
        rating,
        comment: comment ? `${comment}` : "",
      });
    }

    if (reviewRes?.ok) {
      successCount++;
    }
  }

  if (successCount > 0) {
    Toast.show(
      `Review submitted for ${successCount} product${successCount > 1 ? "s" : ""}!`,
      "success",
    );
    closeReviewModal();
    await loadOrders();
  } else {
    Toast.show("Failed to submit review", "error");
  }
};
