export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <p className="text-red text-sm font-semibold tracking-widest mb-4">OUR PURPOSE</p>
      <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
        We exist to close the gap between learning to code and learning to ship.
      </h1>
      <p className="text-muted text-lg mb-16">
        Most people finish a course knowing syntax. Very few finish knowing how to take a task
        from nothing to reviewed, working, and shipped. Nexora Labs is built for that gap.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[
          ["Bias for shipping", "Working software beats a perfect writeup. Build, submit, get reviewed, iterate."],
          ["Radical ownership", "You own your track end-to-end. You write it, you submit it, you defend it."],
          ["Real certification", "A domain exam and a certificate that's actually verifiable — not a participation badge."],
        ].map(([title, body]) => (
          <div key={title} className="card p-6">
            <h3 className="font-bold mb-2">{title}</h3>
            <p className="text-muted text-sm">{body}</p>
          </div>
        ))}
      </div>

      <div className="card p-8">
        <p className="text-sm text-muted mb-1">Founded by</p>
        <div className="flex flex-col sm:flex-row gap-8 mt-4">
          <div>
            <p className="font-bold text-lg">Malik Sultan Ali</p>
            <p className="text-red text-sm">Founder</p>
          </div>
          <div>
            <p className="font-bold text-lg">Ahmed Shaheer</p>
            <p className="text-red text-sm">CEO</p>
          </div>
        </div>
      </div>
    </div>
  );
}
