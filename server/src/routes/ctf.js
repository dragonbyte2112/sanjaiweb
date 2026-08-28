import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../supabaseClient.js";
import { makeId } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

function fail(res, error) {
  console.error("Supabase error on ctf:", error.message);
  res.status(500).json({ error: "Database error. Please try again." });
}

/** Strips the flag hash and attaches solve count, safe for public output. */
async function toPublicChallenge(challenge) {
  const { flagHash, ...safe } = challenge;
  const { count } = await supabase
    .from("solves")
    .select("id", { count: "exact", head: true })
    .eq("challengeId", challenge.id);
  return { ...safe, solvedCount: count || 0 };
}

// ── Public: list published challenges (no flags) ──
router.get("/challenges", async (_req, res) => {
  const { data, error } = await supabase.from("challenges").select("*").eq("published", true);
  if (error) return fail(res, error);
  const items = await Promise.all(data.map(toPublicChallenge));
  res.json(items);
});

// ── Public: leaderboard, aggregated from correct solves ──
router.get("/leaderboard", async (_req, res) => {
  const { data: solves, error } = await supabase.from("solves").select("*");
  if (error) return fail(res, error);

  const totals = new Map();
  for (const solve of solves) {
    const key = solve.handle.toLowerCase();
    const entry = totals.get(key) || { handle: solve.handle, points: 0, solves: 0, lastSolveAt: solve.createdAt };
    entry.points += solve.points;
    entry.solves += 1;
    if (solve.createdAt > entry.lastSolveAt) entry.lastSolveAt = solve.createdAt;
    totals.set(key, entry);
  }
  const leaderboard = Array.from(totals.values()).sort(
    (a, b) => b.points - a.points || new Date(a.lastSolveAt) - new Date(b.lastSolveAt),
  );
  res.json(leaderboard);
});

// ── Public: overall stats for the CTF landing page ──
router.get("/stats", async (_req, res) => {
  const { data: published, error: pubError } = await supabase.from("challenges").select("*").eq("published", true);
  if (pubError) return fail(res, pubError);
  const { data: solves, error: solveError } = await supabase.from("solves").select("challengeId");
  if (solveError) return fail(res, solveError);

  const categories = new Set(published.map((c) => c.category)).size;
  const solvedChallengeIds = new Set(solves.map((s) => s.challengeId));
  res.json({
    challenges: published.length,
    categories,
    totalPoints: published.reduce((sum, c) => sum + (c.points || 0), 0),
    solvedChallenges: solvedChallengeIds.size,
    totalSolves: solves.length,
  });
});

// ── Public: submit a flag ──
router.post("/submit", async (req, res) => {
  const { challengeId, handle, flag } = req.body || {};
  if (!challengeId || !handle || !flag) {
    return res.status(400).json({ error: "challengeId, handle and flag are required" });
  }

  const { data: challenge, error: chError } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("published", true)
    .maybeSingle();
  if (chError) return fail(res, chError);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const { data: existingSolve, error: solveCheckError } = await supabase
    .from("solves")
    .select("id")
    .eq("challengeId", challengeId)
    .ilike("handle", handle)
    .maybeSingle();
  if (solveCheckError) return fail(res, solveCheckError);
  if (existingSolve) {
    return res.status(409).json({ error: "You already solved this challenge" });
  }

  const correct = await bcrypt.compare(flag.trim(), challenge.flagHash);
  if (!correct) {
    return res.status(400).json({ error: "Incorrect flag" });
  }

  const solve = {
    id: makeId(),
    challengeId,
    handle,
    points: challenge.points || 0,
    createdAt: new Date().toISOString(),
  };
  const { error: insertError } = await supabase.from("solves").insert(solve);
  if (insertError) return fail(res, insertError);
  res.status(201).json({ ok: true, points: solve.points });
});

// ── Admin: full challenge list, including flag status (not the raw flag) ──
router.get("/challenges/admin/all", requireAuth, async (_req, res) => {
  const { data, error } = await supabase.from("challenges").select("*");
  if (error) return fail(res, error);
  const items = data.map(({ flagHash, ...rest }) => ({ ...rest, hasFlag: !!flagHash }));
  res.json(items);
});

// ── Admin: create a challenge ──
router.post("/challenges", requireAuth, async (req, res) => {
  const { flag, ...rest } = req.body || {};
  if (!rest.title || !flag) {
    return res.status(400).json({ error: "title and flag are required" });
  }
  const now = new Date().toISOString();
  const challenge = {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    ...rest,
    flagHash: await bcrypt.hash(String(flag).trim(), 10),
  };
  const { data, error } = await supabase.from("challenges").insert(challenge).select().single();
  if (error) return fail(res, error);
  const { flagHash, ...safe } = data;
  res.status(201).json(safe);
});

// ── Admin: update a challenge (flag optional — only re-hash if provided) ──
router.put("/challenges/:id", requireAuth, async (req, res) => {
  const { flag, id: _ignoredId, ...rest } = req.body || {};
  const updates = { ...rest, updatedAt: new Date().toISOString() };
  if (flag && String(flag).trim()) {
    updates.flagHash = await bcrypt.hash(String(flag).trim(), 10);
  }
  const { data, error } = await supabase.from("challenges").update(updates).eq("id", req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: "Not found" });
  const { flagHash, ...safe } = data;
  res.json(safe);
});

// ── Admin: delete a challenge (and its solves) ──
router.delete("/challenges/:id", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("challenges").delete().eq("id", req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: "Not found" });
  // solves.challengeId references challenges(id) on delete cascade, so no manual cleanup needed.
  res.status(204).end();
});

export default router;
