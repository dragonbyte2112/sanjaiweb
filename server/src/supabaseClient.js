import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
      "Set these in server/.env (local) or your Vercel project's Environment Variables (deployed). " +
      "See SUPABASE_SETUP.md for how to get them.",
  );
}

// Service role key bypasses Row Level Security — this client must only ever
// be used server-side (it never reaches the browser).
export const supabase = createClient(url || "", serviceKey || "", {
  auth: { persistSession: false },
});
