import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/auth";

const link = ({ isActive }) =>
  `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive ? "bg-red/10 text-red" : "text-muted hover:text-white hover:bg-white/5"
  }`;

export default function DashboardLayout() {
  const { intern } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-6">
        <div className="card p-4">
          <p className="font-bold">{intern?.name}</p>
          <p className="text-xs text-muted">{intern?.domain}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted mb-1">INTERN ID</p>
          <p className="text-red font-bold text-sm">{intern?.intern_id}</p>
        </div>
        <nav className="space-y-1">
          <NavLink to="/dashboard" end className={link}>Overview</NavLink>
          <NavLink to="/dashboard/tasks" className={link}>Tasks</NavLink>
          <NavLink to="/dashboard/certificate" className={link}>Certificate</NavLink>
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
