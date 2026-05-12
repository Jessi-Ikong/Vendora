const request = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("vendora_token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);

    // Read body ONCE
    const data = await response.json();

    // If token expired or invalid — logout
    if (response.status === 401) {
      if (localStorage.getItem("vendora_token")) {
        Auth.logout();
      }
      return { ok: false, status: 401, data };
    }

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error("API Error:", err);
    return { ok: false, data: { message: "Network error. Please try again." } };
  }
};

// Clean API methods
const api = {
  get: (endpoint) => request(endpoint, "GET"),
  post: (endpoint, body) => request(endpoint, "POST", body),
  put: (endpoint, body) => request(endpoint, "PUT", body),
  delete: (endpoint) => request(endpoint, "DELETE"),
};
