import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else navigate("/dashboard");
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email above first, then click 'Forgot password?'");
      return;
    }
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });
    if (error) setError(error.message);
    else setResetSent(true);
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-24">
      <h1 className="text-3xl font-extrabold mb-2">Log in</h1>
      <p className="text-muted mb-8 text-sm">
        Use the email and password from your Nexora Labs account. First time logging in?
        Check your offer letter email for a link to set your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          type="email"
          placeholder="you@example.com"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          type="password"
          placeholder="Password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red">{error}</p>}
        {resetSent && <p className="text-sm text-red">Password reset email sent — check your inbox.</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>

      <button onClick={handleForgotPassword} className="text-sm text-muted hover:text-white mt-4 underline">
        Forgot password?
      </button>

      <p className="text-sm text-muted mt-8">
        Haven't applied yet? <Link to="/apply" className="text-red underline">Apply here</Link>
      </p>
    </div>
  );
}
