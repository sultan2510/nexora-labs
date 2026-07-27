import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Verify() {
  const { code } = useParams();
  const [cert, setCert] = useState(undefined);

  useEffect(() => {
    supabase
      .from("certificates")
      .select("*, interns(name)")
      .eq("cert_code", code)
      .maybeSingle()
      .then(({ data }) => setCert(data));
  }, [code]);

  if (cert === undefined) return <p className="text-muted max-w-xl mx-auto px-6 py-24">Checking…</p>;

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      {cert ? (
        <>
          <div className="text-red text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-extrabold mb-2">Certificate verified</h1>
          <p className="text-muted mb-1">{cert.interns?.name}</p>
          <p className="text-muted mb-1">{cert.domain}</p>
          <p className="text-muted">Issued {new Date(cert.issued_at).toLocaleDateString()}</p>
          <p className="text-xs text-muted mt-6">{cert.cert_code}</p>
        </>
      ) : (
        <>
          <div className="text-muted text-5xl mb-4">✕</div>
          <h1 className="text-2xl font-extrabold mb-2">No certificate found</h1>
          <p className="text-muted">This code doesn't match any issued Nexora Labs certificate.</p>
        </>
      )}
    </div>
  );
}
