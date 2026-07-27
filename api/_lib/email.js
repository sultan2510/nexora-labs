import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text, attachments }) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "Nexora Labs <team@nexoralabs.club>",
    to,
    subject,
    html,
    text, // plain-text alternative — improves inbox placement vs. spam
    attachments, // [{ filename, content: base64string }]
  });
}