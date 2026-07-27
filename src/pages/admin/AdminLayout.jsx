import { NavLink, Outlet } from "react-router-dom";

const link = ({ isActive }) =>
  `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive ? "bg-red/10 text-red" : "text-muted hover:text-white hover:bg-white/5"
  }`;

export default function AdminLayout() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-1">
        <p className="text-xs font-bold tracking-widest text-muted px-4 mb-3">ADMIN</p>
        <NavLink to="/admin" end className={link}>Applications</NavLink>
        <NavLink to="/admin/submissions" className={link}>Submissions</NavLink>
        <NavLink to="/admin/payments" className={link}>Payments</NavLink>
        <NavLink to="/admin/quiz-results" className={link}>Quiz Results</NavLink>
        <NavLink to="/admin/certificates" className={link}>Certificates</NavLink>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
