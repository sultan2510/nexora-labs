import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function SetPassword() {
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    // Don't depend on catching one specific auth event — just poll for a
    // real session for a few seconds. This is what the recovery link
    // actually produces once Supabase's client finishes parsing the URL,
    // regardless of exactly which event fires or when.
    async function waitForSession() {
      for (let attempt = 0; attempt < 15; attempt++) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setReady(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (!cancelled) setExpired(true);
    }

    waitForSession();
    const { data: sub } = supabase.auth.onAuthStateChange(() => waitForSession());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
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

  if (expired) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24 text-center">
        <p className="text-red font-semibold mb-2">This link has expired or already been used.</p>
        <p className="text-muted text-sm">
          Go to the <a href="/login" className="text-red underline">login page</a> and use "Forgot password?" to get a new one.
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24 text-center text-muted">
        Verifying your link…
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