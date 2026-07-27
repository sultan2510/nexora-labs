import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { COHORT } from "../../lib/config";

export default function Tasks() {
  const { intern } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [linkDrafts, setLinkDrafts] = useState({});
  const [busyTaskId, setBusyTaskId] = useState(null);

  useEffect(() => {
    if (!intern) return;
    load();
  }, [intern]);

  async function load() {
    const [{ data: taskRows }, { data: subRows }] = await Promise.all([
      supabase.from("tasks").select("*").eq("domain", intern.domain).order("week_number").order("order_index"),
      supabase.from("submissions").select("*").eq("intern_id", intern.id),
    ]);
    setTasks(taskRows || []);
    const map = {};
    (subRows || []).forEach((s) => (map[s.task_id] = s));
    setSubmissions(map);
  }

  async function submitTask(taskId) {
    const link = linkDrafts[taskId];
    if (!link) return;
    setBusyTaskId(taskId);
    const { error } = await supabase.from("submissions").insert({
      intern_id: intern.id,
      task_id: taskId,
      submission_link: link,
    });
    setBusyTaskId(null);
    if (!error) load();
  }

  const weeks = [1, 2, 3, 4];
  const tasksByWeek = weeks.map((w) => tasks.filter((t) => t.week_number === w));

  // A week is unlocked if it's week 1, the previous week is fully approved,
  // or the calendar has simply reached that week's scheduled start (whichever comes first).
  const startDate = new Date(COHORT.startDate);
  const now = new Date();
  const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  const calendarUnlockedWeek = Math.min(4, Math.max(1, Math.floor(daysElapsed / 7) + 1));

  function isWeekApproved(weekTasks) {
    return weekTasks.length > 0 && weekTasks.every((t) => submissions[t.id]?.status === "approved");
  }

  let earlyUnlockedThrough = 1;
  for (let w = 1; w <= 4; w++) {
    if (isWeekApproved(tasksByWeek[w - 1])) earlyUnlockedThrough = w + 1;
    else break;
  }

  const unlockedWeek = Math.max(calendarUnlockedWeek, Math.min(4, earlyUnlockedThrough));

  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-2">Tasks</h1>
      <p className="text-muted mb-10">
        Finish a week's tasks early to unlock the next one right away — or it unlocks on schedule either way.
      </p>

      {weeks.map((w) => {
        const weekTasks = tasksByWeek[w - 1];
        const locked = w > unlockedWeek;
        return (
          <div key={w} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs font-bold tracking-widest text-muted">WEEK {w}</p>
              <div className="h-px bg-border flex-1" />
              {locked && <span className="text-xs text-muted">🔒 Locked</span>}
            </div>

            {locked ? (
              <div className="card p-6 text-muted text-sm">
                Unlocks once Week {w - 1} is fully approved, or on its scheduled date.
              </div>
            ) : (
              <div className="space-y-4">
                {weekTasks.map((t) => {
                  const sub = submissions[t.id];
                  return (
                    <div key={t.id} className="card p-6">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-bold">{t.title}</h3>
                        {sub?.status === "approved" && <span className="badge-approved">Approved</span>}
                        {sub?.status === "pending" && <span className="badge-pending">In review</span>}
                        {sub?.status === "rejected" && <span className="badge-pending text-red">Rejected — resubmit</span>}
                      </div>
                      <p className="text-sm text-muted mb-4">{t.description}</p>

                      {t.requirements?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-bold tracking-widest text-muted mb-1.5">REQUIREMENTS</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-white/90">
                            {t.requirements.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                      {t.resources?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold tracking-widest text-muted mb-1.5">SUGGESTED RESOURCES</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted">
                            {t.resources.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}

                      {(!sub || sub.status === "rejected") && (
                        <div className="flex gap-2">
                          <input
                            className="input"
                            placeholder="Link to your submission (repo, deploy, doc…)"
                            value={linkDrafts[t.id] || ""}
                            onChange={(e) => setLinkDrafts({ ...linkDrafts, [t.id]: e.target.value })}
                          />
                          <button
                            className="btn-primary whitespace-nowrap"
                            disabled={busyTaskId === t.id}
                            onClick={() => submitTask(t.id)}
                          >
                            {busyTaskId === t.id ? "Submitting…" : "Submit"}
                          </button>
                        </div>
                      )}
                      {sub && sub.status !== "rejected" && (
                        <a href={sub.submission_link} target="_blank" rel="noreferrer" className="text-sm text-red underline">
                          {sub.submission_link}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
