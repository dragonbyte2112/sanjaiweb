// =====================================================
// DragonByte API
// =====================================================

const API_TABLES = {
  "/events": "events",
  "/projects": "projects",
  "/contributors": "contributors",
  "/testimonials": "testimonials",
  "/teams": "teams",
  "/members": "members",

  // CTF
  "/ctf/challenges": "challenges"
};


// =====================================================
// Resolve API endpoint -> Supabase table
// =====================================================

function resolveTable(path) {

  // Direct match
  if (API_TABLES[path]) {
    return API_TABLES[path];
  }

  // Admin endpoint
  if (path.endsWith("/admin/all")) {

    const basePath = path.replace("/admin/all", "");

    if (API_TABLES[basePath]) {
      return API_TABLES[basePath];
    }
  }

  throw new Error(`Unknown API endpoint: ${path}`);
}


// =====================================================
// API
// =====================================================

const Api = {

  // ---------------------------------------------------
  // GET
  // ---------------------------------------------------

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


  // ---------------------------------------------------
  // POST
  // ---------------------------------------------------

  async post(path, body) {

    const table = resolveTable(path);

    console.log(
      `DragonByte API POST: ${path} -> ${table}`
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


  // ---------------------------------------------------
  // PUT
  // ---------------------------------------------------

  async put(path, body) {

    throw new Error(
      "PUT requires a record ID. Use Api.update(table, id, body)."
    );
  },


  // ---------------------------------------------------
  // UPDATE
  // ---------------------------------------------------

  async update(path, id, body) {

    const table = resolveTable(path);

    if (!id) {
      throw new Error("Record ID is required.");
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


  // ---------------------------------------------------
  // DELETE
  // ---------------------------------------------------

  async del(path, id) {

    const table = resolveTable(path);

    if (!id) {
      throw new Error("Record ID is required.");
    }

    console.log(
      `DragonByte API DELETE: ${table} -> ${id}`
    );

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .delete()
      .eq("id", id)
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


  // ---------------------------------------------------
  // LOGIN
  // ---------------------------------------------------

  async login(email, password) {

    if (!email || !password) {
      throw new Error(
        "Email and password are required."
      );
    }

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
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


  // ---------------------------------------------------
  // REGISTER
  // ---------------------------------------------------

  async register(email, password) {

    const {
      data,
      error
    } = await supabaseClient.auth.signUp({
      email: email.trim(),
      password
    });

    if (error) {
      throw error;
    }

    return data;
  },


  // ---------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------

  async isAuthed() {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {

      console.error(
        "Session check error:",
        error
      );

      return false;
    }

    return !!data.session;
  },


  // ---------------------------------------------------
  // CURRENT USER
  // ---------------------------------------------------

  async getUser() {

    const {
      data,
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  },


  // ---------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------

  async logout() {

    const {
      error
    } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    return true;
  }

};


// =====================================================
// Global API
// =====================================================

window.Api = Api;


// =====================================================
// HTML ESCAPE
// =====================================================

window.esc = function (value) {

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


console.log("DragonByte API loaded successfully.");