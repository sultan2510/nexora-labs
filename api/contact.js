import { sendEmail } from "./_lib/email.js";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }
  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid input." });
  }
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return res.status(400).json({ error: "One of the fields is too long." });
  }

  try {
    await sendEmail({
      to: process.env.CONTACT_INBOX || "team@nexoralabs.club",
      subject: `Contact form: ${name}`,
      html: `<p><b>From:</b> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
      text: `From: ${name} (${email})\n\n${message}`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact form send failed", err);
    return res.status(500).json({ error: "Failed to send — please email us directly instead." });
  }
}