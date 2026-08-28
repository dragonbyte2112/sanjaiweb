import { Router } from "express";
import { supabase } from "../supabaseClient.js";
import { makeId } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

function fail(res, error) {
  console.error("Supabase error on joinRequests:", error.message);
  res.status(500).json({ error: "Database error. Please try again." });
}

// Public: submit a join application
router.post("/", async (req, res) => {
  const { name, email, username } = req.body || {};
  if (!name || !email || !username) {
    return res.status(400).json({ error: "name, email and username are required" });
  }

  const application = {
    id: makeId(),
    status: "pending", // pending | approved | rejected
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  const { data, error } = await supabase.from("joinRequests").insert(application).select().single();
  if (error) return fail(res, error);
  res.status(201).json({ ok: true, id: data.id });
});

// Admin: list all applications
router.get("/", requireAuth, async (_req, res) => {
  const { data, error } = await supabase.from("joinRequests").select("*").order("createdAt", { ascending: false });
  if (error) return fail(res, error);
  res.json(data);
});

// Admin: update status (e.g. approve/reject). Approving creates a member record.
router.put("/:id", requireAuth, async (req, res) => {
  const { data: updated, error } = await supabase
    .from("joinRequests")
    .update(req.body)
    .eq("id", req.params.id)
    .select()
    .maybeSingle();
  if (error) return fail(res, error);
  if (!updated) return res.status(404).json({ error: "Not found" });

  if (req.body.status === "approved") {
    const { data: existing } = await supabase.from("members").select("id").eq("email", updated.email).maybeSingle();
    if (!existing) {
      const { error: memberError } = await supabase.from("members").insert({
        id: makeId(),
        name: updated.name,
        email: updated.email,
        username: updated.username,
        skills: updated.skills || "",
        interests: updated.interests || [],
        joinedAt: new Date().toISOString(),
      });
      if (memberError) console.error("Failed to create member from approved join request:", memberError.message);
    }
  }

  res.json(updated);
});

// Admin: delete an application
router.delete("/:id", requireAuth, async (req, res) => {
  const { data, error } = await supabase.from("joinRequests").delete().eq("id", req.params.id).select().maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

export default router;
