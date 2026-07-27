import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file from anything in /src — the service
// role key bypasses Row Level Security entirely. It must only ever run
// inside /api functions (Vercel serverless, Node runtime).
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Verifies the caller's JWT (sent as "Authorization: Bearer <token>" from
// the frontend) and returns the Supabase auth user, or null if invalid.
export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user;
}
