let currentOrder = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAuth()) return;

  await Navbar.render();

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    window.location.href = "orders.html";
    return;
  }

  await loadOrder(id);
});

// ─── Load Order ───────────────────────────────────────────────
const loadOrder = async (id) => {
  Loader.show();
  const res = await api.get(`/orders/${id}`);
  Loader.hide();

  if (!res?.ok) {
    Toast.show("Order not found", "error");
    setTimeout(() => (window.location.href = "orders.html"), 1500);
    return;
  }

  currentOrder = res.data.order;
  renderOrder(currentOrder);
};

// ─── Render Order ─────────────────────────────────────────────
const renderOrder = (order) => {
  document.title = `Order #${order.id} — Vendora`;

  // Meta info
  document.getElementById("order-id").textContent = `#${order.id}`;
  document.getElementById("order-date").textContent = Utils.formatDateTime(
    order.created_at,
  );
  document.getElementById("order-total").textContent = Utils.formatPrice(
    order.total_amount,
  );

  const paymentEl = document.getElementById("order-payment");
  paymentEl.textContent = order.payment_status;
  paymentEl.className = `font-medium ${
    order.payment_status === "paid" ? "text-green-600" : "text-red-500"
  }`;

  // Timeline
  const steps = [
    { key: "pending", label: "Ordered", icon: "📋" },
    { key: "processing", label: "Processing", icon: "⚙️" },
    { key: "shipped", label: "Shipped", icon: "🚚" },
    { key: "delivered", label: "Delivered", icon: "✅" },
  ];

  const statusOrder = ["pending", "processing", "shipped", "delivered"];
  const currentIdx = statusOrder.indexOf(order.status);

  document.getElementById("timeline").innerHTML = steps
    .map(
      (step, i) => `
    <div class="flex flex-col items-center flex-1">
      <div class="relative w-full flex items-center justify-center">
        ${
          i > 0
            ? `
          <div class="absolute left-0 right-1/2 h-0.5
                      ${i <= currentIdx ? "bg-indigo-600" : "bg-gray-200"}">
          </div>
        `
            : ""
        }
        ${
          i < steps.length - 1
            ? `
          <div class="absolute left-1/2 right-0 h-0.5
                      ${i < currentIdx ? "bg-indigo-600" : "bg-gray-200"}">
          </div>
        `
            : ""
        }
        <div class="w-10 h-10 rounded-full flex items-center
                    justify-center z-10 text-xl
                    ${
                      i <= currentIdx
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }">
          ${step.icon}
        </div>
      </div>
      <p class="text-xs font-medium mt-2
                ${i <= currentIdx ? "text-indigo-600" : "text-gray-400"}">
        ${step.label}
      </p>
    </div>
  `,
    )
    .join("");

  // Order Items
  const itemsEl = document.getElementById("order-items");
  itemsEl.innerHTML = order.items
    .map(
      (item) => `
    <div class="flex gap-4 pb-4 border-b border-gray-50
                last:border-0 last:pb-0">
      <div class="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden
                  flex-shrink-0">
        ${
          item.product_image
            ? `<img src="${item.product_image}"
                  class="w-full h-full object-cover"/>`
            : `<div class="w-full h-full flex items-center
                         justify-center text-2xl">📦</div>`
        }
      </div>
      <div class="flex-1">
        <p class="font-medium text-gray-900">${item.product_name}</p>
        <p class="text-sm text-gray-400 mt-1">
          Qty: ${item.quantity} ×
          ${Utils.formatPrice(item.price)}
        </p>
        <span class="text-xs px-2 py-0.5 rounded-full mt-1 inline-block
                     ${Utils.statusColor(item.status)}">
          ${item.status}
        </span>
      </div>
      <p class="font-bold text-gray-900">
        ${Utils.formatPrice(item.subtotal)}
      </p>
    </div>
  `,
    )
    .join("");

  // Delivery Address
  const addrEl = document.getElementById("delivery-address");
  if (order.full_name) {
    addrEl.innerHTML = `
      <p class="font-medium text-gray-900">${order.full_name}</p>
      <p>${order.address_line1}
         ${order.address_line2 ? `, ${order.address_line2}` : ""}
      </p>
      <p>${order.city}, ${order.state}, ${order.country}</p>
      <p>${order.phone}</p>
    `;
  } else {
    addrEl.textContent = "No address on record";
  }

  // Actions
  actionsEl.innerHTML = `
  ${
    order.payment_status === "unpaid"
      ? `
    <button onclick="verifyPayment()"
            id="verify-btn"
            class="bg-green-600 text-white px-6 py-3 rounded-xl
                   font-medium hover:bg-green-700 transition">
      ✓ Verify Payment
    </button>
  `
      : ""
  }
  ${
    order.status === "pending"
      ? `
    <button onclick="cancelOrder()"
            class="bg-red-50 text-red-600 px-6 py-3 rounded-xl
                   font-medium hover:bg-red-100 transition">
      Cancel Order
    </button>
  `
      : ""
  }
  ${
    order.status === "delivered" && order.payment_status === "paid"
      ? `
    <button onclick="openReviewModal()"
            class="bg-green-600 text-white px-6 py-3 rounded-xl
                   font-medium hover:bg-green-700 transition">
      ⭐ Rate & Review
    </button>
  `
      : ""
  }
  <a href="../products.html"
     class="bg-indigo-600 text-white px-6 py-3 rounded-xl
            font-medium hover:bg-indigo-700 transition">
    Continue Shopping
  </a>
`;
};

// ─── Cancel Order ─────────────────────────────────────────────
const cancelOrder = () => {
  Modal.confirm("Are you sure you want to cancel this order?", async () => {
    const res = await api.put(`/orders/${currentOrder.id}/cancel`);
    if (res?.ok) {
      Toast.show("Order cancelled", "success");
      await loadOrder(currentOrder.id);
    } else {
      Toast.show(res?.data?.message || "Cannot cancel this order", "error");
    }
  });
};

// ─── Verify Payment ───────────────────────────────────────────
const verifyPayment = async () => {
  if (!currentOrder.paystack_ref) {
    Toast.show("No payment reference found", "warning");
    return;
  }

  const btn = document.getElementById("verify-btn");
  btn.textContent = "Verifying...";
  btn.disabled = true;

  const res = await api.get(`/payments/verify/${currentOrder.paystack_ref}`);

  if (res?.ok) {
    Toast.show("Payment verified! ✅", "success");
    await loadOrder(currentOrder.id);
  } else {
    Toast.show(res?.data?.message || "Payment not confirmed yet", "warning");
    btn.textContent = "✓ Verify Payment";
    btn.disabled = false;
  }
};

// ─── Open Review Modal ────────────────────────────────────────
const openReviewModal = () => {
  let modal = document.getElementById("review-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "review-modal";
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-xl max-w-md w-full mx-4 p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Rate & Review Order</h2>
          <p class="text-sm text-gray-500 mb-6">Order #${currentOrder.id}</p>

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
                  ☆
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
            <button onclick="submitReview()"
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

// ─── Close Review Modal ───────────────────────────────────────
const closeReviewModal = () => {
  const modal = document.getElementById("review-modal");
  if (modal) modal.style.display = "none";
};

// ─── Get existing reviews for products ────────────────────────
const getExistingReviewsForOrder = async (productIds) => {
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
const submitReview = async () => {
  const rating = parseInt(document.getElementById("selected-rating").value);
  const comment = document.getElementById("review-comment").value.trim();

  if (rating === 0) {
    Toast.show("Please select a rating", "error");
    return;
  }

  // Get items in this order
  const items = currentOrder.items || [];
  const productIds = items.map((item) => item.product_id);

  // Check for existing reviews
  const existingReviews = await getExistingReviewsForOrder(productIds);

  // Submit or update reviews for all products
  let successCount = 0;
  for (const item of items) {
    const existingReview = existingReviews[item.product_id];

    let reviewRes;
    if (existingReview) {
      // Update existing review
      reviewRes = await api.put(`/reviews/${existingReview.id}`, {
        rating,
        comment: comment || "",
      });
    } else {
      // Create new review
      reviewRes = await api.post(`/reviews/product/${item.product_id}`, {
        rating,
        comment: comment || "",
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
    await loadOrder(currentOrder.id);
  } else {
    Toast.show("Failed to submit review", "error");
  }
};
