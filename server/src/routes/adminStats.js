import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/stats", requireAuth, async (_req, res) => {
  await db.read();
  const d = db.data;
  res.json({
    members: d.members.length,
    events: d.events.length,
    projects: d.projects.length,
    joinRequests: d.joinRequests.filter((j) => j.status === "pending").length,
    messages: d.messages.filter((m) => !m.read).length,
    testimonials: d.testimonials.length,
    challenges: d.challenges.length,
    ctfSolves: d.solves.length,
  });
});

export default router;
