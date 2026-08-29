/* =========================================================
   DragonByte - Supabase + Admin API
   ========================================================= */

const SUPABASE_URL =
  "https://lfwwslohugqojibcpkys.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_4OBUm9wgJwRAqN9hi8QLOw_5WYgQcUG";

/* ---------------------------------------------------------
   Supabase client
   --------------------------------------------------------- */

if (!window.supabase) {
  console.error(
    "DragonByte: Supabase library was not loaded."
  );
} else {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log(
    "DragonByte: Supabase connected!"
  );
}


/* ---------------------------------------------------------
   HTML escaping
   --------------------------------------------------------- */

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


/* ---------------------------------------------------------
   API endpoint -> Supabase table
   --------------------------------------------------------- */

const API_TABLES = {

  /* Public pages */
  "/events": "events",
  "/projects": "projects",
  "/contributors": "contributors",
  "/testimonials": "testimonials",
  "/teams": "teams",

  /* Admin members */
  "/members": "members",
  "/members/admin/all": "members",

  /* Admin CTF */
  "/ctf/challenges": "ctf_challenges",
  "/ctf/challenges/admin/all": "ctf_challenges",

  /* Admin requests */
  "/requests": "join_requests",
  "/join-requests": "join_requests",
  "/requests/admin/all": "join_requests",

  /* Admin messages */
  "/messages": "messages",
  "/messages/admin/all": "messages",

  /* Other possible admin tables */
  "/blogs": "blogs",
  "/resources": "resources",
  "/workshops": "workshops"
};


/* ---------------------------------------------------------
   Helper
   --------------------------------------------------------- */

function getTable(path) {

  const table = API_TABLES[path];

  if (!table) {
    throw new Error(
      `Unknown API endpoint: ${path}`
    );
  }

  return table;
}


/* ---------------------------------------------------------
   Admin API
   --------------------------------------------------------- */

const Api = {

  /* =======================================================
     GET
     ======================================================= */

  async get(path) {

    /* Dashboard statistics */
    if (path === "/admin/stats") {
      return await this.getStats();
    }

    const table = getTable(path);

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


  /* =======================================================
     POST
     ======================================================= */

  async post(path, body) {

    const table = getTable(path);

    console.log(
      `DragonByte API POST: ${path} -> ${table}`,
      body
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


  /* =======================================================
     PUT / UPDATE
     ======================================================= */

  async put(path, body) {

    const table = getTable(path);

    if (!body || !body.id) {

      throw new Error(
        "PUT requires body.id"
      );
    }

    const id = body.id;

    const updateData = {
      ...body
    };

    delete updateData.id;

    console.log(
      `DragonByte API PUT: ${path} -> ${table}`,
      updateData
    );

    const {
      data,
      error
    } = await supabaseClient
      .from(table)
      .update(updateData)
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


  /* =======================================================
     DELETE
     ======================================================= */

  async del(path, id) {

    const table = getTable(path);

    if (!id) {

      throw new Error(
        "DELETE requires an ID"
      );
    }

    console.log(
      `DragonByte API DELETE: ${path} -> ${table}`,
      id
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


  /* =======================================================
     DASHBOARD STATS
     ======================================================= */

  async getStats() {

    console.log(
      "DragonByte: Loading dashboard statistics..."
    );

    const tables = {
      members: "members",
      contributors: "contributors",
      teams: "teams",
      projects: "projects",
      events: "events",
      testimonials: "testimonials",
      challenges: "ctf_challenges",
      requests: "join_requests"
    };

    const stats = {};

    for (const [key, table] of Object.entries(tables)) {

      try {

        const {
          count,
          error
        } = await supabaseClient
          .from(table)
          .select("*", {
            count: "exact",
            head: true
          });

        if (error) {

          console.warn(
            `Stats: ${table} unavailable`,
            error.message
          );

          stats[key] = 0;

        } else {

          stats[key] = count || 0;

        }

      } catch (error) {

        console.warn(
          `Stats error for ${table}:`,
          error
        );

        stats[key] = 0;
      }
    }

    console.log(
      "DragonByte: Stats:",
      stats
    );

    return stats;
  },


  /* =======================================================
     LOGIN
     ======================================================= */

  async login(email, password) {

    if (!email || !password) {

      throw new Error(
        "Email and password are required."
      );
    }

    console.log(
      "DragonByte: Admin login..."
    );

    const {
      data,
      error
    } = await supabaseClient.auth
      .signInWithPassword({
        email,
        password
      });

    if (error) {

      console.error(
        "DragonByte login error:",
        error
      );

      throw error;
    }

    if (
      data &&
      data.session &&
      data.session.access_token
    ) {

      localStorage.setItem(
        "db_admin_token",
        data.session.access_token
      );
    }

    console.log(
      "DragonByte: Login successful."
    );

    return data;
  },


  /* =======================================================
     LOGOUT
     ======================================================= */

  async logout() {

    try {

      await supabaseClient.auth.signOut();

    } catch (error) {

      console.error(
        "DragonByte logout error:",
        error
      );
    }

    localStorage.removeItem(
      "db_admin_token"
    );

    console.log(
      "DragonByte: Logged out."
    );
  },


  /* =======================================================
     AUTH CHECK
     ======================================================= */

  isAuthed() {

    return !!localStorage.getItem(
      "db_admin_token"
    );
  },


  /* =======================================================
     CURRENT USER
     ======================================================= */

  async getUser() {

    const {
      data,
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      return null;
    }

    return data?.user || null;
  },


  /* =======================================================
     CURRENT SESSION
     ======================================================= */

  async getSession() {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      return null;
    }

    return data?.session || null;
  }

};


/* ---------------------------------------------------------
   Make API globally available
   --------------------------------------------------------- */

window.Api = Api;


/* ---------------------------------------------------------
   Global compatibility helpers
   --------------------------------------------------------- */

window.API_TABLES = API_TABLES;


/* ---------------------------------------------------------
   Auth state listener
   --------------------------------------------------------- */

if (window.supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        "DragonByte Auth:",
        event
      );

      if (
        session &&
        session.access_token
      ) {

        localStorage.setItem(
          "db_admin_token",
          session.access_token
        );

      } else if (
        event === "SIGNED_OUT"
      ) {

        localStorage.removeItem(
          "db_admin_token"
        );
      }

    }
  );
}


/* ---------------------------------------------------------
   Ready
   --------------------------------------------------------- */

console.log(
  "DragonByte API initialized."
);