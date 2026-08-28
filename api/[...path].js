// Vercel serverless entry point. The filename "[...path].js" makes this a
// catch-all route: every request under /api/* (e.g. /api/events,
// /api/auth/login, /api/ctf/submit) is forwarded here by Vercel, and Express
// handles the routing internally exactly like it already does locally —
// this file is just a thin adapter, not a rewrite of any logic.
//
// Note: this deliberately does NOT wait for the one-time admin/seed check
// (see app.js) before handling a request — if Supabase were ever slow or
// unreachable, waiting here would make every single request hang until it
// times out, instead of just the requests that actually touch the database.
import { app } from "../server/src/app.js";

export default function handler(req, res) {
  return app(req, res);
}
