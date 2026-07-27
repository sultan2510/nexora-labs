import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

export default function Overview() {
  const { intern } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!intern) return;
    async function load() {
      const [{ data: tasks }, { data: submissions }] = await Promise.all([
        supabase.from("tasks").select("id").eq("domain", intern.domain),
        supabase.from("submissions").select("status").eq("intern_id", intern.id),
      ]);
      const total = tasks?.length || 0;
      const approved = submissions?.filter((s) => s.status === "approved").length || 0;
      const submitted = submissions?.filter((s) => s.status === "pending").length || 0;
      setStats({ total, approved, submitted, pending: total - approved - submitted });
    }
    load();
  }, [intern]);

  if (!intern || !stats) return <p className="text-muted">Loading…</p>;

  const pct = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div>
      <p className="text-muted">Welcome back</p>
      <h1 className="text-4xl font-extrabold mb-1">{intern.name} 👋</h1>
      <p className="text-red font-medium mb-10">
        {intern.domain} · {intern.cohort}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Submitted" value={stats.submitted} />
        <StatCard label="Pending" value={stats.pending} />
      </div>

      <div className="card p-6 mb-8">
        <div className="flex justify-between mb-2">
          <p className="font-bold">Overall Progress</p>
          <p className="text-red font-bold">{pct}%</p>
        </div>
        <div className="h-2 bg-surface2 rounded-full overflow-hidden">
          <div className="h-full bg-red" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-muted mt-3">
          {stats.approved} of {stats.total} tasks approved
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/dashboard/tasks" className="card p-6 flex justify-between items-center hover:border-red/40 transition-colors">
          <div>
            <p className="font-bold">View Tasks</p>
            <p className="text-sm text-muted">{stats.pending + stats.submitted} remaining</p>
          </div>
          <span className="text-red">→</span>
        </Link>
        <Link to="/dashboard/certificate" className="card p-6 flex justify-between items-center hover:border-red/40 transition-colors">
          <div>
            <p className="font-bold">Certificate</p>
            <p className="text-sm text-muted">{stats.total - stats.approved} tasks remaining</p>
          </div>
          <span className="text-red">→</span>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  );
}
