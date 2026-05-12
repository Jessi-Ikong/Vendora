const Utils = {
  // Format price to Nigerian Naira
  formatPrice(amount) {
    return `₦${parseFloat(amount).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  },

  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Format date with time
  formatDateTime(dateString) {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Truncate long text
  truncate(text, length = 100) {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  },

  // Generate star rating HTML
  stars(rating) {
    const full = Math.floor(rating);
    const empty = 5 - full;
    return "★".repeat(full) + "☆".repeat(empty);
  },

  // Get order status badge color
  statusColor(status) {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      paid: "bg-green-100 text-green-800",
      unpaid: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  },

  // Debounce — limits how often a function runs
  // Used for search input to avoid hitting API on every keystroke
  debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  },

  // Scroll to top of page
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },
};
