import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Simplest reliable option for an internship-scale site: mailto.
    // Swap for a Resend-backed /api/contact route later if you want it logged server-side.
    window.location.href = `mailto:team@nexoralabs.com?subject=${encodeURIComponent(
      "Message from " + form.name
    )}&body=${encodeURIComponent(form.message + "\n\n" + form.email)}`;
    setSent(true);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <h1 className="text-4xl font-extrabold mb-6">Contact</h1>
        <div className="card p-5">
          <p className="text-xs text-muted mb-1">EMAIL</p>
          <p className="font-semibold">team@nexoralabs.com</p>
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
        <button className="btn-primary w-full">Send message</button>
        {sent && <p className="text-sm text-red">Opening your email client…</p>}
      </form>
    </div>
  );
}
