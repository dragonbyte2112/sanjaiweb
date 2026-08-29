const SUPABASE_URL = "https://lfwwslohugqojibcpkys.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxmd3dzbG9odWdxb2ppYmNwa3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MTIzMDEsImV4cCI6MjEwMzQ4ODMwMX0.-TjfeMSsZLQv72DLbJJQ-NQ90r6j-cXzX4hPhlskAE0";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);