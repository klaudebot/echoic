import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _admin: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Supabase admin client using service_role key.
 * Bypasses RLS — use ONLY in server-side API routes, never in client code.
 */
export function getSupabaseAdmin() {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  _admin = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _admin;
}
