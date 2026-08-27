import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, makeId } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

/** Strips the flag hash and returns solve count, safe for public output. */
function toPublicChallenge(challenge) {
  const { flagHash, ...safe } = challenge;
  const solvedCount = db.data.solves.filter((s) => s.challengeId === challenge.id).length;
  return { ...safe, solvedCount };
}

// ── Public: list published challenges (no flags) ──
router.get("/challenges", async (_req, res) => {
  await db.read();
  const items = db.data.challenges.filter((c) => c.published !== false).map(toPublicChallenge);
  res.json(items);
});

// ── Public: leaderboard, aggregated from correct solves ──
router.get("/leaderboard", async (_req, res) => {
  await db.read();
  const totals = new Map();
  for (const solve of db.data.solves) {
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
  await db.read();
  const published = db.data.challenges.filter((c) => c.published !== false);
  const categories = new Set(published.map((c) => c.category)).size;
  const solvedChallengeIds = new Set(db.data.solves.map((s) => s.challengeId));
  res.json({
    challenges: published.length,
    categories,
    totalPoints: published.reduce((sum, c) => sum + (c.points || 0), 0),
    solvedChallenges: solvedChallengeIds.size,
    totalSolves: db.data.solves.length,
  });
});

// ── Public: submit a flag ──
router.post("/submit", async (req, res) => {
  const { challengeId, handle, flag } = req.body || {};
  if (!challengeId || !handle || !flag) {
    return res.status(400).json({ error: "challengeId, handle and flag are required" });
  }

  await db.read();
  const challenge = db.data.challenges.find((c) => c.id === challengeId && c.published !== false);
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });

  const alreadySolved = db.data.solves.some(
    (s) => s.challengeId === challengeId && s.handle.toLowerCase() === handle.toLowerCase(),
  );
  if (alreadySolved) {
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
  db.data.solves.push(solve);
  await db.write();
  res.status(201).json({ ok: true, points: solve.points });
});

// ── Admin: full challenge list, including flag status (not the raw flag) ──
router.get("/challenges/admin/all", requireAuth, async (_req, res) => {
  await db.read();
  const items = db.data.challenges.map(({ flagHash, ...rest }) => ({ ...rest, hasFlag: !!flagHash }));
  res.json(items);
});

// ── Admin: create a challenge ──
router.post("/challenges", requireAuth, async (req, res) => {
  const { flag, ...rest } = req.body || {};
  if (!rest.title || !flag) {
    return res.status(400).json({ error: "title and flag are required" });
  }
  await db.read();
  const now = new Date().toISOString();
  const challenge = {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    ...rest,
    flagHash: await bcrypt.hash(String(flag).trim(), 10),
  };
  db.data.challenges.push(challenge);
  await db.write();
  const { flagHash, ...safe } = challenge;
  res.status(201).json(safe);
});

// ── Admin: update a challenge (flag optional — only re-hash if provided) ──
router.put("/challenges/:id", requireAuth, async (req, res) => {
  await db.read();
  const idx = db.data.challenges.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { flag, ...rest } = req.body || {};
  const updated = {
    ...db.data.challenges[idx],
    ...rest,
    id: db.data.challenges[idx].id,
    updatedAt: new Date().toISOString(),
  };
  if (flag && String(flag).trim()) {
    updated.flagHash = await bcrypt.hash(String(flag).trim(), 10);
  }
  db.data.challenges[idx] = updated;
  await db.write();
  const { flagHash, ...safe } = updated;
  res.json(safe);
});

// ── Admin: delete a challenge (and its solves) ──
router.delete("/challenges/:id", requireAuth, async (req, res) => {
  await db.read();
  const before = db.data.challenges.length;
  db.data.challenges = db.data.challenges.filter((c) => c.id !== req.params.id);
  if (db.data.challenges.length === before) {
    return res.status(404).json({ error: "Not found" });
  }
  db.data.solves = db.data.solves.filter((s) => s.challengeId !== req.params.id);
  await db.write();
  res.status(204).end();
});

export default router;
