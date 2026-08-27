import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import eventsRoutes from "./routes/events.js";
import projectsRoutes from "./routes/projects.js";
import contributorsRoutes from "./routes/contributors.js";
import testimonialsRoutes from "./routes/testimonials.js";
import membersRoutes from "./routes/members.js";
import joinRoutes from "./routes/join.js";
import contactRoutes from "./routes/contact.js";
import adminStatsRoutes from "./routes/adminStats.js";
import ctfRoutes from "./routes/ctf.js";
import assistantRoutes from "./routes/assistant.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticSiteDir = path.join(__dirname, "..", "..", "public-site");

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.CORS_ORIGIN || `http://localhost:${PORT}`)
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, cb) => {
      // No Origin header (same-origin requests, curl, server-to-server) -> always allow.
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/$/, "");
      // Always allow the server's own origin, regardless of .env config,
      // since the frontend is served from this same Express app.
      if (normalized === `http://localhost:${PORT}` || allowedOrigins.includes(normalized)) {
        return cb(null, true);
      }
      // Deny gracefully (no CORS headers) instead of throwing, so a
      // mismatched origin never surfaces as a confusing 500 error.
      return cb(null, false);
    },
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/contributors", contributorsRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/join", joinRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminStatsRoutes);
app.use("/api/ctf", ctfRoutes);
app.use("/api/assistant", assistantRoutes);

// Fallback 404 for unknown API routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Serve the plain HTML/CSS/JS frontend from the same origin.
app.use(express.static(staticSiteDir));

// Allow clean URLs without ".html" (e.g. /admin -> admin.html) to make
// the site forgiving of how people actually type addresses.
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (path.extname(req.path)) return next(); // already has an extension, let static/404 handle it

  const candidate = path.join(staticSiteDir, `${req.path}.html`);
  res.sendFile(candidate, (err) => {
    if (err) next();
  });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.status(404).sendFile(path.join(staticSiteDir, "404.html"), (err) => {
    if (err) res.status(404).send("Not found");
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`DragonByte API running at http://localhost:${PORT}`);
    if (typeof fetch !== "function") {
      console.warn(
        `⚠️  Running Node.js ${process.version} — no built-in fetch(). The AI assistant widget needs Node 18+. ` +
          "Update Node.js from https://nodejs.org to enable it.",
      );
    }
  });
});
