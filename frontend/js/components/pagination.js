const Pagination = {
  render(pagination, containerId, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container || !pagination) return;

    const { currentPage, totalPages, hasNext, hasPrev } = pagination;

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    // Build page numbers
    let pages = "";
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages += `
          <button onclick="(${onPageChange})(${i})"
                  class="px-3 py-1 rounded-lg text-sm
                         ${
                           i === currentPage
                             ? "bg-indigo-600 text-white"
                             : "bg-white text-gray-700 hover:bg-indigo-50 border"
                         }
                         transition">
            ${i}
          </button>
        `;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages += `<span class="px-2 text-gray-400">...</span>`;
      }
    }

    container.innerHTML = `
      <div class="flex items-center justify-center gap-2 mt-8">
        <button onclick="(${onPageChange})(${currentPage - 1})"
                ${!hasPrev ? "disabled" : ""}
                class="px-3 py-1 rounded-lg border text-sm
                       ${
                         !hasPrev
                           ? "opacity-50 cursor-not-allowed"
                           : "hover:bg-indigo-50"
                       } transition">
          ← Prev
        </button>
        ${pages}
        <button onclick="(${onPageChange})(${currentPage + 1})"
                ${!hasNext ? "disabled" : ""}
                class="px-3 py-1 rounded-lg border text-sm
                       ${
                         !hasNext
                           ? "opacity-50 cursor-not-allowed"
                           : "hover:bg-indigo-50"
                       } transition">
          Next →
        </button>
      </div>
    `;
  },
};
