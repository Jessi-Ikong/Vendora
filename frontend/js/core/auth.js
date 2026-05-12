const Auth = {
  // Save token and user after login
  login(token, user) {
    localStorage.setItem("vendora_token", token);
    localStorage.setItem("vendora_user", JSON.stringify(user));
  },

  // Clear everything on logout
  logout() {
    localStorage.removeItem("vendora_token");
    localStorage.removeItem("vendora_user");

    // Work out correct path depth
    const path = window.location.pathname;
    const depth = path.split("/").filter(Boolean).length;

    if (depth >= 2) {
      // Inside a subfolder like /vendor/ or /admin/ or /buyer/
      window.location.href = "../login.html";
    } else {
      // At root level
      window.location.href = "login.html";
    }
  },

  // Get current user
  getUser() {
    const user = localStorage.getItem("vendora_user");
    return user ? JSON.parse(user) : null;
  },

  // Get token
  getToken() {
    return localStorage.getItem("vendora_token");
  },

  // Check if logged in
  isLoggedIn() {
    return !!localStorage.getItem("vendora_token");
  },

  // Role checks
  isAdmin() {
    return this.getUser()?.role === "admin";
  },
  isVendor() {
    return this.getUser()?.role === "vendor";
  },
  isBuyer() {
    return this.getUser()?.role === "buyer";
  },

  // Update stored user data
  updateUser(user) {
    localStorage.setItem("vendora_user", JSON.stringify(user));
  },
};
