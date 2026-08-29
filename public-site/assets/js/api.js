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

    // Still expose empty objects so other scripts don't crash
    window.Api = null;
    window.DragonByteData = null;

    return;
  }

  console.log("DragonByte: Supabase client detected.");

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
    return (rows || []).map(function (row) {
      return fromDb(table, row);
    });
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
      "DragonByte API " + operation + " Error:",
      error
    );

    if (error && error.message) {
      throw new Error(error.message);
    }

    throw error || new Error(
      "DragonByte API " + operation + " failed."
    );
  }

  // =====================================================
  // AUTH
  // =====================================================

  async function getSession() {
    const result = await client.auth.getSession();

    if (result.error) {
      console.error(
        "DragonByte session error:",
        result.error
      );

      return null;
    }

    return result.data &&
      result.data.session
      ? result.data.session
      : null;
  }

  async function getUser() {
    const result = await client.auth.getUser();

    if (result.error) {
      return null;
    }

    return result.data &&
      result.data.user
      ? result.data.user
      : null;
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
        session ? "Authenticated" : "Guest"
      );

      return !!session;
    },

    // ===================================================
    // GET
    // ===================================================

    async get(path) {
      try {
        path = normalizePath(path);

        // -----------------------------------------------
        // ADMIN STATS
        // -----------------------------------------------

        if (path === "/admin/stats") {
          return await this.getAdminStats();
        }

        // -----------------------------------------------
        // CTF LEADERBOARD
        // -----------------------------------------------

        if (path === "/ctf/leaderboard") {
          const result = await client
            .from("leaderboard")
            .select("*");

          if (result.error) {
            handleError(
              "GET leaderboard",
              result.error
            );
          }

          return result.data || [];
        }

        // -----------------------------------------------
        // CTF STATS
        // -----------------------------------------------

        if (path === "/ctf/stats") {
          const result = await client
            .from("challenges")
            .select("*");

          if (result.error) {
            handleError(
              "GET CTF stats",
              result.error
            );
          }

          const challenges = result.data || [];

          return {
            challenges: challenges.length,

            categories: new Set(
              challenges
                .map(function (item) {
                  return item.category;
                })
                .filter(Boolean)
            ).size,

            totalPoints: challenges.reduce(
              function (sum, item) {
                return sum + Number(
                  item.points || 0
                );
              },
              0
            )
          };
        }

        // -----------------------------------------------
        // NORMAL TABLE
        // -----------------------------------------------

        const table = resolveTable(path);

        let query = client
          .from(table)
          .select("*");

        // -----------------------------------------------
        // PUBLIC FILTERS
        // -----------------------------------------------

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

        // IMPORTANT:
        // DO NOT ORDER BY created_at.
        //
        // Your Supabase tables currently do not
        // contain created_at.
        //
        // This was causing:
        // column projects.created_at does not exist
        // column contributors.created_at does not exist
        // column testimonials.created_at does not exist
        // column events.created_at does not exist

        const result = await query;

        if (result.error) {
          handleError(
            "GET",
            result.error
          );
        }

        return fromDbList(
          table,
          result.data
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
        const table = resolveTable(path);

        if (!id) {
          throw new Error(
            "Record ID is required."
          );
        }

        const result = await client
          .from(table)
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (result.error) {
          handleError(
            "GET BY ID",
            result.error
          );
        }

        return fromDb(
          table,
          result.data
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

    async post(path, body) {
      try {
        path = normalizePath(path);

        body = body || {};

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

        const table = resolveTable(path);

        const dbBody = toDb(
          table,
          body
        );

        const result = await client
          .from(table)
          .insert(dbBody)
          .select();

        if (result.error) {
          handleError(
            "POST",
            result.error
          );
        }

        return fromDbList(
          table,
          result.data
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

    async put(path, body) {
      try {
        path = normalizePath(path);

        body = body || {};

        const table = resolveTable(path);
        const id = getIdFromPath(path);

        if (!id) {
          throw new Error(
            "PUT requires an ID. Example: /events/123"
          );
        }

        const updateBody = {
          ...body
        };

        delete updateBody.id;

        const dbBody = toDb(
          table,
          updateBody
        );

        const result = await client
          .from(table)
          .update(dbBody)
          .eq("id", id)
          .select();

        if (result.error) {
          handleError(
            "PUT",
            result.error
          );
        }

        return fromDbList(
          table,
          result.data
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

    async update(path, id, body) {
      try {
        const table = resolveTable(path);

        if (!id) {
          throw new Error(
            "Record ID is required."
          );
        }

        body = body || {};

        const updateBody = {
          ...body
        };

        delete updateBody.id;

        const dbBody = toDb(
          table,
          updateBody
        );

        const result = await client
          .from(table)
          .update(dbBody)
          .eq("id", id)
          .select();

        if (result.error) {
          handleError(
            "UPDATE",
            result.error
          );
        }

        return fromDbList(
          table,
          result.data
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

    async del(path, id) {
      try {
        path = normalizePath(path);

        const table = resolveTable(path);

        const recordId =
          id || getIdFromPath(path);

        if (!recordId) {
          throw new Error(
            "Record ID is required for DELETE."
          );
        }

        const result = await client
          .from(table)
          .delete()
          .eq("id", recordId)
          .select();

        if (result.error) {
          handleError(
            "DELETE",
            result.error
          );
        }

        return fromDbList(
          table,
          result.data
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

    async login(email, password) {
      if (!email || !password) {
        throw new Error(
          "Email and password are required."
        );
      }

      const result =
        await client.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

      if (result.error) {
        handleError(
          "LOGIN",
          result.error
        );
      }

      return result.data;
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

      if (password.length < 6) {
        throw new Error(
          "Password must be at least 6 characters."
        );
      }

      const result =
        await client.auth.signUp({
          email: email.trim(),
          password: password
        });

      if (result.error) {
        handleError(
          "REGISTER",
          result.error
        );
      }

      return result.data;
    },

    // ===================================================
    // AUTH CHECK
    // ===================================================

    async isAuthed() {
      const session = await getSession();

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
      const result =
        await client.auth.signOut();

      if (result.error) {
        handleError(
          "LOGOUT",
          result.error
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

      const user = await getUser();

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
        const result =
          await client.auth.signInWithPassword({
            email: user.email,
            password: currentPassword
          });

        if (result.error) {
          throw new Error(
            "Current password is incorrect."
          );
        }
      }

      const result =
        await client.auth.updateUser({
          password: newPassword
        });

      if (result.error) {
        handleError(
          "CHANGE PASSWORD",
          result.error
        );
      }

      return result.data;
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
        joinRequests: "join_requests"
      };

      const result = {};

      await Promise.all(
        Object.entries(tables).map(
          async function ([key, table]) {
            try {
              const response =
                await client
                  .from(table)
                  .select("*", {
                    count: "exact",
                    head: true
                  });

              if (response.error) {
                console.warn(
                  "DragonByte Stats: " +
                  table,
                  response.error.message
                );

                result[key] = 0;
              } else {
                result[key] =
                  response.count || 0;
              }

            } catch (error) {
              console.warn(
                "DragonByte Stats Error: " +
                table,
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
      const result =
        await client.auth.refreshSession();

      if (result.error) {
        handleError(
          "REFRESH SESSION",
          result.error
        );
      }

      return result.data;
    },

    // ===================================================
    // AUTH STATE LISTENER
    // ===================================================

    onAuthStateChange(callback) {
      if (
        typeof callback !==
        "function"
      ) {
        throw new Error(
          "Auth callback must be a function."
        );
      }

      return client.auth.onAuthStateChange(
        function (event, session) {
          callback(
            event,
            session
          );
        }
      );
    }
  };

  // =====================================================
  // DRAGONBYTE DATA COMPATIBILITY API
  //
  // Your home.js uses DragonByteData.
  // This creates that API.
  // =====================================================

  const DragonByteData = {

    async getEvents(limit) {
      const data =
        await Api.get("/events");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getProjects(limit) {
      const data =
        await Api.get("/projects");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getContributors(limit) {
      const data =
        await Api.get("/contributors");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getTestimonials(limit) {
      const data =
        await Api.get("/testimonials");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getTeams(limit) {
      const data =
        await Api.get("/teams");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getMembers(limit) {
      const data =
        await Api.get("/members");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getBlogs(limit) {
      const data =
        await Api.get("/blogs");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getResources(limit) {
      const data =
        await Api.get("/resources");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getWorkshops(limit) {
      const data =
        await Api.get("/workshops");

      return Array.isArray(data)
        ? data.slice(
            0,
            Number(limit) || data.length
          )
        : [];
    },

    async getChallenges() {
      return await Api.get(
        "/ctf/challenges"
      );
    },

    async getLeaderboard() {
      return await Api.get(
        "/ctf/leaderboard"
      );
    },

    async getCTFStats() {
      return await Api.get(
        "/ctf/stats"
      );
    }
  };

  // =====================================================
  // GLOBAL EXPORTS
  // =====================================================

  window.Api = Api;

  window.DragonByteData =
    DragonByteData;

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
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // =====================================================
  // INITIALIZE
  // =====================================================

  Api.init()
    .then(function () {
      console.log(
        "DragonByte API loaded successfully."
      );
      console.log(
        "DragonByteData compatibility API loaded."
      );
    })
    .catch(function (error) {
      console.error(
        "DragonByte API initialization error:",
        error
      );
    });

})();