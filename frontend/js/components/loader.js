const Loader = {
  show() {
    const existing = document.getElementById("vendora-loader");
    if (existing) return;

    const loader = document.createElement("div");
    loader.id = "vendora-loader";
    loader.className = `
      fixed inset-0 z-50 flex items-center justify-center
      bg-black bg-opacity-30
    `;

    loader.innerHTML = `
      <div class="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-xl">
        <div class="w-12 h-12 border-4 border-indigo-600
                    border-t-transparent rounded-full animate-spin">
        </div>
        <p class="text-gray-600 font-medium">Loading...</p>
      </div>
    `;

    document.body.appendChild(loader);
  },

  hide() {
    const loader = document.getElementById("vendora-loader");
    if (loader) loader.remove();
  },
};
