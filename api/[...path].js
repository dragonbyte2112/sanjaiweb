// Vercel serverless entry point. The filename "[...path].js" makes this a
// catch-all route: every request under /api/* (e.g. /api/events,
// /api/auth/login, /api/ctf/submit) is forwarded here by Vercel, and Express
// handles the routing internally exactly like it already does locally —
// this file is just a thin adapter, not a rewrite of any logic.
import { app, whenDbReady } from "../server/src/app.js";

export default async function handler(req, res) {
  await whenDbReady();
  return app(req, res);
}
