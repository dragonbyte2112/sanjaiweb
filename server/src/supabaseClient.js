import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && serviceKey);

if (!isSupabaseConfigured) {
  console.error(
    "\n⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "   The server will start, but every page/API call will show a database error until this is fixed.\n" +
      "   1. Follow SUPABASE_SETUP.md to create a free Supabase project (5 min)\n" +
      "   2. Copy server/.env.example to server/.env if you haven't already\n" +
      "   3. Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env\n" +
      "   4. Restart the server (Ctrl+C, then npm run dev)\n",
  );
}

// Service role key bypasses Row Level Security — this client must only ever
// be used server-side (it never reaches the browser).
//
// A placeholder URL is used when unconfigured so the client can always be
// constructed without crashing the whole process — real requests will then
// fail with a clear, catchable connection error instead of a hard crash.
export const supabase = createClient(
  isSupabaseConfigured ? url : "https://not-configured.supabase.co",
  isSupabaseConfigured ? serviceKey : "not-configured",
  { auth: { persistSession: false } },
);
