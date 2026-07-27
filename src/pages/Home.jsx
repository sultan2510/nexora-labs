import { Link } from "react-router-dom";
import { COHORT } from "../lib/config";

export default function Home() {
  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="inline-flex items-center gap-2 border border-red/30 bg-red/10 text-red text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
          {COHORT.name} · Applications Open
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] max-w-3xl">
          Build production software.{" "}
          <span className="text-red">Grow as an engineer.</span>
        </h1>
        <p className="mt-6 max-w-xl text-muted text-lg">
          Nexora Labs is a software engineering internship — not a course, not a bootcamp.
          Claim a track, ship real tasks, pass your domain certification, and walk away with
          a certificate that means something.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/apply" className="btn-primary text-base">Apply Now →</Link>
          <Link to="/tracks" className="btn-secondary text-base">View Tracks</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          ["9 tracks", "Frontend to DevOps — pick the one you actually want to get good at."],
          ["Real tasks, real review", "Every submission is reviewed by hand. No auto-pass."],
          ["Certified, not just attended", "A 30-question domain exam and a certificate that's verifiable forever."],
        ].map(([title, body]) => (
          <div key={title} className="card p-6">
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-muted text-sm">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
