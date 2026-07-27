import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, attachments }) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "Nexora Labs <team@nexoralabs.com>",
    to,
    subject,
    html,
    attachments, // [{ filename, content: base64string }]
  });
}
