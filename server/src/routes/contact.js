import { Router } from "express";
import { db, makeId } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// Public: send a contact message
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "name, email, subject and message are required" });
  }

  await db.read();
  const entry = {
    id: makeId(),
    read: false,
    createdAt: new Date().toISOString(),
    name,
    email,
    subject,
    message,
  };
  db.data.messages.push(entry);
  await db.write();
  res.status(201).json({ ok: true, id: entry.id });
});

// Admin: list all messages
router.get("/", requireAuth, async (_req, res) => {
  await db.read();
  res.json(db.data.messages);
});

// Admin: mark read / update
router.put("/:id", requireAuth, async (req, res) => {
  await db.read();
  const idx = db.data.messages.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  db.data.messages[idx] = { ...db.data.messages[idx], ...req.body };
  await db.write();
  res.json(db.data.messages[idx]);
});

// Admin: delete a message
router.delete("/:id", requireAuth, async (req, res) => {
  await db.read();
  const before = db.data.messages.length;
  db.data.messages = db.data.messages.filter((m) => m.id !== req.params.id);
  if (db.data.messages.length === before) {
    return res.status(404).json({ error: "Not found" });
  }
  await db.write();
  res.status(204).end();
});

export default router;
