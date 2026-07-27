import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Submissions() {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("submissions")
      .select("*, tasks(title, domain, checklist, requirements), interns(name, intern_id)")
      .eq("status", "pending")
      .order("submitted_at");
    setRows(data || []);
  }

  async function review(id, status) {
    setBusyId(id);
    const sub = rows.find((r) => r.id === id);
    await supabase.from("submissions").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (status === "approved") {
      await supabase.from("badges").insert({ intern_id: sub.intern_id, task_id: sub.task_id });
    }
    setBusyId(null);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Submissions to review</h1>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-bold">{r.tasks?.title}</p>
              <p className="text-sm text-muted mb-2">
                {r.interns?.name} ({r.interns?.intern_id}) · {r.tasks?.domain}
              </p>
              <a href={r.submission_link} target="_blank" rel="noreferrer" className="text-sm text-red underline">
                {r.submission_link}
              </a>

              {r.tasks?.checklist?.length > 0 && (
                <div className="mt-3 bg-surface2 border border-border rounded-lg p-3">
                  <p className="text-xs font-bold tracking-widest text-muted mb-1.5">REVIEW CHECKLIST</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {r.tasks.checklist.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="btn-primary !px-4 !py-2 text-sm" disabled={busyId === r.id} onClick={() => review(r.id, "approved")}>
                Approve
              </button>
              <button className="btn-secondary !px-4 !py-2 text-sm" disabled={busyId === r.id} onClick={() => review(r.id, "rejected")}>
                Reject
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted">Nothing pending.</p>}
      </div>
    </div>
  );
}
