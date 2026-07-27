import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

async function viewCv(path) {
  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(path, 300); // 5 min
  if (error) {
    alert("Couldn't load CV: " + error.message);
    return;
  }
  window.open(data.signedUrl, "_blank");
}

export default function Applications() {
  const { session } = useAuth();
  const [apps, setApps] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("applicants").select("*").order("applied_at", { ascending: false });
    setApps(data || []);
  }

  async function act(id, action) {
    setBusyId(id);
    const res = await fetch("/api/admin-approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ applicant_id: id, action }),
    });
    const data = await res.json();
    setBusyId(null);
    if (data.error) alert(data.error);
    else load();
  }

  const visible = apps.filter((a) => filter === "all" || a.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold">Applications</h1>
        <select className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="space-y-3">
        {visible.map((a) => (
          <div key={a.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold">{a.name} <span className="text-muted font-normal">· {a.domain}</span></p>
              <p className="text-sm text-muted">{a.email} {a.phone && `· ${a.phone}`}</p>
              <button onClick={() => viewCv(a.cv_url)} className="text-sm text-red underline">View CV</button>
            </div>
            <div className="flex items-center gap-2">
              {a.status === "pending" ? (
                <>
                  <button
                    className="btn-primary !px-4 !py-2 text-sm"
                    disabled={busyId === a.id}
                    onClick={() => act(a.id, "select")}
                  >
                    Select
                  </button>
                  <button
                    className="btn-secondary !px-4 !py-2 text-sm"
                    disabled={busyId === a.id}
                    onClick={() => act(a.id, "reject")}
                  >
                    Reject
                  </button>
                </>
              ) : (
                <span className={a.status === "selected" ? "badge-approved" : "badge-pending"}>
                  {a.status}
                </span>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && <p className="text-muted">Nothing here.</p>}
      </div>
    </div>
  );
}
