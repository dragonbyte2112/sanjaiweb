import { Router } from "express";
import { db, makeId } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Public: submit a join application
router.post("/", async (req, res) => {
  const { name, email, username } = req.body || {};
  if (!name || !email || !username) {
    return res.status(400).json({ error: "name, email and username are required" });
  }

  await db.read();
  const application = {
    id: makeId(),
    status: "pending", // pending | approved | rejected
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  db.data.joinRequests.push(application);
  await db.write();
  res.status(201).json({ ok: true, id: application.id });
});

// Admin: list all applications
router.get("/", requireAuth, async (_req, res) => {
  await db.read();
  res.json(db.data.joinRequests);
});

// Admin: update status (e.g. approve/reject). Approving creates a member record.
router.put("/:id", requireAuth, async (req, res) => {
  await db.read();
  const idx = db.data.joinRequests.findIndex((j) => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const updated = { ...db.data.joinRequests[idx], ...req.body };
  db.data.joinRequests[idx] = updated;

  if (req.body.status === "approved") {
    const alreadyMember = db.data.members.some((m) => m.email === updated.email);
    if (!alreadyMember) {
      db.data.members.push({
        id: makeId(),
        name: updated.name,
        email: updated.email,
        username: updated.username,
        skills: updated.skills || "",
        interests: updated.interests || [],
        joinedAt: new Date().toISOString(),
      });
    }
  }

  await db.write();
  res.json(updated);
});

// Admin: delete an application
router.delete("/:id", requireAuth, async (req, res) => {
  await db.read();
  const before = db.data.joinRequests.length;
  db.data.joinRequests = db.data.joinRequests.filter((j) => j.id !== req.params.id);
  if (db.data.joinRequests.length === before) {
    return res.status(404).json({ error: "Not found" });
  }
  await db.write();
  res.status(204).end();
});

export default router;
