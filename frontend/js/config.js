const isLocalhost =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

const CONFIG = {
  API_BASE_URL: isLocalhost
    ? "http://127.0.0.1:3000/api"
    : "https://vendora-3-gn0c.onrender.com/api",
  PAYSTACK_PUBLIC_KEY: "your_paystack_public_key",
};
