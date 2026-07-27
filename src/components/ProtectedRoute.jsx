import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function RequireIntern({ children }) {
  const { session, loading } = useAuth();
  if (session === undefined || loading) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { session, isAdmin, loading } = useAuth();
  if (session === undefined || loading) return <Loading />;
  if (!session || !isAdmin) return <Navigate to="/login" replace />;
  return children;
}

function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-muted">
      Loading…
    </div>
  );
}
