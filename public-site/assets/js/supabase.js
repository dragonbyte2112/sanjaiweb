const SUPABASE_URL = "https://lfwwslohugqojibcpkys.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_4OBUm9wgJwRAqN9hi8QLOw_5WYgQcUG";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("DragonByte Supabase connected!");

window.esc = function (value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
};