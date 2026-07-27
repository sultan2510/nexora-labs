import { supabaseAdmin, getUserFromRequest } from "./_lib/supabaseAdmin.js";
import { buildOfferLetterPdf } from "./_lib/pdfTemplates.js";
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

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { data: adminRow } = await supabaseAdmin.from("admins").select("id").eq("id", user.id).maybeSingle();
  if (!adminRow) return res.status(403).json({ error: "Admin access required" });

  const { applicant_id, action } = req.body || {};
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!applicant_id || !uuidRe.test(applicant_id) || !["select", "reject"].includes(action)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { data: applicant, error: fetchErr } = await supabaseAdmin
    .from("applicants")
    .select("*")
    .eq("id", applicant_id)
    .single();
  if (fetchErr || !applicant) return res.status(404).json({ error: "Applicant not found" });

  if (action === "reject") {
    await supabaseAdmin
      .from("applicants")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", applicant_id);
    return res.status(200).json({ ok: true });
  }

  // --- action === "select" ---
  try {
    // 1. Create the auth user (passwordless — they log in via magic link)
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: applicant.email,
      email_confirm: true,
    });
    if (authErr) throw authErr;

    // 2. Generate a sequential Intern ID: NXL-2608-0001
    const { count } = await supabaseAdmin.from("interns").select("*", { count: "exact", head: true });
    const seq = String((count || 0) + 1).padStart(4, "0");
    const internId = `NXL-2608-${seq}`;

    // 3. Create the intern row
    const { error: internErr } = await supabaseAdmin.from("interns").insert({
      id: authUser.user.id,
      applicant_id: applicant.id,
      intern_id: internId,
      name: applicant.name,
      email: applicant.email,
      domain: applicant.domain,
    });
    if (internErr) throw internErr;

    // 4. Bump the domain's filled_count
    await supabaseAdmin.rpc("increment_filled_count", { domain_slug: applicant.domain }).catch(() => {
      // Fallback if the RPC function isn't set up — see supabase/schema.sql note below.
    });

    // 5. Build the offer letter PDF
    const whatsappLinks = JSON.parse(process.env.WHATSAPP_GROUP_LINKS || "{}");
    const whatsappLink = whatsappLinks[applicant.domain] || "https://chat.whatsapp.com/your-group-link";
    const pdfBytes = await buildOfferLetterPdf({
      name: applicant.name,
      domain: applicant.domain,
      internId,
      whatsappLink,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    });

    // 6. Generate a one-time link for the student to set their password.
    // This is a password-based account (not magic-link), so this link is
    // only ever needed once, right now — after this, they log in with
    // email + password and no further emails are sent per login.
    const siteUrl = process.env.SITE_URL || "https://nexoralabs.com";
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: applicant.email,
      options: { redirectTo: `${siteUrl}/set-password` },
    });
    if (linkErr) throw linkErr;
    const setPasswordLink = linkData.properties.action_link;

    // 7. Email it via Resend
    await sendEmail({
      to: applicant.email,
      subject: `Offer of Internship - ${applicant.domain} Track at Nexora Labs`,
      html: `<p>Hi ${escapeHtml(applicant.name)},</p><p>Congratulations — your offer letter is attached. Your Intern ID is <b>${escapeHtml(internId)}</b>.</p><p><a href="${setPasswordLink}">Click here to set your password</a> and access your dashboard. This link is one-time use — after setting your password, log in anytime at nexoralabs.com/login with your email and password.</p>`,
      attachments: [
        { filename: "Nexora-Labs-Offer-Letter.pdf", content: Buffer.from(pdfBytes).toString("base64") },
      ],
    });

    // 8. Mark applicant as selected
    await supabaseAdmin
      .from("applicants")
      .update({ status: "selected", reviewed_at: new Date().toISOString() })
      .eq("id", applicant_id);

    return res.status(200).json({ ok: true, internId });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to select applicant" });
  }
}
