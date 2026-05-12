const Toast = {
  show(message, type = "success", duration = 3000) {
    // Remove existing toast
    const existing = document.getElementById("vendora-toast");
    if (existing) existing.remove();

    // Color based on type
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      warning: "bg-yellow-500",
      info: "bg-blue-500",
    };

    // Icons based on type
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    // Create toast element
    const toast = document.createElement("div");
    toast.id = "vendora-toast";
    toast.className = `
      fixed top-4 right-4 z-50 flex items-center gap-3
      ${colors[type]} text-white px-5 py-3 rounded-lg shadow-lg
      transform translate-x-full transition-transform duration-300
    `;

    toast.innerHTML = `
      <span class="font-bold text-lg">${icons[type]}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Slide in
    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 10);

    // Slide out and remove
    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
};
