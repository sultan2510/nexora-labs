import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function QuizResults() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    supabase
      .from("quiz_attempts")
      .select("*, interns(name, intern_id, domain)")
      .order("attempted_at", { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Quiz results</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-surface2 text-muted">
            <tr>
              <th className="text-left p-3">Intern</th>
              <th className="text-left p-3">Domain</th>
              <th className="text-left p-3">Attempt</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Result</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.interns?.name} ({r.interns?.intern_id})</td>
                <td className="p-3">{r.interns?.domain}</td>
                <td className="p-3">{r.attempt_number}/3</td>
                <td className="p-3">{r.score}%</td>
                <td className="p-3">
                  <span className={r.passed ? "badge-approved" : "badge-pending"}>
                    {r.passed ? "Passed" : "Failed"}
                  </span>
                </td>
                <td className="p-3 text-muted">{new Date(r.attempted_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {rows.length === 0 && <p className="text-muted p-5">No attempts yet.</p>}
      </div>
    </div>
  );
}