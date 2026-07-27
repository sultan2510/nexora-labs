import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Certificates() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    supabase
      .from("certificates")
      .select("*, interns(name, intern_id)")
      .order("issued_at", { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Issued certificates</h1>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card p-5 flex items-center justify-between">
            <div>
              <p className="font-bold">{r.interns?.name} ({r.interns?.intern_id})</p>
              <p className="text-sm text-muted">{r.cert_code} · {r.domain} · {new Date(r.issued_at).toLocaleDateString()}</p>
            </div>
            <a href={r.pdf_url} target="_blank" rel="noreferrer" className="btn-secondary !px-4 !py-2 text-sm">
              Download
            </a>
          </div>
        ))}
        {rows.length === 0 && <p className="text-muted">None issued yet.</p>}
      </div>
    </div>
  );
}
