import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

async function viewProof(path) {
  const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
  if (error) {
    alert("Couldn't load screenshot: " + error.message);
    return;
  }
  window.open(data.signedUrl, "_blank");
}

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("payments")
      .select("*, interns(name, intern_id, domain)")
      .eq("status", "pending")
      .order("submitted_at");
    setRows(data || []);
  }

  async function review(id, status) {
    setBusyId(id);
    await supabase.from("payments").update({ status, verified_at: new Date().toISOString() }).eq("id", id);
    setBusyId(null);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Payment proofs to verify</h1>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold">{r.interns?.name} ({r.interns?.intern_id})</p>
              <p className="text-sm text-muted">{r.interns?.domain}</p>
              <button onClick={() => viewProof(r.screenshot_url)} className="text-sm text-red underline">
                View screenshot
              </button>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary !px-4 !py-2 text-sm" disabled={busyId === r.id} onClick={() => review(r.id, "verified")}>
                Verify
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
