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
    // 0. If this applicant already has an intern row (e.g. a previous
    // attempt got partway through before failing), reuse it instead of
    // trying to create everything from scratch again.
    const { data: existingIntern } = await supabaseAdmin
      .from("interns")
      .select("*")
      .eq("applicant_id", applicant.id)
      .maybeSingle();

    let authUserId, internId;

    if (existingIntern) {
      authUserId = existingIntern.id;
      internId = existingIntern.intern_id;
    } else {
      // 1. Create the auth user with no password yet — they'll set one via
      // the one-time link generated in step 6 below.
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: applicant.email,
        email_confirm: true,
      });

      if (authErr) {
        // Recover instead of failing outright: this happens when a
        // previous attempt created the login account but failed on a
        // later step (e.g. building the PDF) before finishing.
        const alreadyExists = /already been registered|already exists/i.test(authErr.message || "");
        if (!alreadyExists) throw authErr;

        const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) throw listErr;
        const existingUser = listData.users.find((u) => u.email === applicant.email);
        if (!existingUser) throw new Error("Account already registered but could not be located to recover it.");
        authUserId = existingUser.id;
      } else {
        authUserId = authUser.user.id;
      }

      // 2. Generate a sequential Intern ID: NXL-2608-0001
      const { count } = await supabaseAdmin.from("interns").select("*", { count: "exact", head: true });
      const seq = String((count || 0) + 1).padStart(4, "0");
      internId = `NXL-2608-${seq}`;

      // 3. Create the intern row (upsert so a retry never hits a duplicate-key error)
      const { error: internErr } = await supabaseAdmin.from("interns").upsert(
        {
          id: authUserId,
          applicant_id: applicant.id,
          intern_id: internId,
          name: applicant.name,
          email: applicant.email,
          domain: applicant.domain,
        },
        { onConflict: "id" }
      );
      if (internErr) throw internErr;
    }

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
    const siteUrl = process.env.SITE_URL || "https://nexoralabs.club";
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: applicant.email,
      options: { redirectTo: `${siteUrl}/set-password` },
    });
    if (linkErr) throw linkErr;
    const setPasswordLink = linkData.properties.action_link;

    // 7. Email it via Resend
    const displayDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const domainName = escapeHtml(applicant.domain);
    const safeName = escapeHtml(applicant.name);
    const safeInternId = escapeHtml(internId);

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111; max-width: 560px; margin: 0 auto;">
        <p>Hi ${safeName},</p>
        <p>Congratulations — you've been selected for the <b>${domainName}</b> track at Nexora Labs, for the cohort starting August 3, 2026. Your offer letter is attached to this email as a PDF.</p>
        <p><b>Date:</b> ${displayDate}<br/>
        <b>Track:</b> ${domainName}<br/>
        <b>Intern ID:</b> ${safeInternId}</p>
        <p><a href="${setPasswordLink}" style="color:#E11D2E; font-weight:bold;">Click here to set your password</a> and access your dashboard. This link is one-time use — after setting your password, log in anytime at nexoralabs.club/login with your email and password.</p>
        <p>Next, please join our official WhatsApp group for your track to get further instructions and connect with your cohort:<br/>
        <a href="${whatsappLink}" style="color:#E11D2E; font-weight:bold;">${whatsappLink}</a></p>
        <p>We look forward to having you build with us.</p>
        <p>Warm regards,<br/>Malik Sultan Ali, Founder &amp; Ahmed Shaheer, CEO<br/>Nexora Labs</p>
      </div>
    `;

    const text = `Hi ${applicant.name},

Congratulations — you've been selected for the ${applicant.domain} track at Nexora Labs, for the cohort starting August 3, 2026. Your offer letter is attached to this email as a PDF.

Date: ${displayDate}
Track: ${applicant.domain}
Intern ID: ${internId}

Set your password here (one-time link): ${setPasswordLink}
After that, log in anytime at nexoralabs.club/login with your email and password.

Join our WhatsApp group for your track: ${whatsappLink}

We look forward to having you build with us.

Warm regards,
Malik Sultan Ali, Founder & Ahmed Shaheer, CEO
Nexora Labs`;

    await sendEmail({
      to: applicant.email,
      subject: `Offer of Internship - ${applicant.domain} Track at Nexora Labs`,
      html,
      text,
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
    console.error("admin-approve failed for applicant", applicant_id, err);
    return res.status(500).json({ error: err.message || "Failed to select applicant" });
  }
}