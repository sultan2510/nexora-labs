import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <h1 className="text-4xl font-extrabold mb-6">Contact</h1>
        <div className="card p-5">
          <p className="text-xs text-muted mb-1">EMAIL</p>
          <p className="font-semibold">team@nexoralabs.club</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-muted mb-1">RESPONSE TIME</p>
          <p className="font-semibold">We typically respond within 1–2 business days.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Name</label>
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
          <label className="text-sm font-medium mb-1 block">Message</label>
          <textarea
            required
            rows={5}
            className="input"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <button className="btn-primary w-full" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        {status === "sent" && <p className="text-sm text-red">Message sent — we'll get back to you soon.</p>}
        {status === "error" && <p className="text-sm text-red">{errorMsg}</p>}
      </form>
    </div>
  );
}