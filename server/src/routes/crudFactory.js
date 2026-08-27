import { Router } from "express";
import { db, makeId, slugify } from "../db.js";
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
 * @param {string} collection   key in db.data, e.g. "events"
 * @param {object} opts
 * @param {(item: object) => boolean} [opts.publicFilter] filter applied to public GET list
 * @param {boolean} [opts.useSlug] generate a slug field from `title` or `name`
 */
export function crudFactory(collection, opts = {}) {
  const router = Router();
  const { publicFilter = () => true, useSlug = false } = opts;

  // Public: list
  router.get("/", async (req, res) => {
    await db.read();
    const items = db.data[collection].filter(publicFilter);
    res.json(items);
  });

  // Admin: unfiltered list (must be defined before "/:id")
  router.get("/admin/all", requireAuth, async (_req, res) => {
    await db.read();
    res.json(db.data[collection]);
  });

  // Public: single item by id or slug
  router.get("/:id", async (req, res) => {
    await db.read();
    const item = db.data[collection].find(
      (i) => i.id === req.params.id || i.slug === req.params.id,
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  });

  // Admin: create
  router.post("/", requireAuth, async (req, res) => {
    await db.read();
    const now = new Date().toISOString();
    const item = { id: makeId(), createdAt: now, updatedAt: now, ...req.body };
    if (useSlug && !item.slug) {
      const base = slugify(item.title || item.name || item.id);
      let slug = base;
      let n = 1;
      while (db.data[collection].some((i) => i.slug === slug)) {
        slug = `${base}-${n++}`;
      }
      item.slug = slug;
    }
    db.data[collection].push(item);
    await db.write();
    res.status(201).json(item);
  });

  // Admin: update
  router.put("/:id", requireAuth, async (req, res) => {
    await db.read();
    const idx = db.data[collection].findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.data[collection][idx] = {
      ...db.data[collection][idx],
      ...req.body,
      id: db.data[collection][idx].id,
      updatedAt: new Date().toISOString(),
    };
    await db.write();
    res.json(db.data[collection][idx]);
  });

  // Admin: delete
  router.delete("/:id", requireAuth, async (req, res) => {
    await db.read();
    const before = db.data[collection].length;
    db.data[collection] = db.data[collection].filter((i) => i.id !== req.params.id);
    if (db.data[collection].length === before) {
      return res.status(404).json({ error: "Not found" });
    }
    await db.write();
    res.status(204).end();
  });

  return router;
}
