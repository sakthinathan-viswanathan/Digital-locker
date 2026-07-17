const nodemailer = require("nodemailer");

// SMTP is optional. If SMTP_HOST/USER/PASS aren't set (e.g. local dev),
// we fall back to logging the email contents (and the reset link) to the
// console so the flow is still fully testable without a mail provider.
const SMTP_CONFIGURED = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

let transporter = null;
if (SMTP_CONFIGURED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = "Reset your Vaultly password";
  const text = `Hi ${name || ""},\n\nWe received a request to reset your Vaultly password. Click the link below to choose a new one. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#0F1B33;">Reset your Vaultly password</h2>
      <p>Hi ${name || ""},</p>
      <p>We received a request to reset your Vaultly password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#C6952C;color:#0F1B33;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a></p>
      <p style="color:#64748B;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>`;

  if (!SMTP_CONFIGURED) {
    console.log("\n=== Password reset email (SMTP not configured, logging instead) ===");
    console.log(`To: ${to}`);
    console.log(`Reset link: ${resetUrl}`);
    console.log("=====================================================================\n");
    return { delivered: false };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Vaultly" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return { delivered: true };
}

module.exports = { sendPasswordResetEmail, SMTP_CONFIGURED };
