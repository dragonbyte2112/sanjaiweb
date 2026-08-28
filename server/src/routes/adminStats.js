import { Router } from "express";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/stats", requireAuth, async (_req, res) => {
  const [members, events, projects, joinRequests, messages, testimonials, challenges, solves] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("joinRequests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
    supabase.from("testimonials").select("id", { count: "exact", head: true }),
    supabase.from("challenges").select("id", { count: "exact", head: true }),
    supabase.from("solves").select("id", { count: "exact", head: true }),
  ]);

  const firstError = [members, events, projects, joinRequests, messages, testimonials, challenges, solves].find(
    (r) => r.error,
  );
  if (firstError) {
    console.error("Supabase error on adminStats:", firstError.error.message);
    return res.status(500).json({ error: "Database error. Please try again." });
  }

  res.json({
    members: members.count || 0,
    events: events.count || 0,
    projects: projects.count || 0,
    joinRequests: joinRequests.count || 0,
    messages: messages.count || 0,
    testimonials: testimonials.count || 0,
    challenges: challenges.count || 0,
    ctfSolves: solves.count || 0,
  });
});

export default router;
