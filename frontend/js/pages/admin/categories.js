let allCategories = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;
  await Navbar.render();
  await loadCategories();
});

const loadCategories = async () => {
  Loader.show();
  const res = await api.get("/categories");
  Loader.hide();
  if (!res?.ok) return;

  allCategories = res.data.categories;
  renderCategories(allCategories);
};

const renderCategories = (categories) => {
  const tbody = document.getElementById("categories-table");

  tbody.innerHTML = categories
    .map(
      (cat) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition">
      <td class="px-6 py-4">
        <p class="font-medium text-gray-900">${cat.name}</p>
        <p class="text-xs text-gray-400">${cat.slug}</p>
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        ${cat.parent_name || "—"}
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        ${cat.product_count}
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <button onclick="editCategory(${cat.id}, '${cat.name}', '${cat.description || ""}')"
                  class="text-indigo-600 hover:underline text-sm">
            Edit
          </button>
          <span class="text-gray-300">|</span>
          <button onclick="deleteCategory(${cat.id})"
                  class="text-red-500 hover:text-red-700 text-sm">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
};

const addCategory = async () => {
  const name = document.getElementById("cat-name").value.trim();
  const description = document.getElementById("cat-desc").value.trim();

  if (!name) {
    Toast.show("Category name is required", "warning");
    return;
  }

  const res = await api.post("/categories", {
    name,
    description: description || undefined,
  });

  if (res?.ok) {
    Toast.show("Category created!", "success");
    document.getElementById("cat-name").value = "";
    document.getElementById("cat-desc").value = "";
    await loadCategories();
  } else {
    Toast.show(res?.data?.message || "Failed to create", "error");
  }
};

const editCategory = async (id, currentName, currentDesc) => {
  const name = prompt("Category name:", currentName);
  if (!name) return;

  const res = await api.put(`/categories/${id}`, { name });
  if (res?.ok) {
    Toast.show("Category updated!", "success");
    await loadCategories();
  } else {
    Toast.show("Failed to update", "error");
  }
};

const deleteCategory = (id) => {
  Modal.confirm("Delete this category?", async () => {
    const res = await api.delete(`/categories/${id}`);
    if (res?.ok) {
      Toast.show("Category deleted", "success");
      await loadCategories();
    } else {
      Toast.show("Failed to delete", "error");
    }
  });
};
