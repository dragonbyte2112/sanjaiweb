// =====================================================
// DragonByte API
// Supabase-powered frontend API wrapper
// =====================================================

// -----------------------------------------------------
// SUPABASE CLIENT CHECK
// -----------------------------------------------------

if (typeof supabaseClient === "undefined") {
  console.error(
    "DragonByte API Error: supabaseClient is not defined."
  );
}

// =====================================================
// API TABLE MAP
// =====================================================

const API_TABLES = {
  "/events": "events",
  "/projects": "projects",
  "/contributors": "contributors",
  "/testimonials": "testimonials",
  "/teams": "teams",
  "/members": "members",

  // Join requests
  "/join": "join_requests",

  // Contact messages
  "/contact": "contact_messages",

  // CTF
  "/ctf/challenges": "challenges"
};

// =====================================================
// NORMALIZE PATH
// =====================================================

function normalizePath(path) {
  if (!path) {
    throw new Error("API path is required.");
  }

  let normalized = String(path).trim();

  // Remove trailing slash
  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized;
}

// =====================================================
// RESOLVE API ENDPOINT -> SUPABASE TABLE
// =====================================================

function resolveTable(path) {
  path = normalizePath(path);

  // -----------------------------------------------
  // Direct endpoint
  // -----------------------------------------------

  if (API_TABLES[path]) {
    return API_TABLES[path];
  }

  // -----------------------------------------------
  // Admin all endpoint
  //
  // Example:
  // /events/admin/all
  // /projects/admin/all
  // /members/admin/all
  // -----------------------------------------------

  if (path.endsWith("/admin/all")) {
    const basePath = path.replace("/admin/all", "");

    if (API_TABLES[basePath]) {
      return API_TABLES[basePath];
    }
  }

  // -----------------------------------------------
  // ID endpoint
  //
  // Example:
  // /events/123
  // /projects/123
  // /members/123
  // -----------------------------------------------

  const parts = path.split("/").filter(Boolean);

  if (parts.length >= 2) {
    const basePath = "/" + parts[0];

    // CTF is special because it has multiple path parts
    if (path.startsWith("/ctf/challenges/")) {
      return "challenges";
    }

    if (API_TABLES[basePath]) {
      return API_TABLES[basePath];
    }
  }

  // -----------------------------------------------
  // Unknown endpoint
  // -----------------------------------------------

  throw new Error(`Unknown API endpoint: ${path}`);
}

// =====================================================
// GET RECORD ID FROM PATH
// =====================================================

function getIdFromPath(path) {
  const normalized = normalizePath(path);

  const parts = normalized.split("/").filter(Boolean);

  if (!parts.length) {
    return null;
  }

  // -----------------------------------------------
  // CTF
  //
  // /ctf/challenges/123
  // -----------------------------------------------

  if (
    parts[0] === "ctf" &&
    parts[1] === "challenges" &&
    parts[2]
  ) {
    return parts[2];
  }

  // -----------------------------------------------
  // Normal
  //
  // /events/123
  // /members/123
  // -----------------------------------------------

  if (parts.length >= 2) {
    const last = parts[parts.length - 1];

    if (
      last !== "admin" &&
      last !== "all"
    ) {
      return last;
    }
  }

  return null;
}

// =====================================================
// API OBJECT
// =====================================================

const Api = {

  // ===================================================
  // INIT
  // ===================================================

  async init() {
    if (
      typeof supabaseClient === "undefined" ||
      !supabaseClient
    ) {
      throw new Error(
        "Supabase client is not initialized."
      );
    }

    try {
      const {
        data,
        error
      } = await supabaseClient.auth.getSession();

      if (error) {
        console.error(
          "Supabase session initialization error:",
          error
        );

        return false;
      }

      console.log(
        "DragonByte API initialized successfully."
      );

      return !!data.session;

    } catch (error) {
      console.error(
        "DragonByte API init error:",
        error
      );

      return false;
    }
  },

  // ===================================================
  // GET
  // ===================================================

  async get(path) {

    const table = resolveTable(path);

    console.log(
      `DragonByte API GET: ${path} -> ${table}`
    );

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .select("*");

    if (error) {

      console.error(
        `Supabase GET error (${table}):`,
        error
      );

      throw error;
    }

    return data || [];
  },

  // ===================================================
  // GET SINGLE RECORD
  // ===================================================

  async getById(path, id) {

    const table = resolveTable(path);

    if (!id) {
      throw new Error(
        "Record ID is required."
      );
    }

    console.log(
      `DragonByte API GET BY ID: ${table} -> ${id}`
    );

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {

      console.error(
        `Supabase GET BY ID error (${table}):`,
        error
      );

      throw error;
    }

    return data;
  },

  // ===================================================
  // POST
  // ===================================================

  async post(path, body = {}) {

    const normalizedPath = normalizePath(path);

    // -----------------------------------------------
    // Change password is not a database insert
    // -----------------------------------------------

    if (
      normalizedPath ===
      "/auth/change-password"
    ) {
      return await this.changePassword(
        body.currentPassword,
        body.newPassword
      );
    }

    const table = resolveTable(
      normalizedPath
    );

    console.log(
      `DragonByte API POST: ${normalizedPath} -> ${table}`
    );

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .insert(body)
      .select();

    if (error) {

      console.error(
        `Supabase POST error (${table}):`,
        error
      );

      throw error;
    }

    return data || [];
  },

  // ===================================================
  // PUT
  //
  // Supports BOTH:
  //
  // Api.put("/events/123", body)
  //
  // and
  //
  // Api.put("/events", body)
  // ===================================================

  async put(path, body = {}) {

    const normalizedPath =
      normalizePath(path);

    const table =
      resolveTable(normalizedPath);

    const id =
      getIdFromPath(normalizedPath);

    if (!id) {

      throw new Error(
        "PUT requires a record ID. Example: Api.put('/events/123', body)"
      );
    }

    console.log(
      `DragonByte API PUT: ${table} -> ${id}`
    );

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .update(body)
      .eq("id", id)
      .select();

    if (error) {

      console.error(
        `Supabase PUT error (${table}):`,
        error
      );

      throw error;
    }

    return data || [];
  },

  // ===================================================
  // UPDATE
  //
  // Explicit version:
  //
  // Api.update("/events", id, body)
  // ===================================================

  async update(path, id, body = {}) {

    const table =
      resolveTable(path);

    if (!id) {
      throw new Error(
        "Record ID is required."
      );
    }

    console.log(
      `DragonByte API UPDATE: ${table} -> ${id}`
    );

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .update(body)
      .eq("id", id)
      .select();

    if (error) {

      console.error(
        `Supabase UPDATE error (${table}):`,
        error
      );

      throw error;
    }

    return data || [];
  },

  // ===================================================
  // DELETE
  //
  // Supports:
  //
  // Api.del("/events/123")
  //
  // OR
  //
  // Api.del("/events", "123")
  // ===================================================

  async del(path, id = null) {

    let normalizedPath =
      normalizePath(path);

    let table;
    let recordId;

    // -----------------------------------------------
    // If ID is supplied separately
    // -----------------------------------------------

    if (id) {

      table =
        resolveTable(normalizedPath);

      recordId = id;

    } else {

      // ---------------------------------------------
      // Otherwise ID comes from path
      // ---------------------------------------------

      table =
        resolveTable(normalizedPath);

      recordId =
        getIdFromPath(normalizedPath);
    }

    if (!recordId) {

      throw new Error(
        "Record ID is required for DELETE."
      );
    }

    console.log(
      `DragonByte API DELETE: ${table} -> ${recordId}`
    );

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .delete()
      .eq("id", recordId)
      .select();

    if (error) {

      console.error(
        `Supabase DELETE error (${table}):`,
        error
      );

      throw error;
    }

    return data || [];
  },

  // ===================================================
  // LOGIN
  // ===================================================

  async login(email, password) {

    if (!email || !password) {

      throw new Error(
        "Email and password are required."
      );
    }

    console.log(
      `DragonByte login: ${email.trim()}`
    );

    const {
      data,
      error
    } = await supabaseClient.auth
      .signInWithPassword({
        email: email.trim(),
        password
      });

    if (error) {

      console.error(
        "Supabase login error:",
        error
      );

      throw error;
    }

    return data;
  },

  // ===================================================
  // REGISTER
  // ===================================================

  async register(email, password) {

    if (!email || !password) {

      throw new Error(
        "Email and password are required."
      );
    }

    const {
      data,
      error
    } = await supabaseClient.auth
      .signUp({
        email: email.trim(),
        password
      });

    if (error) {

      console.error(
        "Supabase registration error:",
        error
      );

      throw error;
    }

    return data;
  },

  // ===================================================
  // AUTH CHECK
  // ===================================================

  async isAuthed() {

    try {

      const {
        data,
        error
      } = await supabaseClient.auth
        .getSession();

      if (error) {

        console.error(
          "Session check error:",
          error
        );

        return false;
      }

      return !!data.session;

    } catch (error) {

      console.error(
        "Auth check error:",
        error
      );

      return false;
    }
  },

  // ===================================================
  // CURRENT USER
  // ===================================================

  async getUser() {

    try {

      const {
        data,
        error
      } = await supabaseClient.auth
        .getUser();

      if (error) {

        console.error(
          "Get user error:",
          error
        );

        return null;
      }

      return data.user || null;

    } catch (error) {

      console.error(
        "Get user exception:",
        error
      );

      return null;
    }
  },

  // ===================================================
  // LOGOUT
  // ===================================================

  async logout() {

    const {
      error
    } = await supabaseClient.auth
      .signOut();

    if (error) {

      console.error(
        "Supabase logout error:",
        error
      );

      throw error;
    }

    return true;
  },

  // ===================================================
  // CHANGE PASSWORD
  // ===================================================

  async changePassword(
    currentPassword,
    newPassword
  ) {

    if (!newPassword) {

      throw new Error(
        "New password is required."
      );
    }

    if (newPassword.length < 6) {

      throw new Error(
        "New password must be at least 6 characters."
      );
    }

    // -----------------------------------------------
    // Get currently authenticated user
    // -----------------------------------------------

    const {
      data: userData,
      error: userError
    } = await supabaseClient.auth
      .getUser();

    if (userError || !userData.user) {

      throw new Error(
        "You must be logged in to change your password."
      );
    }

    // -----------------------------------------------
    // Re-authenticate when current password supplied
    // -----------------------------------------------

    if (currentPassword) {

      const email =
        userData.user.email;

      if (!email) {

        throw new Error(
          "Authenticated user does not have an email."
        );
      }

      const {
        error: loginError
      } = await supabaseClient.auth
        .signInWithPassword({
          email,
          password: currentPassword
        });

      if (loginError) {

        console.error(
          "Current password verification failed:",
          loginError
        );

        throw new Error(
          "Current password is incorrect."
        );
      }
    }

    // -----------------------------------------------
    // Update password
    // -----------------------------------------------

    const {
      data,
      error
    } = await supabaseClient.auth
      .updateUser({
        password: newPassword
      });

    if (error) {

      console.error(
        "Supabase password update error:",
        error
      );

      throw error;
    }

    return data;
  },

  // ===================================================
  // ADMIN DASHBOARD STATS
  // ===================================================

  async getAdminStats() {

    console.log(
      "DragonByte API: Loading admin statistics"
    );

    try {

      const [
        members,
        events,
        projects,
        testimonials,
        challenges,
        joinRequests,
        messages
      ] = await Promise.all([

        this.get("/members"),

        this.get("/events"),

        this.get("/projects"),

        this.get("/testimonials"),

        this.get("/ctf/challenges"),

        this.get("/join"),

        this.get("/contact")

      ]);

      const pendingJoinRequests =
        joinRequests.filter(
          (item) =>
            item.status === "pending"
        ).length;

      const unreadMessages =
        messages.filter(
          (item) =>
            item.read !== true
        ).length;

      // ---------------------------------------------
      // Try to calculate solves if table exists
      // ---------------------------------------------

      let ctfSolves = 0;

      try {

        const {
          data,
          error
        } = await supabaseClient
          .from("challenge_solves")
          .select("id");

        if (!error && data) {
          ctfSolves = data.length;
        }

      } catch (solveError) {

        console.warn(
          "CTF solves table unavailable:",
          solveError
        );

        ctfSolves = 0;
      }

      return {

        members:
          members.length,

        events:
          events.length,

        projects:
          projects.length,

        testimonials:
          testimonials.length,

        challenges:
          challenges.length,

        joinRequests:
          pendingJoinRequests,

        messages:
          unreadMessages,

        ctfSolves:
          ctfSolves
      };

    } catch (error) {

      console.error(
        "Admin statistics error:",
        error
      );

      throw error;
    }
  },

  // ===================================================
  // GENERIC ADMIN GET
  //
  // This allows:
  //
  // Api.get("/admin/stats")
  //
  // ===================================================

  async adminGet(path) {

    const normalizedPath =
      normalizePath(path);

    if (
      normalizedPath ===
      "/admin/stats"
    ) {

      return await this.getAdminStats();
    }

    throw new Error(
      `Unknown admin endpoint: ${normalizedPath}`
    );
  }

};

// =====================================================
// WRAP ORIGINAL GET FOR ADMIN STATS
// =====================================================

const originalApiGet =
  Api.get.bind(Api);

Api.get = async function(path) {

  const normalizedPath =
    normalizePath(path);

  // -----------------------------------------------
  // Special admin endpoint
  // -----------------------------------------------

  if (
    normalizedPath ===
    "/admin/stats"
  ) {

    return await Api.getAdminStats();
  }

  // -----------------------------------------------
  // Normal GET
  // -----------------------------------------------

  return await originalApiGet(
    normalizedPath
  );
};

// =====================================================
// GLOBAL API
// =====================================================

window.Api = Api;

// =====================================================
// HTML ESCAPE
// =====================================================

window.esc = function(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// =====================================================
// DEBUG INFORMATION
// =====================================================

console.log(
  "DragonByte API loaded successfully."
);

console.log(
  "Available API tables:",
  API_TABLES
);