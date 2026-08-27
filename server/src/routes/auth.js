import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { signToken, requireAuth } from "../auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  await db.read();
  const admin = db.data.admin;
  if (!admin || admin.username !== username) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken({ username: admin.username });
  res.json({ token, username: admin.username });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.admin.username });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  await db.read();
  const admin = db.data.admin;
  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  await db.write();
  res.json({ ok: true });
});

export default router;
