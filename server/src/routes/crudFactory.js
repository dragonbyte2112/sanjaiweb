import { Router } from "express";
import { supabase } from "../supabaseClient.js";
import { makeId, slugify } from "../db.js";
import { requireAuth } from "../auth.js";

/**
 * Builds a router with:
 *   GET    /            -> public list (optionally filtered)
 *   GET    /:id         -> public single item, by id OR slug
 *   POST   /             -> admin create
 *   PUT    /:id          -> admin update
 *   DELETE /:id          -> admin delete
 *   GET    /admin/all     -> admin list (unfiltered)
 *
 * @param {string} table   Supabase table name, e.g. "events"
 * @param {object} opts
 * @param {object} [opts.publicMatch] equality filters applied to the public GET list (Supabase .match() shape)
 * @param {boolean} [opts.useSlug] generate a slug field from `title` or `name`
 */
export function crudFactory(table, opts = {}) {
  const router = Router();
  const { publicMatch = {}, useSlug = false } = opts;

  function fail(res, error, fallbackStatus = 500) {
    console.error(`Supabase error on "${table}":`, error.message);
    res.status(fallbackStatus).json({ error: "Database error. Please try again." });
  }

  // Public: list
  router.get("/", async (req, res) => {
    let query = supabase.from(table).select("*");
    for (const [key, value] of Object.entries(publicMatch)) query = query.eq(key, value);
    const { data, error } = await query.order("createdAt", { ascending: false });
    if (error) return fail(res, error);
    res.json(data);
  });

  // Admin: unfiltered list (must be defined before "/:id")
  router.get("/admin/all", requireAuth, async (_req, res) => {
    const { data, error } = await supabase.from(table).select("*").order("createdAt", { ascending: false });
    if (error) return fail(res, error);
    res.json(data);
  });

  // Public: single item by id or slug
  router.get("/:id", async (req, res) => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .or(`id.eq.${req.params.id},slug.eq.${req.params.id}`)
      .maybeSingle();
    if (error) return fail(res, error);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  });

  // Admin: create
  router.post("/", requireAuth, async (req, res) => {
    const now = new Date().toISOString();
    const item = { id: makeId(), createdAt: now, updatedAt: now, ...req.body };

    if (useSlug && !item.slug) {
      const base = slugify(item.title || item.name || item.id);
      let slug = base;
      let n = 1;
      // Keep trying until we find a slug that isn't taken yet.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data: clash } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
        if (!clash) break;
        slug = `${base}-${n++}`;
      }
      item.slug = slug;
    }

    const { data, error } = await supabase.from(table).insert(item).select().single();
    if (error) return fail(res, error);
    res.status(201).json(data);
  });

  // Admin: update
  router.put("/:id", requireAuth, async (req, res) => {
    const { id: _ignoredId, ...rest } = req.body || {};
    const updates = { ...rest, updatedAt: new Date().toISOString() };
    const { data, error } = await supabase.from(table).update(updates).eq("id", req.params.id).select().maybeSingle();
    if (error) return fail(res, error);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  });

  // Admin: delete
  router.delete("/:id", requireAuth, async (req, res) => {
    const { data, error } = await supabase.from(table).delete().eq("id", req.params.id).select().maybeSingle();
    if (error) return fail(res, error);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  return router;
}
