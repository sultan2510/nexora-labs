import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [intern, setIntern] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      // No matter which page Supabase's redirect actually lands the user
      // on, if this is a password-recovery session, force them to the
      // set-password page. This makes the flow work even if the Supabase
      // dashboard's Redirect URL allow-list is misconfigured.
      if (event === "PASSWORD_RECOVERY") {
        navigate("/set-password", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) {
        setIntern(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [{ data: internRow }, { data: adminRow }] = await Promise.all([
        supabase.from("interns").select("*").eq("id", session.user.id).maybeSingle(),
        supabase.from("admins").select("*").eq("id", session.user.id).maybeSingle(),
      ]);
      setIntern(internRow || null);
      setIsAdmin(!!adminRow);
      setLoading(false);
    }
    if (session !== undefined) loadProfile();
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, intern, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}