import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../supabaseClient.js";
import { signToken, requireAuth } from "../auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const { data: admin, error } = await supabase.from("admin").select("*").eq("id", "main").maybeSingle();
  if (error) {
    console.error("Supabase error on login:", error.message);
    return res.status(500).json({ error: "Database error. Please try again." });
  }
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

  const { data: admin, error: readError } = await supabase.from("admin").select("*").eq("id", "main").maybeSingle();
  if (readError || !admin) {
    return res.status(500).json({ error: "Database error. Please try again." });
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  const { error: writeError } = await supabase.from("admin").update({ passwordHash: newHash }).eq("id", "main");
  if (writeError) {
    return res.status(500).json({ error: "Database error. Please try again." });
  }
  res.json({ ok: true });
});

export default router;
