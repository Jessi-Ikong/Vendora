const Router = {
  // Redirect to login if not authenticated
  requireAuth() {
    if (!Auth.isLoggedIn()) {
      window.location.href = "/login.html";
      return false;
    }
    return true;
  },

  // Redirect if not a vendor
  requireVendor() {
    if (!this.requireAuth()) return false;
    if (!Auth.isVendor()) {
      Toast.show("Access denied. Vendor account required.", "error");
      window.location.href = "/index.html";
      return false;
    }
    return true;
  },

  // Redirect if not admin
  requireAdmin() {
    if (!this.requireAuth()) return false;
    if (!Auth.isAdmin()) {
      Toast.show("Access denied. Admin account required.", "error");
      window.location.href = "/index.html";
      return false;
    }
    return true;
  },

  // Redirect logged in users away from auth pages
  redirectIfLoggedIn() {
    if (Auth.isLoggedIn()) {
      const user = Auth.getUser();
      if (user.role === "admin") window.location.href = "/admin/dashboard.html";
      else if (user.role === "vendor")
        window.location.href = "/vendor/dashboard.html";
      else window.location.href = "/buyer/dashboard.html";
    }
  },

  // Get URL query parameter
  getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },
};
