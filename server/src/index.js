import { app } from "./app.js";

const PORT = process.env.PORT || 4000;

// Start immediately — never block server startup on the database check.
// If Supabase is slow, unreachable, or not configured yet, the server still
// comes up right away; only the specific requests that need the database
// will show an error until it's fixed.
app.listen(PORT, () => {
  console.log(`DragonByte API running at http://localhost:${PORT}`);
  if (typeof fetch !== "function") {
    console.warn(
      `⚠️  Running Node.js ${process.version} — no built-in fetch(). Some features need Node 18+. ` +
        "Update Node.js from https://nodejs.org.",
    );
  }
});
