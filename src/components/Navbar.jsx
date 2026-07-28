import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

const navLink = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive ? "text-red" : "text-muted hover:text-white"}`;

const mobileNavLink = ({ isActive }) =>
  `block py-3 text-base font-medium border-b border-border ${isActive ? "text-red" : "text-white"}`;

export default function Navbar() {
  const { session, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-bg/95 backdrop-blur sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <Logo size={34} />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" end className={navLink}>Home</NavLink>
          <NavLink to="/about" className={navLink}>About</NavLink>
          <NavLink to="/tracks" className={navLink}>Tracks</NavLink>
          <NavLink to="/contact" className={navLink}>Contact</NavLink>
          {isAdmin && <NavLink to="/admin" className={navLink}>Admin</NavLink>}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link to="/dashboard" className="btn-secondary !px-4 !py-2 text-sm">Dashboard</Link>
              <button onClick={() => supabase.auth.signOut()} className="text-sm text-muted hover:text-white">
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

        {/* Mobile hamburger toggle */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 w-9 h-9"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-6 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden border-t border-border px-6 py-2 bg-bg">
          <NavLink to="/" end className={mobileNavLink} onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/about" className={mobileNavLink} onClick={() => setMenuOpen(false)}>About</NavLink>
          <NavLink to="/tracks" className={mobileNavLink} onClick={() => setMenuOpen(false)}>Tracks</NavLink>
          <NavLink to="/contact" className={mobileNavLink} onClick={() => setMenuOpen(false)}>Contact</NavLink>
          {isAdmin && <NavLink to="/admin" className={mobileNavLink} onClick={() => setMenuOpen(false)}>Admin</NavLink>}

          <div className="py-4 flex flex-col gap-3">
            {session ? (
              <>
                <Link to="/dashboard" className="btn-secondary text-sm text-center" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button
                  onClick={() => { supabase.auth.signOut(); setMenuOpen(false); }}
                  className="text-sm text-muted hover:text-white"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-muted hover:text-white" onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>
                <Link to="/apply" className="btn-primary text-sm text-center" onClick={() => setMenuOpen(false)}>
                  Apply Now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}