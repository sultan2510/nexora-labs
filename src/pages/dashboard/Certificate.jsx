import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { QUIZ_FEE_PKR, PAYMENT_ACCOUNT_NAME, PAYMENT_ACCOUNT_NUMBER, PAYMENT_PROVIDER } from "../../lib/config";

export default function Certificate() {
  const { intern } = useAuth();
  const [allApproved, setAllApproved] = useState(false);
  const [payment, setPayment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [cert, setCert] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!intern) return;
    load();
  }, [intern]);

  async function load() {
    setLoading(true);
    const [{ data: tasks }, { data: submissions }, { data: payments }, { data: qa }, { data: certs }] =
      await Promise.all([
        supabase.from("tasks").select("id").eq("domain", intern.domain),
        supabase.from("submissions").select("task_id,status").eq("intern_id", intern.id),
        supabase.from("payments").select("*").eq("intern_id", intern.id).order("submitted_at", { ascending: false }),
        supabase.from("quiz_attempts").select("*").eq("intern_id", intern.id).order("attempted_at", { ascending: false }),
        supabase.from("certificates").select("*").eq("intern_id", intern.id).limit(1),
      ]);
    const approvedIds = new Set((submissions || []).filter((s) => s.status === "approved").map((s) => s.task_id));
    setAllApproved((tasks || []).length > 0 && (tasks || []).every((t) => approvedIds.has(t.id)));
    setPayment(payments?.[0] || null);
    setAttempts(qa || []);
    setCert(certs?.[0] || null);
    setLoading(false);
  }

  async function uploadProof(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const path = `${intern.id}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
    if (!upErr) {
      await supabase.from("payments").insert({ intern_id: intern.id, screenshot_url: path });
      await load();
    }
    setUploading(false);
  }

  if (loading) return <p className="text-muted">Loading…</p>;

  const failedCount = attempts.filter((a) => !a.passed).length;
  const lockedOut = failedCount >= 3 && !attempts.some((a) => a.passed);
  const lastAttempt = attempts[0];
  const cooldownActive =
    lastAttempt && !lastAttempt.passed && lastAttempt.next_retry_at && new Date(lastAttempt.next_retry_at) > new Date();

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-extrabold mb-2">Certificate</h1>
      <p className="text-muted mb-10">{intern.cohort} — {intern.domain}</p>

      {cert ? (
        <div className="card p-8 text-center">
          <div className="text-red text-5xl mb-4">🎓</div>
          <h2 className="text-2xl font-extrabold mb-2">Certificate issued</h2>
          <p className="text-muted mb-6">Certificate ID: {cert.cert_code}</p>
          <a href={cert.pdf_url} target="_blank" rel="noreferrer" className="btn-primary">
            Download Certificate
          </a>
        </div>
      ) : !allApproved ? (
        <div className="card p-8 text-center">
          <div className="text-muted text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Not unlocked yet</h2>
          <p className="text-muted mb-6">Complete and get all tasks approved to unlock the next step.</p>
          <Link to="/dashboard/tasks" className="btn-primary">View Tasks</Link>
        </div>
      ) : lockedOut ? (
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold mb-2 text-red">Quiz attempts used</h2>
          <p className="text-muted">
            You've used all 3 attempts for this cohort. You're welcome to reapply to a future cohort to try again.
          </p>
        </div>
      ) : payment?.status !== "verified" ? (
        <div className="card p-8">
          <h2 className="text-xl font-bold mb-2">Pay to unlock your quiz</h2>
          <p className="text-muted mb-6">
            All tasks approved 🎉 — the certification quiz costs Rs {QUIZ_FEE_PKR}, one-time, no refunds.
          </p>
          <div className="bg-surface2 border border-border rounded-lg p-4 mb-6 text-sm">
            <p>Pay via <span className="font-bold text-red">{PAYMENT_PROVIDER}</span></p>
            <p className="mt-1">Account name: <span className="font-semibold">{PAYMENT_ACCOUNT_NAME}</span></p>
            <p className="mt-1">Account number: <span className="font-semibold">{PAYMENT_ACCOUNT_NUMBER}</span></p>
          </div>

          {payment?.status === "pending" ? (
            <p className="text-sm text-muted">Your payment proof is under review. We'll unlock the quiz once verified.</p>
          ) : payment?.status === "rejected" ? (
            <>
              <p className="text-sm text-red mb-3">Your last proof was rejected — please re-upload a clear screenshot.</p>
              <UploadForm file={file} setFile={setFile} onSubmit={uploadProof} uploading={uploading} />
            </>
          ) : (
            <UploadForm file={file} setFile={setFile} onSubmit={uploadProof} uploading={uploading} />
          )}
        </div>
      ) : cooldownActive ? (
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Retake available soon</h2>
          <p className="text-muted">
            You can retake the quiz after {new Date(lastAttempt.next_retry_at).toLocaleString()}.
          </p>
        </div>
      ) : (
        <div className="card p-8">
          <h2 className="text-xl font-bold mb-4">Ready for your certification quiz</h2>

          <div className="bg-surface2 border border-border rounded-lg p-5 mb-6 space-y-2 text-sm">
            <p><span className="text-muted">Questions:</span> <span className="font-semibold">30</span> (20 hard, 10 easy)</p>
            <p><span className="text-muted">Passing score:</span> <span className="font-semibold">70%</span></p>
            <p><span className="text-muted">Result:</span> <span className="font-semibold">shown immediately after you submit</span></p>
            <p><span className="text-muted">Attempts:</span> <span className="font-semibold">up to 3</span>, 24 hours apart — no refund if you fail, and the fee already paid covers all attempts</p>
            <p><span className="text-muted">If you fail all 3:</span> <span className="font-semibold">locked for this cohort</span> (you can try again in a future cohort)</p>
            <p><span className="text-muted">On passing:</span> your certificate is generated and downloadable <span className="font-semibold">instantly</span></p>
            <p><span className="text-muted">Certificate:</span> signed by both founders, <span className="font-semibold">valid forever</span>, publicly verifiable by its certificate ID</p>
          </div>

          {attempts.length > 0 && (
            <p className="text-sm text-muted mb-4">
              You've used {attempts.length} of 3 attempts. This will be attempt {attempts.length + 1}.
            </p>
          )}

          <Link to="/dashboard/quiz" className="btn-primary w-full">I'm ready — start the quiz</Link>
        </div>
      )}
    </div>
  );
}

function UploadForm({ file, setFile, onSubmit, uploading }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        required
        type="file"
        accept="image/*"
        className="input file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-red file:text-white"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button className="btn-primary w-full" disabled={uploading}>
        {uploading ? "Uploading…" : "Submit payment proof"}
      </button>
    </form>
  );
}
