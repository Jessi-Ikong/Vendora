let allUsers = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!Router.requireAdmin()) return;
  await Navbar.render();
  await loadUsers();

  document
    .getElementById("search-input")
    .addEventListener("input", filterUsers);
});

const loadUsers = async () => {
  Loader.show();
  const res = await api.get("/admin/users");
  Loader.hide();

  if (!res?.ok) return;

  allUsers = res.data.users;
  document.getElementById("users-count").textContent =
    `${allUsers.length} users registered`;

  renderUsers(allUsers);
};

const renderUsers = (users) => {
  const tbody = document.getElementById("users-table");

  tbody.innerHTML = users
    .map(
      (user) => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-indigo-100 rounded-full flex
                      items-center justify-center font-bold
                      text-indigo-600 text-sm">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p class="font-medium text-gray-900">${user.name}</p>
            <p class="text-xs text-gray-400">${user.email}</p>
          </div>
        </div>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs font-medium
                     ${
                       user.role === "admin"
                         ? "bg-purple-100 text-purple-700"
                         : user.role === "vendor"
                           ? "bg-blue-100 text-blue-700"
                           : "bg-gray-100 text-gray-600"
                     }">
          ${user.role}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-full text-xs font-medium
                     ${
                       user.is_active
                         ? "bg-green-100 text-green-700"
                         : "bg-red-100 text-red-600"
                     }">
          ${user.is_active ? "Active" : "Suspended"}
        </span>
      </td>
      <td class="px-6 py-4 text-sm text-gray-500">
        ${Utils.formatDate(user.created_at)}
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <button onclick="toggleSuspend(${user.id}, ${user.is_active})"
                  class="text-sm
                         ${
                           user.is_active
                             ? "text-orange-500 hover:text-orange-700"
                             : "text-green-600 hover:text-green-800"
                         }">
            ${user.is_active ? "Suspend" : "Reactivate"}
          </button>
          <span class="text-gray-300">|</span>
          <button onclick="deleteUser(${user.id})"
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

const filterUsers = () => {
  const search = document.getElementById("search-input").value.toLowerCase();
  const role = document.getElementById("role-filter").value;

  const filtered = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search);
    const matchesRole = role === "all" || u.role === role;
    return matchesSearch && matchesRole;
  });

  renderUsers(filtered);
};

const toggleSuspend = async (userId, isActive) => {
  Modal.confirm(
    `${isActive ? "Suspend" : "Reactivate"} this user?`,
    async () => {
      const res = await api.put(`/admin/users/${userId}/suspend`);
      if (res?.ok) {
        Toast.show(`User ${isActive ? "suspended" : "reactivated"}`, "success");
        await loadUsers();
      } else {
        Toast.show("Action failed", "error");
      }
    },
  );
};

const deleteUser = (userId) => {
  Modal.confirm(
    "Permanently delete this user? This cannot be undone.",
    async () => {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res?.ok) {
        Toast.show("User deleted", "success");
        await loadUsers();
      } else {
        Toast.show("Failed to delete user", "error");
      }
    },
  );
};
