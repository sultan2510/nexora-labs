import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

export default function Quiz() {
  const { intern, session } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!intern) return;
    fetch(`/api/quiz-questions?domain=${intern.domain}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setQuestions(data.questions);
      });
  }, [intern]);

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/quiz-submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.error) setError(data.error);
    else setResult(data);
  }

  if (error) return <p className="text-red">{error}</p>;
  if (!questions) return <p className="text-muted">Loading quiz…</p>;

  if (result) {
    return (
      <div className="max-w-xl mx-auto text-center py-10">
        <div className={`text-5xl mb-4 ${result.passed ? "text-red" : "text-muted"}`}>
          {result.passed ? "🎉" : "✕"}
        </div>
        <h1 className="text-3xl font-extrabold mb-2">
          {result.passed ? "You passed!" : "Not this time"}
        </h1>
        <p className="text-muted mb-8">Score: {result.score}% — {result.passed ? "70% or higher required" : "70% required to pass"}</p>
        {result.passed ? (
          <button className="btn-primary" onClick={() => navigate("/dashboard/certificate")}>
            View your certificate
          </button>
        ) : result.locked ? (
          <p className="text-red">All 3 attempts used for this cohort.</p>
        ) : (
          <p className="text-muted">You can retake after 24 hours. Check the Certificate page for the exact time.</p>
        )}
      </div>
    );
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold mb-2">Domain Certification Quiz</h1>
      <p className="text-muted mb-8">30 questions · 70% to pass · result shown instantly on submit</p>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="card p-5">
            <p className="font-semibold mb-3">{i + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-3 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === idx}
                    onChange={() => setAnswers({ ...answers, [q.id]: idx })}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red text-sm mt-4">{error}</p>}

      <button
        className="btn-primary w-full mt-8"
        disabled={!allAnswered || submitting}
        onClick={handleSubmit}
      >
        {submitting ? "Grading…" : "Submit Quiz"}
      </button>
    </div>
  );
}
