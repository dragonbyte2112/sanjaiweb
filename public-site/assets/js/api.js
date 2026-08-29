/* =========================================================
   DragonByte API
   Supabase browser client + Admin CRUD
   ========================================================= */

(function () {
  "use strict";

  /* =======================================================
     SUPABASE CONFIG
     ======================================================= */

  const SUPABASE_URL =
    "https://lfwwslohugqojibcpkys.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_4OBUm9wgJwRAqN9hi8QLOw_5WYgQcUG";

  /* =======================================================
     SUPABASE CLIENT
     ======================================================= */

  function getClient() {
    if (
      window.supabaseClient &&
      typeof window.supabaseClient.from === "function"
    ) {
      return window.supabaseClient;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      throw new Error(
        "Supabase library is not loaded. Make sure @supabase/supabase-js is loaded before api.js."
      );
    }

    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    console.log("DragonByte: Supabase connected!");

    return window.supabaseClient;
  }

  /* =======================================================
     TABLE MAP
     ======================================================= */

  const API_TABLES = {
    "/events": "events",
    "/projects": "projects",
    "/contributors": "contributors",
    "/testimonials": "testimonials",
    "/teams": "teams",
    "/members": "members",
  };

  function resolveTable(path) {
    if (API_TABLES[path]) {
      return API_TABLES[path];
    }

    for (const [apiPath, table] of Object.entries(API_TABLES)) {
      if (path === `${apiPath}/admin/all`) {
        return table;
      }
    }

    throw new Error(`Unknown API endpoint: ${path}`);
  }

  /* =======================================================
     FRONTEND -> DATABASE FIELD MAPPING
     ======================================================= */

  const FIELD_MAP = {
    events: {
      registrationUrl: "registration_url",
      coverPhoto: "cover_photo",
    },

    projects: {
      githubUrl: "github_url",
      demoUrl: "demo_url",
      resourceUrl: "resource_url",
      coverPhoto: "cover_photo",
    },

    contributors: {
      coverPhoto: "cover_photo",
    },

    testimonials: {
      coverPhoto: "cover_photo",
    },

    teams: {
      logoUrl: "logo_url",
      githubUrl: "github_url",
      websiteUrl: "website_url",
      membersCount: "members_count",
    },

    members: {
      joinedAt: "joined_at",
    },
  };

  /* =======================================================
     DATABASE -> FRONTEND FIELD MAPPING
     ======================================================= */

  function toDb(table, value) {
    if (!value || typeof value !== "object") {
      return value;
    }

    const map = FIELD_MAP[table] || {};
    const output = {};

    Object.entries(value).forEach(([key, val]) => {
      output[map[key] || key] = val;
    });

    return output;
  }

  function fromDb(table, value) {
    if (!value || typeof value !== "object") {
      return value;
    }

    const map = FIELD_MAP[table] || {};

    const reverse = Object.fromEntries(
      Object.entries(map).map(([frontend, database]) => [
        database,
        frontend,
      ])
    );

    const output = {};

    Object.entries(value).forEach(([key, val]) => {
      output[reverse[key] || key] = val;
    });

    return output;
  }

  function fromDbList(table, list) {
    return (list || []).map((row) => fromDb(table, row));
  }

  /* =======================================================
     ENTITY CONFIG
     ======================================================= */

  const ENTITY_TABLES = [
    "events",
    "projects",
    "contributors",
    "testimonials",
    "members",
    "teams",
  ];

  const PUBLISHED_TABLES = new Set([
    "events",
    "projects",
  ]);

  const APPROVED_TABLES = new Set([
    "testimonials",
  ]);

  function matchEntity(path) {
    for (const table of ENTITY_TABLES) {
      if (path === `/${table}`) {
        return {
          table,
          mode: "public-list",
        };
      }

      if (path === `/${table}/admin/all`) {
        return {
          table,
          mode: "admin-list",
        };
      }

      const match = path.match(
        new RegExp(`^/${table}/([^/]+)$`)
      );

      if (match) {
        return {
          table,
          mode: "item",
          id: match[1],
        };
      }
    }

    return null;
  }

  /* =======================================================
     API OBJECT
     ======================================================= */

  const Api = {
    _session: null,
    _authListenerInstalled: false,

    /* =====================================================
       INIT
       ===================================================== */

    async init() {
      const client = getClient();

      const {
        data,
        error,
      } = await client.auth.getSession();

      if (error) {
        console.warn(
          "DragonByte Auth session error:",
          error.message
        );
      }

      Api._session = data?.session || null;

      if (!Api._authListenerInstalled) {
        client.auth.onAuthStateChange(
          (_event, session) => {
            Api._session = session || null;

            if (session?.access_token) {
              localStorage.setItem(
                "db_admin_token",
                session.access_token
              );
            } else {
              localStorage.removeItem(
                "db_admin_token"
              );
            }
          }
        );

        Api._authListenerInstalled = true;
      }

      console.log(
        "DragonByte Auth:",
        Api._session ? "SIGNED_IN" : "SIGNED_OUT"
      );

      return Api._session;
    },

    /* =====================================================
       AUTH CHECK
       ===================================================== */

    isAuthed() {
      return !!Api._session;
    },

    /* =====================================================
       LOGIN
       ===================================================== */

    async login(email, password) {
      if (!email || !password) {
        throw new Error(
          "Email and password are required."
        );
      }

      const client = getClient();

      const {
        data,
        error,
      } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      Api._session = data?.session || null;

      if (data?.session?.access_token) {
        localStorage.setItem(
          "db_admin_token",
          data.session.access_token
        );
      }

      console.log(
        "DragonByte Auth: SIGNED_IN"
      );

      return data;
    },

    /* =====================================================
       LOGOUT
       ===================================================== */

    async logout() {
      const client = getClient();

      const {
        error,
      } = await client.auth.signOut();

      if (error) {
        throw error;
      }

      Api._session = null;

      localStorage.removeItem(
        "db_admin_token"
      );

      console.log(
        "DragonByte Auth: SIGNED_OUT"
      );

      return true;
    },

    /* =====================================================
       GET
       ===================================================== */

    async get(path) {
      const client = getClient();

      /* ---------------------------------------------------
         ADMIN STATS
         --------------------------------------------------- */

      if (path === "/admin/stats") {
        const {
          data,
          error,
        } = await client.rpc("admin_stats");

        if (error) {
          throw error;
        }

        return data || {};
      }

      /* ---------------------------------------------------
         CTF PUBLIC CHALLENGES
         --------------------------------------------------- */

      if (path === "/ctf/challenges") {
        const {
          data,
          error,
        } = await client
          .from("public_challenges")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        return (data || []).map((row) => ({
          ...row,
          solvedCount: row.solved_count,
        }));
      }

      /* ---------------------------------------------------
         CTF ADMIN CHALLENGES
         --------------------------------------------------- */

      if (path === "/ctf/challenges/admin/all") {
        const {
          data,
          error,
        } = await client
          .from("admin_challenges")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        return (data || []).map((row) => ({
          ...row,
          hasFlag: row.has_flag,
        }));
      }

      /* ---------------------------------------------------
         CTF LEADERBOARD
         --------------------------------------------------- */

      if (path === "/ctf/leaderboard") {
        const {
          data,
          error,
        } = await client
          .from("leaderboard")
          .select("*");

        if (error) {
          throw error;
        }

        return (data || []).map((row) => ({
          handle: row.handle,
          points: row.points,
          solves: row.solves,
          lastSolveAt: row.last_solve_at,
        }));
      }

      /* ---------------------------------------------------
         CTF STATS
         --------------------------------------------------- */

      if (path === "/ctf/stats") {
        const [
          challengesResult,
          leaderboardResult,
        ] = await Promise.all([
          client
            .from("public_challenges")
            .select("*"),

          client
            .from("leaderboard")
            .select("*"),
        ]);

        if (challengesResult.error) {
          throw challengesResult.error;
        }

        if (leaderboardResult.error) {
          throw leaderboardResult.error;
        }

        const challenges =
          challengesResult.data || [];

        const leaderboard =
          leaderboardResult.data || [];

        return {
          challenges: challenges.length,

          categories: new Set(
            challenges
              .map((row) => row.category)
              .filter(Boolean)
          ).size,

          totalPoints: challenges.reduce(
            (sum, row) =>
              sum + Number(row.points || 0),
            0
          ),

          solvedChallenges:
            challenges.filter(
              (row) =>
                Number(row.solved_count || 0) > 0
            ).length,

          totalSolves:
            leaderboard.reduce(
              (sum, row) =>
                sum + Number(row.solves || 0),
              0
            ),
        };
      }

      /* ---------------------------------------------------
         JOIN REQUESTS
         --------------------------------------------------- */

      if (path === "/join") {
        const {
          data,
          error,
        } = await client
          .from("join_requests")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        return data || [];
      }

      /* ---------------------------------------------------
         CONTACT MESSAGES
         --------------------------------------------------- */

      if (path === "/contact") {
        const {
          data,
          error,
        } = await client
          .from("messages")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        return data || [];
      }

      /* ---------------------------------------------------
         NORMAL ENTITIES
         --------------------------------------------------- */

      const entity = matchEntity(path);

      if (
        entity &&
        entity.mode !== "item"
      ) {
        let query = client
          .from(entity.table)
          .select("*");

        if (
          entity.table !== "members" &&
          entity.table !== "teams"
        ) {
          query = query.order(
            "created_at",
            {
              ascending: false,
            }
          );
        }

        if (
          entity.mode === "public-list"
        ) {
          if (
            PUBLISHED_TABLES.has(
              entity.table
            )
          ) {
            query = query.eq(
              "published",
              true
            );
          }

          if (
            APPROVED_TABLES.has(
              entity.table
            )
          ) {
            query = query.eq(
              "approved",
              true
            );
          }
        }

        const {
          data,
          error,
        } = await query;

        if (error) {
          throw error;
        }

        return fromDbList(
          entity.table,
          data
        );
      }

      throw new Error(
        `No Supabase mapping for GET ${path}`
      );
    },

    /* =====================================================
       POST
       ===================================================== */

    async post(path, body) {
      const client = getClient();

      /* ---------------------------------------------------
         JOIN
         --------------------------------------------------- */

      if (path === "/join") {
        const {
          error,
        } = await client
          .from("join_requests")
          .insert(body);

        if (error) {
          throw error;
        }

        return {
          ok: true,
        };
      }

      /* ---------------------------------------------------
         CONTACT
         --------------------------------------------------- */

      if (path === "/contact") {
        const {
          error,
        } = await client
          .from("messages")
          .insert(body);

        if (error) {
          throw error;
        }

        return {
          ok: true,
        };
      }

      /* ---------------------------------------------------
         CTF SUBMIT FLAG
         --------------------------------------------------- */

      if (path === "/ctf/submit") {
        const {
          data,
          error,
        } = await client.rpc(
          "submit_flag",
          {
            p_challenge_id:
              body.challengeId,

            p_handle:
              body.handle,

            p_flag:
              body.flag,
          }
        );

        if (error) {
          throw error;
        }

        return {
          ok: true,
          points: data,
        };
      }

      /* ---------------------------------------------------
         CTF CREATE
         --------------------------------------------------- */

      if (
        path === "/ctf/challenges"
      ) {
        const {
          data,
          error,
        } = await client.rpc(
          "admin_create_challenge",
          {
            p_title: body.title,
            p_description:
              body.description,
            p_category:
              body.category,
            p_difficulty:
              body.difficulty,
            p_points:
              body.points,
            p_flag:
              body.flag,
            p_published:
              body.published !== false,
          }
        );

        if (error) {
          throw error;
        }

        return {
          id: data,
        };
      }

      /* ---------------------------------------------------
         CHANGE PASSWORD
         --------------------------------------------------- */

      if (
        path === "/auth/change-password"
      ) {
        const {
          data: userData,
          error: userError,
        } = await client.auth.getUser();

        if (
          userError ||
          !userData?.user
        ) {
          throw new Error(
            "Not signed in"
          );
        }

        const {
          error: reauthError,
        } = await client.auth.signInWithPassword(
          {
            email:
              userData.user.email,

            password:
              body.currentPassword,
          }
        );

        if (reauthError) {
          throw new Error(
            "Current password is incorrect"
          );
        }

        const {
          error,
        } = await client.auth.updateUser(
          {
            password:
              body.newPassword,
          }
        );

        if (error) {
          throw error;
        }

        return {
          ok: true,
        };
      }

      /* ---------------------------------------------------
         NORMAL ENTITY CREATE
         --------------------------------------------------- */

      const entity = matchEntity(path);

      if (
        entity &&
        entity.mode === "public-list"
      ) {
        const dbBody =
          toDb(
            entity.table,
            body
          );

        const {
          data,
          error,
        } = await client
          .from(entity.table)
          .insert(dbBody)
          .select()
          .single();

        if (error) {
          console.error(
            "DragonByte API POST Error:",
            error
          );

          throw error;
        }

        return fromDb(
          entity.table,
          data
        );
      }

      throw new Error(
        `No Supabase mapping for POST ${path}`
      );
    },

    /* =====================================================
       PUT
       ===================================================== */

    async put(path, body) {
      const client = getClient();

      /* ---------------------------------------------------
         JOIN REQUEST
         --------------------------------------------------- */

      if (
        path.startsWith("/join/")
      ) {
        const id =
          path.split("/")[2];

        if (
          body?.status === "approved"
        ) {
          const {
            error,
          } = await client.rpc(
            "admin_approve_join_request",
            {
              p_id: id,
            }
          );

          if (error) {
            throw error;
          }
        } else {
          const {
            error,
          } = await client
            .from("join_requests")
            .update(body)
            .eq("id", id);

          if (error) {
            throw error;
          }
        }

        return {
          ok: true,
        };
      }

      /* ---------------------------------------------------
         CONTACT MESSAGE
         --------------------------------------------------- */

      if (
        path.startsWith("/contact/")
      ) {
        const id =
          path.split("/")[2];

        const {
          error,
        } = await client
          .from("messages")
          .update(body)
          .eq("id", id);

        if (error) {
          throw error;
        }

        return {
          ok: true,
        };
      }

      /* ---------------------------------------------------
         CTF UPDATE
         --------------------------------------------------- */

      if (
        path.startsWith(
          "/ctf/challenges/"
        )
      ) {
        const id =
          path.split("/")[3];

        const {
          error,
        } = await client.rpc(
          "admin_update_challenge",
          {
            p_id: id,
            p_title: body.title,
            p_description:
              body.description,
            p_category:
              body.category,
            p_difficulty:
              body.difficulty,
            p_points:
              body.points,
            p_flag:
              body.flag || null,
            p_published:
              body.published !== false,
          }
        );

        if (error) {
          throw error;
        }

        return {
          ok: true,
        };
      }

      /* ---------------------------------------------------
         NORMAL ENTITY UPDATE
         --------------------------------------------------- */

      const entity =
        matchEntity(path);

      if (
        entity &&
        entity.mode === "item"
      ) {
        const dbBody =
          toDb(
            entity.table,
            body
          );

        const {
          data,
          error,
        } = await client
          .from(entity.table)
          .update(dbBody)
          .eq(
            "id",
            entity.id
          )
          .select()
          .single();

        if (error) {
          console.error(
            "DragonByte API PUT Error:",
            error
          );

          throw error;
        }

        return fromDb(
          entity.table,
          data
        );
      }

      throw new Error(
        `No Supabase mapping for PUT ${path}`
      );
    },

    /* =====================================================
       DELETE
       ===================================================== */

    async del(path, id) {
      const client = getClient();

      /* ---------------------------------------------------
         JOIN REQUEST
         --------------------------------------------------- */

      if (
        path.startsWith("/join/")
      ) {
        const rowId =
          path.split("/")[2];

        const {
          error,
        } = await client
          .from("join_requests")
          .delete()
          .eq("id", rowId);

        if (error) {
          throw error;
        }

        return null;
      }

      /* ---------------------------------------------------
         CONTACT
         --------------------------------------------------- */

      if (
        path.startsWith("/contact/")
      ) {
        const rowId =
          path.split("/")[2];

        const {
          error,
        } = await client
          .from("messages")
          .delete()
          .eq("id", rowId);

        if (error) {
          throw error;
        }

        return null;
      }

      /* ---------------------------------------------------
         CTF
         --------------------------------------------------- */

      if (
        path.startsWith(
          "/ctf/challenges/"
        )
      ) {
        const rowId =
          path.split("/")[3];

        const {
          error,
        } = await client
          .from("challenges")
          .delete()
          .eq("id", rowId);

        if (error) {
          throw error;
        }

        return null;
      }

      /* ---------------------------------------------------
         NORMAL ENTITY
         --------------------------------------------------- */

      const entity =
        matchEntity(path);

      const rowId =
        id || entity?.id;

      if (
        entity &&
        entity.mode === "item" &&
        rowId
      ) {
        const {
          error,
        } = await client
          .from(entity.table)
          .delete()
          .eq("id", rowId);

        if (error) {
          throw error;
        }

        return null;
      }

      throw new Error(
        `No Supabase mapping for DELETE ${path}`
      );
    },
  };

  /* =======================================================
     GLOBALS
     ======================================================= */

  window.Api = Api;

  window.API_TABLES =
    API_TABLES;

  window.esc =
    window.esc ||
    function (value) {
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

  /* =======================================================
     INITIALIZE
     ======================================================= */

  if (window.supabase) {
    try {
      getClient();
    } catch (error) {
      console.error(
        "DragonByte Supabase initialization failed:",
        error
      );
    }
  }

  console.log(
    "DragonByte API loaded successfully."
  );
})();