// Auto-detect whether we're on desktop or mobile
const isLocalhost =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

const CONFIG = {
  API_BASE_URL: isLocalhost
    ? "http://127.0.0.1:3000/api" // desktop
    : "http://192.168.43.65:3000/api", // phone (your IP)
  PAYSTACK_PUBLIC_KEY: "your_paystack_public_key",
};
