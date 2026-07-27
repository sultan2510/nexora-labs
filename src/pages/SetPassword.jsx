import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function SetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase's client automatically parses the recovery token from the
    // URL and fires this event once a temporary session is established.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // In case the event already fired before this listener attached.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else navigate("/dashboard");
  }

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24 text-center text-muted">
        Verifying your link… if this doesn't finish, the link may have expired —
        request a new one from the login page.
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <h1 className="text-3xl font-extrabold mb-2">Set your password</h1>
      <p className="text-muted mb-8 text-sm">
        You'll use this to log in going forward — no more email links needed.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          type="password"
          placeholder="New password (min 8 characters)"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          required
          type="password"
          placeholder="Confirm password"
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-red">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Set password & continue"}
        </button>
      </form>
    </div>
  );
}
