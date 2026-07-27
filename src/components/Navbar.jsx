import { Link, NavLink } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

const navLink = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? "text-red" : "text-muted hover:text-white"}`;

export default function Navbar() {
  const { session, isAdmin } = useAuth();

  return (
    <header className="border-b border-border bg-bg/95 backdrop-blur sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/">
          <Logo size={34} />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" end className={navLink}>Home</NavLink>
          <NavLink to="/about" className={navLink}>About</NavLink>
          <NavLink to="/tracks" className={navLink}>Tracks</NavLink>
          <NavLink to="/contact" className={navLink}>Contact</NavLink>
          {isAdmin && <NavLink to="/admin" className={navLink}>Admin</NavLink>}
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link to="/dashboard" className="btn-secondary !px-4 !py-2 text-sm">Dashboard</Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-muted hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted hover:text-white">Log in</Link>
              <Link to="/apply" className="btn-primary !px-4 !py-2 text-sm">Apply Now</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
