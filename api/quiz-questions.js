import { supabaseAdmin, getUserFromRequest } from "./_lib/supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const { data: intern } = await supabaseAdmin.from("interns").select("*").eq("id", user.id).single();
  if (!intern) return res.status(404).json({ error: "Intern profile not found" });

  const { data: quiz } = await supabaseAdmin.from("quizzes").select("*").eq("domain", intern.domain).single();
  if (!quiz) return res.status(404).json({ error: "No quiz configured for this domain yet" });

  // Strip correct_index so the client never sees the answer key.
  // The array index doubles as a stable question id for grading.
  const questions = quiz.questions.map((q, i) => ({
    id: String(i),
    question: q.question,
    options: q.options,
  }));

  return res.status(200).json({ questions });
}
