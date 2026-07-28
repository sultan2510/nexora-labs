import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { DOMAINS } from "../lib/config";

export default function Apply() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    domain: params.get("domain") || DOMAINS[0].slug,
  });
  const [website, setWebsite] = useState(""); // honeypot — real users never fill this in
  const [cvFile, setCvFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const d = params.get("domain");
    if (d) setForm((f) => ({ ...f, domain: d }));
  }, [params]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (website) return; // bot filled the honeypot — silently drop
    if (!cvFile) {
      setErrorMsg("Please attach your CV (PDF or Word document).");
      return;
    }
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(cvFile.type)) {
      setErrorMsg("Your CV must be a PDF or Word document (.pdf, .doc, .docx).");
      return;
    }
    if (cvFile.size > 5 * 1024 * 1024) {
      setErrorMsg("Your CV file is too large — please keep it under 5MB.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const path = `${Date.now()}-${cvFile.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(path, cvFile);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("applicants").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        domain: form.domain,
        cv_url: path, // storage path — the bucket is private; admins view it via a signed URL
      });
      if (insertError) throw insertError;

      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="text-red text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-extrabold mb-3">Application received</h1>
        <p className="text-muted">
          We review every application by hand — you'll hear back by email if you're selected,
          with your offer letter and next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold mb-2">Apply to Nexora Labs</h1>
      <p className="text-muted mb-10">August 2026 cohort — August 3 to September 3.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <div>
          <label className="text-sm font-medium mb-1 block">Full name</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input
            required
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Phone</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Track</label>
          <select
            className="input"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
          >
            {DOMAINS.map((d) => (
              <option key={d.slug} value={d.slug}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">CV (PDF or Word)</label>
          <input
            required
            type="file"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx"
            className="input file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-red file:text-white"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          />
        </div>

        {errorMsg && <p className="text-sm text-red">{errorMsg}</p>}

        <button className="btn-primary w-full" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}