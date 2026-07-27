import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size={30} />
        <p className="text-sm text-muted text-center">
          Nexora Labs — build production software, grow as an engineer.
        </p>
        <div className="text-sm text-muted">team@nexoralabs.com</div>
      </div>
    </footer>
  );
}
