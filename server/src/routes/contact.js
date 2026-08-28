import { Router } from "express";
import { supabase } from "../supabaseClient.js";
import { makeId } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

function fail(res, error) {
  console.error("Supabase error on messages:", error.message);
  res.status(500).json({ error: "Database error. Please try again." });
}

// Public: send a contact message
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "name, email, subject and message are required" });
  }

  const entry = {
    id: makeId(),
    read: false,
    createdAt: new Date().toISOString(),
    name,
    email,
    subject,
    message,
  };
  const { data, error } = await supabase.from("messages").insert(entry).select().single();
  if (error) return fail(res, error);
  res.status(201).json({ ok: true, id: data.id });
});

// Admin: list all messages
router.get("/", requireAuth, async (_req, res) => {
  const { data, error } = await supabase.from("messages").select("*").order("createdAt", { ascending: false });
  if (error) return fail(res, error);
  res.json(data);
});

// Admin: mark read / update
router.put("/:id", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("messages").update(req.body).eq("id", req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

// Admin: delete a message
router.delete("/:id", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("messages").delete().eq("id", req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
