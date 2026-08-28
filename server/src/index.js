import { app, whenDbReady } from "./app.js";

const PORT = process.env.PORT || 4000;

whenDbReady().then(() => {
  app.listen(PORT, () => {
    console.log(`DragonByte API running at http://localhost:${PORT}`);
    if (typeof fetch !== "function") {
      console.warn(
        `⚠️  Running Node.js ${process.version} — no built-in fetch(). Some features need Node 18+. ` +
          "Update Node.js from https://nodejs.org.",
      );
    }
  });
});
