import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [intern, setIntern] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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
