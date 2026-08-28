const SUPABASE_URL = "https://lfwwslohugqojibcpkys.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_4OBUm9wgJwRAqN9hi8QLOw_5WYgQcUG";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("DragonByte Supabase connected!");
// Escape HTML to safely display Supabase data
function esc(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}