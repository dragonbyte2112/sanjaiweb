// Drop-in replacement for assets/js/api.js, backed by Supabase instead of
// the Express server. Every page calls the same Api.get/post/put/del(...)
// methods — only this file's internals differ. See SUPABASE_SETUP.md.
//
// Load order in each .html file:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
//   <script src="/assets/js/supabase-config.js"></script>
//   <script src="/assets/js/supabase-client.js"></script>   <-- replaces api.js
//   <script src="/assets/js/layout.js"></script>

const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// camelCase JS field <-> snake_case Postgres column, only where they differ.
const FIELD_MAP = {
  events: { registrationUrl: "registration_url" },
  projects: { githubUrl: "github_url", demoUrl: "demo_url" },
};

function toDb(table, obj) {
  const map = FIELD_MAP[table];
  if (!map) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[map[k] || k] = v;
  return out;
}

function fromDb(table, obj) {
  const map = FIELD_MAP[table];
  if (!map || !obj) return obj;
  const reverse = Object.fromEntries(Object.entries(map).map(([a, b]) => [b, a]));
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[reverse[k] || k] = v;
  return out;
}

function fromDbList(table, list) {
  return (list || []).map((row) => fromDb(table, row));
}

// Simple path parsers
const ENTITY_TABLES = ["events", "projects", "contributors", "testimonials", "members"];
const PUBLISHED_TABLES = new Set(["events", "projects"]);
const APPROVED_TABLES = new Set(["testimonials"]);

function matchEntity(path) {
  for (const table of ENTITY_TABLES) {
    if (path === `/${table}`) return { table, mode: "public-list" };
    if (path === `/${table}/admin/all`) return { table, mode: "admin-list" };
    const m = path.match(new RegExp(`^/${table}/([^/]+)$`));
    if (m) return { table, mode: "item", id: m[1] };
  }
  return null;
}

const Api = {
  // ── session/token shims kept for API compatibility with pages that check them ──
  _session: null,

  async init() {
    const { data } = await supabase.auth.getSession();
    Api._session = data.session;
    supabase.auth.onAuthStateChange((_event, session) => {
      Api._session = session;
    });
    return Api._session;
  },

  isAuthed() {
    return !!Api._session;
  },

  async login(username, password) {
    // Supabase Auth requires an email — use the admin's email as the "username".
    const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
    if (error) throw new Error(error.message);
    Api._session = data.session;
    return data;
  },

  async logout() {
    await supabase.auth.signOut();
    Api._session = null;
  },

  // ── generic request router, mirrors the old fetch-based Api ──
  async get(path) {
    if (path === "/admin/stats") {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw new Error(error.message);
      return data;
    }
    if (path === "/ctf/challenges") {
      const { data, error } = await supabase.from("public_challenges").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map((c) => ({ ...c, solvedCount: c.solved_count }));
    }
    if (path === "/ctf/challenges/admin/all") {
      const { data, error } = await supabase.from("admin_challenges").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map((c) => ({ ...c, hasFlag: c.has_flag }));
    }
    if (path === "/ctf/leaderboard") {
      const { data, error } = await supabase.from("leaderboard").select("*");
      if (error) throw new Error(error.message);
      return (data || []).map((r) => ({ handle: r.handle, points: r.points, solves: r.solves, lastSolveAt: r.last_solve_at }));
    }
    if (path === "/ctf/stats") {
      const [{ data: pub, error: e1 }, { data: lb, error: e2 }] = await Promise.all([
        supabase.from("public_challenges").select("*"),
        supabase.from("leaderboard").select("*"),
      ]);
      if (e1) throw new Error(e1.message);
      if (e2) throw new Error(e2.message);
      const challenges = pub || [];
      return {
        challenges: challenges.length,
        categories: new Set(challenges.map((c) => c.category)).size,
        totalPoints: challenges.reduce((s, c) => s + (c.points || 0), 0),
        solvedChallenges: challenges.filter((c) => c.solved_count > 0).length,
        totalSolves: (lb || []).reduce((s, r) => s + Number(r.solves || 0), 0),
      };
    }
    if (path === "/join") {
      const { data, error } = await supabase.from("join_requests").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
    if (path === "/contact") {
      const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }

    const entity = matchEntity(path);
    if (entity && entity.mode !== "item") {
      let query = supabase.from(entity.table).select("*").order("created_at", { ascending: false });
      if (entity.mode === "public-list") {
        if (PUBLISHED_TABLES.has(entity.table)) query = query.eq("published", true);
        if (APPROVED_TABLES.has(entity.table)) query = query.eq("approved", true);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return fromDbList(entity.table, data);
    }

    throw new Error(`No Supabase mapping for GET ${path}`);
  },

  async post(path, body) {
    if (path === "/join") {
      const { error } = await supabase.from("join_requests").insert(body);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (path === "/contact") {
      const { error } = await supabase.from("messages").insert(body);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (path === "/ctf/submit") {
      const { data, error } = await supabase.rpc("submit_flag", {
        p_challenge_id: body.challengeId,
        p_handle: body.handle,
        p_flag: body.flag,
      });
      if (error) throw new Error(error.message);
      return { ok: true, points: data };
    }
    if (path === "/ctf/challenges") {
      const { data, error } = await supabase.rpc("admin_create_challenge", {
        p_title: body.title,
        p_description: body.description,
        p_category: body.category,
        p_difficulty: body.difficulty,
        p_points: body.points,
        p_flag: body.flag,
        p_published: body.published !== false,
      });
      if (error) throw new Error(error.message);
      return { id: data };
    }
    if (path === "/auth/change-password") {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Not signed in");
      // Re-authenticate with the current password before changing it.
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password: body.currentPassword,
      });
      if (reauthErr) throw new Error("Current password is incorrect");
      const { error } = await supabase.auth.updateUser({ password: body.newPassword });
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const entity = matchEntity(path);
    if (entity && entity.mode === "public-list") {
      const { data, error } = await supabase.from(entity.table).insert(toDb(entity.table, body)).select().single();
      if (error) throw new Error(error.message);
      return fromDb(entity.table, data);
    }

    throw new Error(`No Supabase mapping for POST ${path}`);
  },

  async put(path, body) {
    if (path.startsWith("/join/")) {
      const id = path.split("/")[2];
      if (body.status === "approved") {
        const { error } = await supabase.rpc("admin_approve_join_request", { p_id: id });
        if (error) throw new Error(error.message);
        return { ok: true };
      }
      const { error } = await supabase.from("join_requests").update(body).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (path.startsWith("/contact/")) {
      const id = path.split("/")[2];
      const { error } = await supabase.from("messages").update(body).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (path.startsWith("/ctf/challenges/")) {
      const id = path.split("/")[3];
      const { error } = await supabase.rpc("admin_update_challenge", {
        p_id: id,
        p_title: body.title,
        p_description: body.description,
        p_category: body.category,
        p_difficulty: body.difficulty,
        p_points: body.points,
        p_flag: body.flag || null,
        p_published: body.published !== false,
      });
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    const entity = matchEntity(path);
    if (entity && entity.mode === "item") {
      const { data, error } = await supabase
        .from(entity.table)
        .update(toDb(entity.table, body))
        .eq("id", entity.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return fromDb(entity.table, data);
    }

    throw new Error(`No Supabase mapping for PUT ${path}`);
  },

  async del(path) {
    if (path.startsWith("/join/")) {
      const id = path.split("/")[2];
      const { error } = await supabase.from("join_requests").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return null;
    }
    if (path.startsWith("/contact/")) {
      const id = path.split("/")[2];
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return null;
    }
    if (path.startsWith("/ctf/challenges/")) {
      const id = path.split("/")[3];
      const { error } = await supabase.from("challenges").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return null;
    }

    const entity = matchEntity(path);
    if (entity && entity.mode === "item") {
      const { error } = await supabase.from(entity.table).delete().eq("id", entity.id);
      if (error) throw new Error(error.message);
      return null;
    }

    throw new Error(`No Supabase mapping for DELETE ${path}`);
  },
};

function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
