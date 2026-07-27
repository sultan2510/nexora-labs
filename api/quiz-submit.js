import { supabaseAdmin, getUserFromRequest } from "./_lib/supabaseAdmin.js";
import { buildCertificatePdf } from "./_lib/pdfTemplates.js";

const COOLDOWN_HOURS = 24;
const MAX_ATTEMPTS = 3;
const PASSING_SCORE = 70;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { data: intern } = await supabaseAdmin.from("interns").select("*").eq("id", user.id).single();
  if (!intern) return res.status(404).json({ error: "Intern profile not found" });

  // Must have a verified payment before taking the quiz.
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("intern_id", intern.id)
    .eq("status", "verified")
    .maybeSingle();
  if (!payment) return res.status(403).json({ error: "Payment not verified yet" });

  const { data: pastAttempts } = await supabaseAdmin
    .from("quiz_attempts")
    .select("*")
    .eq("intern_id", intern.id)
    .order("attempted_at", { ascending: false });

  const alreadyPassed = pastAttempts?.some((a) => a.passed);
  if (alreadyPassed) return res.status(400).json({ error: "You've already passed this quiz" });

  if ((pastAttempts?.length || 0) >= MAX_ATTEMPTS) {
    return res.status(403).json({ error: "All attempts used for this cohort", locked: true });
  }

  const last = pastAttempts?.[0];
  if (last?.next_retry_at && new Date(last.next_retry_at) > new Date()) {
    return res.status(403).json({ error: "Retake cooldown still active" });
  }

  const { data: quiz } = await supabaseAdmin.from("quizzes").select("*").eq("domain", intern.domain).single();
  if (!quiz) return res.status(404).json({ error: "No quiz configured for this domain" });

  const { answers } = req.body || {};
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return res.status(400).json({ error: "Invalid submission" });
  }

  const total = quiz.questions.length;
  let correct = 0;
  quiz.questions.forEach((q, i) => {
    const given = answers[String(i)];
    if (typeof given === "number" && given === q.correct_index) correct += 1;
  });
  const score = Math.round((correct / total) * 100);
  const passed = score >= PASSING_SCORE;
  const attemptNumber = (pastAttempts?.length || 0) + 1;

  await supabaseAdmin.from("quiz_attempts").insert({
    intern_id: intern.id,
    quiz_id: quiz.id,
    score,
    passed,
    attempt_number: attemptNumber,
    next_retry_at: passed ? null : new Date(Date.now() + COOLDOWN_HOURS * 3600 * 1000).toISOString(),
  });

  if (!passed) {
    return res.status(200).json({
      passed: false,
      score,
      locked: attemptNumber >= MAX_ATTEMPTS,
    });
  }

  // --- Passed: generate and store the certificate ---
  const { count } = await supabaseAdmin.from("certificates").select("*", { count: "exact", head: true });
  const certCode = `NXL-CERT-2026-${String((count || 0) + 1).padStart(4, "0")}`;
  const issueDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const pdfBytes = await buildCertificatePdf({
    name: intern.name,
    domain: intern.domain,
    certCode,
    issueDate,
  });

  const path = `${certCode}.pdf`;
  await supabaseAdmin.storage.from("certificates").upload(path, Buffer.from(pdfBytes), {
    contentType: "application/pdf",
    upsert: true,
  });
  const { data: urlData } = supabaseAdmin.storage.from("certificates").getPublicUrl(path);

  await supabaseAdmin.from("certificates").insert({
    intern_id: intern.id,
    cert_code: certCode,
    domain: intern.domain,
    pdf_url: urlData.publicUrl,
  });

  return res.status(200).json({ passed: true, score, certCode, pdfUrl: urlData.publicUrl });
}
