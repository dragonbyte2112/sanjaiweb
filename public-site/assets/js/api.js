// =====================================================
// DragonByte API
// Supabase-powered frontend API wrapper
// =====================================================

(function () {
  "use strict";

  // =====================================================
  // SUPABASE CLIENT
  // =====================================================

  const client = window.supabaseClient;

  if (!client) {
    console.error(
      "DragonByte API Error: window.supabaseClient is not available."
    );
    return;
  }

  // =====================================================
  // TABLE MAP
  // =====================================================

  const API_TABLES = {
    "/events": "events",
    "/projects": "projects",
    "/contributors": "contributors",
    "/testimonials": "testimonials",
    "/teams": "teams",
    "/members": "members",

    // Requests
    "/join": "join_requests",
    "/join-requests": "join_requests",
    "/requests": "join_requests",

    // Messages
    "/contact": "contact_messages",
    "/messages": "messages",

    // CTF
    "/ctf/challenges": "challenges",

    // Optional
    "/blogs": "blogs",
    "/resources": "resources",
    "/workshops": "workshops"
  };

  // =====================================================
  // FIELD MAP
  // JavaScript -> Supabase
  // =====================================================

  const FIELD_MAP = {
    events: {
      registrationUrl: "registration_url",
      coverPhoto: "cover_photo",
      coverImage: "cover_image",
      imageUrl: "image_url",
      eventDate: "event_date",
      eventTime: "event_time"
    },

    projects: {
      githubUrl: "github_url",
      demoUrl: "demo_url",
      coverPhoto: "cover_photo",
      coverImage: "cover_image",
      imageUrl: "image_url"
    },

    contributors: {
      imageUrl: "image_url"
    },

    testimonials: {
      imageUrl: "image_url"
    },

    members: {
      imageUrl: "image_url"
    },

    teams: {
      imageUrl: "image_url"
    }
  };

  // =====================================================
  // REVERSE FIELD MAP
  // =====================================================

  function getReverseMap(table) {
    const map = FIELD_MAP[table] || {};
    const reverse = {};

    Object.entries(map).forEach(([jsKey, dbKey]) => {
      reverse[dbKey] = jsKey;
    });

    return reverse;
  }

  // =====================================================
  // NORMALIZE PATH
  // =====================================================

  function normalizePath(path) {
    if (!path) {
      throw new Error("API path is required.");
    }

    let value = String(path).trim();

    if (!value.startsWith("/")) {
      value = "/" + value;
    }

    if (value.length > 1) {
      value = value.replace(/\/+$/, "");
    }

    return value;
  }

  // =====================================================
  // JAVASCRIPT -> DATABASE
  // =====================================================

  function toDb(table, body) {
    if (!body || typeof body !== "object") {
      return {};
    }

    const map = FIELD_MAP[table] || {};
    const output = {};

    Object.entries(body).forEach(([key, value]) => {
      const dbKey = map[key] || key;
      output[dbKey] = value;
    });

    return output;
  }

  // =====================================================
  // DATABASE -> JAVASCRIPT
  // =====================================================

  function fromDb(table, row) {
    if (!row) {
      return row;
    }

    const reverseMap = getReverseMap(table);
    const output = {};

    Object.entries(row).forEach(([key, value]) => {
      output[reverseMap[key] || key] = value;
    });

    return output;
  }

  function fromDbList(table, rows) {
    return (rows || []).map((row) => fromDb(table, row));
  }

  // =====================================================
  // RESOLVE TABLE
  // =====================================================

  function resolveTable(path) {
    path = normalizePath(path);

    // Direct endpoint
    if (API_TABLES[path]) {
      return API_TABLES[path];
    }

    // CTF challenge ID
    if (path.startsWith("/ctf/challenges/")) {
      return "challenges";
    }

    // /events/admin/all
    if (path.endsWith("/admin/all")) {
      const base = path.replace(/\/admin\/all$/, "");

      if (API_TABLES[base]) {
        return API_TABLES[base];
      }
    }

    // /events/123
    const parts = path.split("/").filter(Boolean);

    if (parts.length >= 2) {
      const base = "/" + parts[0];

      if (API_TABLES[base]) {
        return API_TABLES[base];
      }
    }

    throw new Error("Unknown API endpoint: " + path);
  }

  // =====================================================
  // GET ID FROM PATH
  // =====================================================

  function getIdFromPath(path) {
    const normalized = normalizePath(path);
    const parts = normalized.split("/").filter(Boolean);

    if (!parts.length) {
      return null;
    }

    // /ctf/challenges/123
    if (
      parts[0] === "ctf" &&
      parts[1] === "challenges" &&
      parts[2]
    ) {
      return parts[2];
    }

    // /events/123
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
  // ERROR HANDLER
  // =====================================================

  function handleError(operation, error) {
    console.error(
      `DragonByte API ${operation} Error:`,
      error
    );

    if (error && error.message) {
      throw new Error(error.message);
    }

    throw (
      error ||
      new Error(`DragonByte API ${operation} failed.`)
    );
  }

  // =====================================================
  // AUTH
  // =====================================================

  async function getSession() {
    try {
      const { data, error } =
        await client.auth.getSession();

      if (error) {
        console.error(
          "DragonByte session error:",
          error
        );
        return null;
      }

      return data?.session || null;
    } catch (error) {
      console.error(
        "DragonByte session exception:",
        error
      );
      return null;
    }
  }

  async function getUser() {
    try {
      const { data, error } =
        await client.auth.getUser();

      if (error) {
        return null;
      }

      return data?.user || null;
    } catch (error) {
      return null;
    }
  }

  // =====================================================
  // PUBLIC API
  // =====================================================

  const Api = {

    // ===================================================
    // INIT
    // ===================================================

    async init() {
      const session = await getSession();

      console.log(
        "DragonByte API initialized:",
        session
          ? "Authenticated"
          : "Guest"
      );

      return !!session;
    },

    // ===================================================
    // GET
    // ===================================================

    async get(path) {
      try {
        path = normalizePath(path);

        // ===============================================
        // ADMIN STATISTICS
        // ===============================================

        if (path === "/admin/stats") {
          return await this.getAdminStats();
        }

        // ===============================================
        // CTF LEADERBOARD
        // ===============================================

        if (path === "/ctf/leaderboard") {
          const { data, error } =
            await client
              .from("leaderboard")
              .select("*");

          if (error) {
            handleError(
              "GET leaderboard",
              error
            );
          }

          return data || [];
        }

        // ===============================================
        // CTF STATISTICS
        // ===============================================

        if (path === "/ctf/stats") {
          const { data, error } =
            await client
              .from("challenges")
              .select("*");

          if (error) {
            handleError(
              "GET CTF stats",
              error
            );
          }

          const challenges = data || [];

          return {
            challenges: challenges.length,

            categories: new Set(
              challenges
                .map(
                  (item) => item.category
                )
                .filter(Boolean)
            ).size,

            totalPoints:
              challenges.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.points || 0
                  ),
                0
              )
          };
        }

        // ===============================================
        // RESOLVE TABLE
        // ===============================================

        const table = resolveTable(path);

        let query = client
          .from(table)
          .select("*");

        // ===============================================
        // PUBLIC FILTERS
        // ===============================================

        if (
          table === "events" ||
          table === "projects"
        ) {
          if (!path.includes("/admin")) {
            query = query.eq(
              "published",
              true
            );
          }
        }

        if (table === "testimonials") {
          if (!path.includes("/admin")) {
            query = query.eq(
              "approved",
              true
            );
          }
        }

        // ===============================================
        // IMPORTANT
        // ===============================================
        // DO NOT ORDER BY created_at.
        //
        // Your current Supabase tables do not contain
        // created_at. Ordering by it causes:
        //
        // column projects.created_at does not exist
        //
        // Therefore the query is executed without
        // created_at ordering.
        // ===============================================

        const { data, error } =
          await query;

        if (error) {
          handleError(
            "GET",
            error
          );
        }

        return fromDbList(
          table,
          data
        );

      } catch (error) {
        handleError(
          "GET",
          error
        );
      }
    },

    // ===================================================
    // GET BY ID
    // ===================================================

    async getById(path, id) {
      try {
        const table =
          resolveTable(path);

        if (!id) {
          throw new Error(
            "Record ID is required."
          );
        }

        const { data, error } =
          await client
            .from(table)
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) {
          handleError(
            "GET BY ID",
            error
          );
        }

        return fromDb(
          table,
          data
        );

      } catch (error) {
        handleError(
          "GET BY ID",
          error
        );
      }
    },

    // ===================================================
    // POST
    // ===================================================

    async post(
      path,
      body = {}
    ) {
      try {
        path =
          normalizePath(path);

        // Change password
        if (
          path ===
          "/auth/change-password"
        ) {
          return await this.changePassword(
            body.currentPassword,
            body.newPassword
          );
        }

        const table =
          resolveTable(path);

        const dbBody =
          toDb(table, body);

        const { data, error } =
          await client
            .from(table)
            .insert(dbBody)
            .select();

        if (error) {
          handleError(
            "POST",
            error
          );
        }

        return fromDbList(
          table,
          data
        );

      } catch (error) {
        handleError(
          "POST",
          error
        );
      }
    },

    // ===================================================
    // PUT
    // ===================================================

    async put(
      path,
      body = {}
    ) {
      try {
        path =
          normalizePath(path);

        const table =
          resolveTable(path);

        const id =
          getIdFromPath(path);

        if (!id) {
          throw new Error(
            "PUT requires an ID. Example: /events/123"
          );
        }

        const updateBody = {
          ...body
        };

        delete updateBody.id;

        const dbBody =
          toDb(
            table,
            updateBody
          );

        const { data, error } =
          await client
            .from(table)
            .update(dbBody)
            .eq("id", id)
            .select();

        if (error) {
          handleError(
            "PUT",
            error
          );
        }

        return fromDbList(
          table,
          data
        );

      } catch (error) {
        handleError(
          "PUT",
          error
        );
      }
    },

    // ===================================================
    // UPDATE
    // ===================================================

    async update(
      path,
      id,
      body = {}
    ) {
      try {
        const table =
          resolveTable(path);

        if (!id) {
          throw new Error(
            "Record ID is required."
          );
        }

        const updateBody = {
          ...body
        };

        delete updateBody.id;

        const dbBody =
          toDb(
            table,
            updateBody
          );

        const { data, error } =
          await client
            .from(table)
            .update(dbBody)
            .eq("id", id)
            .select();

        if (error) {
          handleError(
            "UPDATE",
            error
          );
        }

        return fromDbList(
          table,
          data
        );

      } catch (error) {
        handleError(
          "UPDATE",
          error
        );
      }
    },

    // ===================================================
    // DELETE
    // ===================================================

    async del(
      path,
      id = null
    ) {
      try {
        path =
          normalizePath(path);

        const table =
          resolveTable(path);

        const recordId =
          id ||
          getIdFromPath(path);

        if (!recordId) {
          throw new Error(
            "Record ID is required for DELETE."
          );
        }

        const { data, error } =
          await client
            .from(table)
            .delete()
            .eq("id", recordId)
            .select();

        if (error) {
          handleError(
            "DELETE",
            error
          );
        }

        return fromDbList(
          table,
          data
        );

      } catch (error) {
        handleError(
          "DELETE",
          error
        );
      }
    },

    // ===================================================
    // LOGIN
    // ===================================================

    async login(
      email,
      password
    ) {
      if (!email || !password) {
        throw new Error(
          "Email and password are required."
        );
      }

      const { data, error } =
        await client.auth
          .signInWithPassword({
            email: email.trim(),
            password
          });

      if (error) {
        handleError(
          "LOGIN",
          error
        );
      }

      return data;
    },

    // ===================================================
    // REGISTER
    // ===================================================

    async register(
      email,
      password
    ) {
      if (!email || !password) {
        throw new Error(
          "Email and password are required."
        );
      }

      if (password.length < 6) {
        throw new Error(
          "Password must be at least 6 characters."
        );
      }

      const { data, error } =
        await client.auth
          .signUp({
            email: email.trim(),
            password
          });

      if (error) {
        handleError(
          "REGISTER",
          error
        );
      }

      return data;
    },

    // ===================================================
    // AUTH CHECK
    // ===================================================

    async isAuthed() {
      const session =
        await getSession();

      return !!session;
    },

    // ===================================================
    // USER
    // ===================================================

    async getUser() {
      return await getUser();
    },

    // ===================================================
    // SESSION
    // ===================================================

    async getSession() {
      return await getSession();
    },

    // ===================================================
    // LOGOUT
    // ===================================================

    async logout() {
      const { error } =
        await client.auth.signOut();

      if (error) {
        handleError(
          "LOGOUT",
          error
        );
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

      const user =
        await getUser();

      if (!user) {
        throw new Error(
          "You must be logged in."
        );
      }

      // Verify old password if provided
      if (
        currentPassword &&
        user.email
      ) {
        const { error } =
          await client.auth
            .signInWithPassword({
              email: user.email,
              password:
                currentPassword
            });

        if (error) {
          throw new Error(
            "Current password is incorrect."
          );
        }
      }

      const { data, error } =
        await client.auth
          .updateUser({
            password:
              newPassword
          });

      if (error) {
        handleError(
          "CHANGE PASSWORD",
          error
        );
      }

      return data;
    },

    // ===================================================
    // ADMIN STATS
    // ===================================================

    async getAdminStats() {
      const tables = {
        members: "members",
        events: "events",
        projects: "projects",
        contributors: "contributors",
        testimonials: "testimonials",
        teams: "teams",
        challenges: "challenges",
        joinRequests:
          "join_requests"
      };

      const result = {};

      await Promise.all(
        Object.entries(
          tables
        ).map(
          async ([key, table]) => {
            try {
              const {
                count,
                error
              } =
                await client
                  .from(table)
                  .select("*", {
                    count: "exact",
                    head: true
                  });

              if (error) {
                console.warn(
                  `DragonByte Stats: ${table}`,
                  error.message
                );

                result[key] = 0;
              } else {
                result[key] =
                  count || 0;
              }

            } catch (error) {
              console.warn(
                `DragonByte Stats Error: ${table}`,
                error
              );

              result[key] = 0;
            }
          }
        )
      );

      return result;
    },

    // ===================================================
    // REFRESH SESSION
    // ===================================================

    async refreshSession() {
      const { data, error } =
        await client.auth
          .refreshSession();

      if (error) {
        handleError(
          "REFRESH SESSION",
          error
        );
      }

      return data;
    },

    // ===================================================
    // AUTH STATE LISTENER
    // ===================================================

    onAuthStateChange(
      callback
    ) {
      if (
        typeof callback !==
        "function"
      ) {
        throw new Error(
          "Auth callback must be a function."
        );
      }

      return client.auth
        .onAuthStateChange(
          (event, session) => {
            callback(
              event,
              session
            );
          }
        );
    }
  };

  // =====================================================
  // GLOBAL API
  // =====================================================

  window.Api = Api;

  // =====================================================
  // DRAGONBYTE DATA
  // Compatibility layer for existing home.js
  // =====================================================

  window.DragonByteData = {

    // ===============================================
    // EVENTS
    // ===============================================

    async getEvents(limit = 10) {
      const data =
        await window.Api.get(
          "/events"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // PROJECTS
    // ===============================================

    async getProjects(limit = 10) {
      const data =
        await window.Api.get(
          "/projects"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // CONTRIBUTORS
    // ===============================================

    async getContributors(
      limit = 10
    ) {
      const data =
        await window.Api.get(
          "/contributors"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // TESTIMONIALS
    // ===============================================

    async getTestimonials(
      limit = 10
    ) {
      const data =
        await window.Api.get(
          "/testimonials"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // TEAMS
    // ===============================================

    async getTeams(limit = 10) {
      const data =
        await window.Api.get(
          "/teams"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // MEMBERS
    // ===============================================

    async getMembers(limit = 10) {
      const data =
        await window.Api.get(
          "/members"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // BLOGS
    // ===============================================

    async getBlogs(limit = 10) {
      const data =
        await window.Api.get(
          "/blogs"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // RESOURCES
    // ===============================================

    async getResources(limit = 10) {
      const data =
        await window.Api.get(
          "/resources"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // WORKSHOPS
    // ===============================================

    async getWorkshops(limit = 10) {
      const data =
        await window.Api.get(
          "/workshops"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // CTF CHALLENGES
    // ===============================================

    async getChallenges(limit = 100) {
      const data =
        await window.Api.get(
          "/ctf/challenges"
        );

      return Array.isArray(data)
        ? data.slice(0, limit)
        : [];
    },

    // ===============================================
    // GENERIC GET
    // ===============================================

    async get(path) {
      return await window.Api.get(
        path
      );
    },

    // ===============================================
    // GENERIC GET BY ID
    // ===============================================

    async getById(
      path,
      id
    ) {
      return await window.Api.getById(
        path,
        id
      );
    },

    // ===============================================
    // GENERIC POST
    // ===============================================

    async post(
      path,
      body = {}
    ) {
      return await window.Api.post(
        path,
        body
      );
    },

    // ===============================================
    // GENERIC UPDATE
    // ===============================================

    async update(
      path,
      id,
      body = {}
    ) {
      return await window.Api.update(
        path,
        id,
        body
      );
    },

    // ===============================================
    // GENERIC DELETE
    // ===============================================

    async delete(
      path,
      id
    ) {
      return await window.Api.del(
        path,
        id
      );
    }
  };

  // =====================================================
  // GLOBAL TABLE MAP
  // =====================================================

  window.API_TABLES =
    API_TABLES;

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
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  };

  // =====================================================
  // API READY
  // =====================================================

  console.log(
    "DragonByte API loaded successfully."
  );

  console.log(
    "DragonByteData compatibility layer ready."
  );

})();