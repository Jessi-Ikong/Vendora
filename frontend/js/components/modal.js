const Modal = {
  // Show confirmation modal
  confirm(message, onConfirm, onCancel) {
    const existing = document.getElementById("vendora-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "vendora-modal";
    modal.className = `
      fixed inset-0 z-50 flex items-center justify-center
      bg-black bg-opacity-50 px-4
    `;

    modal.innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Confirm Action
        </h3>
        <p class="text-gray-600 mb-6">${message}</p>
        <div class="flex gap-3 justify-end">
          <button id="modal-cancel"
                  class="px-4 py-2 rounded-lg border border-gray-300
                         text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button id="modal-confirm"
                  class="px-4 py-2 rounded-lg bg-red-600 text-white
                         hover:bg-red-700 transition">
            Confirm
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("modal-confirm").onclick = () => {
      modal.remove();
      if (onConfirm) onConfirm();
    };

    document.getElementById("modal-cancel").onclick = () => {
      modal.remove();
      if (onCancel) onCancel();
    };
  },
};
