const https = require("https");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// ─── Initialize transaction ───────────────────────────────────
const initializePayment = (email, amount, reference, callbackUrl) => {
  return new Promise((resolve, reject) => {
    const params = JSON.stringify({
      email,
      amount: amount * 100, // Paystack uses kobo — multiply by 100
      reference,
      callback_url: callbackUrl,
    });

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/transaction/initialize",
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });

    req.on("error", reject);
    req.write(params);
    req.end();
  });
};

// ─── Verify transaction ───────────────────────────────────────
const verifyPayment = (reference) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });

    req.on("error", reject);
    req.end();
  });
};

module.exports = { initializePayment, verifyPayment };
