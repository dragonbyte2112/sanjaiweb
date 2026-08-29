const API_TABLES = {
  "/events": "events",
  "/projects": "projects",
  "/contributors": "contributors",
  "/testimonials": "testimonials",
  "/teams": "teams",
  "/members": "members"
};


const Api = {

  // =====================================================
  // LOGIN
  // =====================================================

  async login(email, password) {

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

    if (error) {
      console.error("Supabase login error:", error);
      throw error;
    }

    return data;
  },


  // =====================================================
  // REGISTER
  // =====================================================

  async register(email, password) {

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const { data, error } =
      await supabaseClient.auth.signUp({
        email: email.trim(),
        password: password
      });

    if (error) {
      console.error("Supabase registration error:", error);
      throw error;
    }

    return data;
  },


  // =====================================================
  // GET
  // =====================================================

  async get(path) {

    const table = API_TABLES[path];

    if (!table) {
      throw new Error(`Unknown API endpoint: ${path}`);
    }

    const { data, error } =
      await supabaseClient
        .from(table)
        .select("*");

    if (error) {
      console.error(
        `Supabase error (${table}):`,
        error
      );

      throw error;
    }

    return data || [];
  },


  // =====================================================
  // POST
  // =====================================================

  async post(path, body) {

    const table = API_TABLES[path];

    if (!table) {
      throw new Error(`Unknown API endpoint: ${path}`);
    }

    const { data, error } =
      await supabaseClient
        .from(table)
        .insert(body)
        .select();

    if (error) {
      console.error(
        `Supabase insert error (${table}):`,
        error
      );

      throw error;
    }

    return data || [];
  },


  // =====================================================
  // PUT
  // =====================================================

  async put(path, body) {

    throw new Error(
      "PUT endpoint needs to be configured with the table ID."
    );

  },


  // =====================================================
  // DELETE
  // =====================================================

  async del(path) {

    throw new Error(
      "DELETE endpoint needs to be configured with the table ID."
    );

  },


  // =====================================================
  // CHECK AUTHENTICATION
  // =====================================================

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


  // =====================================================
  // GET CURRENT USER
  // =====================================================

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


  // =====================================================
  // LOGOUT
  // =====================================================

  async logout() {

    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      console.error(
        "Logout error:",
        error
      );

      throw error;
    }

    return true;

  }

};


// =======================================================
// MAKE API AVAILABLE EVERYWHERE
// =======================================================

window.Api = Api;


// =======================================================
// HTML ESCAPE
// =======================================================

window.esc = function (str) {

  if (
    str === null ||
    str === undefined
  ) {
    return "";
  }

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

};


console.log("DragonByte API ready!");