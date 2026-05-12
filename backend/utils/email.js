const nodemailer = require("nodemailer");
require("dotenv").config();

// ─── Create transporter ───────────────────────────────────────
// The transporter is the email sending engine
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Verify connection on startup ────────────────────────────
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email service failed:", err.message);
  } else {
    console.log("✅ Email service ready");
  }
});

// ─── Helper — send email ──────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Vendora" <jessiikong404@gmail.com>`,
    to,
    subject,
    html,
  });
};

// ─── Welcome Email ────────────────────────────────────────────
const sendWelcomeEmail = async (name, email) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to Vendora 🛒</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Hi ${name}!</h2>
        <p>Thank you for joining Vendora — Nigeria's premier multi-vendor marketplace.</p>
        <p>You can now:</p>
        <ul>
          <li>Browse thousands of products</li>
          <li>Shop from verified vendors</li>
          <li>Track your orders in real time</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}"
           style="display: inline-block; background: #6366f1; color: white;
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  margin-top: 20px;">
          Start Shopping
        </a>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>© 2026 Vendora. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail(email, "Welcome to Vendora! 🛒", html);
};

// ─── Password Reset Email ─────────────────────────────────────
const sendPasswordResetEmail = async (name, email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Password Reset</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Hi ${name}!</h2>
        <p>You requested a password reset for your Vendora account.</p>
        <p>Click the button below to reset your password.
           This link expires in <strong>30 minutes.</strong></p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #6366f1; color: white;
                  padding: 12px 24px; border-radius: 6px; text-decoration: none;
                  margin-top: 20px;">
          Reset Password
        </a>
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
          If you didn't request this, please ignore this email.
          Your password will remain unchanged.
        </p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>© 2026 Vendora. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail(email, "Reset Your Vendora Password", html);
};

// ─── Order Confirmation Email ─────────────────────────────────
const sendOrderConfirmationEmail = async (name, email, order, items) => {
  // Build items table rows
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${item.product_name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ₦${parseFloat(item.subtotal).toLocaleString()}
      </td>
    </tr>
  `,
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Order Confirmed! 🎉</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Hi ${name}!</h2>
        <p>Your order has been placed successfully.</p>

        <div style="background: white; border-radius: 8px;
                    padding: 20px; margin: 20px 0;">
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Payment:</strong> ${order.payment_status}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"
                  style="padding: 10px; text-align: right; font-weight: bold;">
                Total:
              </td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">
                ₦${parseFloat(order.total_amount).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        <a href="${process.env.FRONTEND_URL}/buyer/order.html?id=${order.id}"
           style="display: inline-block; background: #6366f1; color: white;
                  padding: 12px 24px; border-radius: 6px;
                  text-decoration: none; margin-top: 20px;">
          Track Your Order
        </a>
      </div>
      <div style="padding: 20px; text-align: center;
                  color: #9ca3af; font-size: 12px;">
        <p>© 2026 Vendora. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail(email, `Order Confirmed — #${order.id}`, html);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};
