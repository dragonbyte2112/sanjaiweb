/* =========================================================
   DragonByte API - Supabase client
   Single browser API used by public pages and admin.html.
   ========================================================= */

(function () {
  "use strict";

  // =========================================================
  // SUPABASE CONFIG
  // =========================================================

  const SUPABASE_URL =
    "https://khjmouwldnjwzvdxnbty.supabase.co";

  // IMPORTANT:
  // Use your Supabase ANON / publishable key here.
  // NEVER use sb_secret_... in browser JavaScript.
  const SUPABASE_PUBLISHABLE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoam1vdXdsZG5qd3p2ZHhuYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNjE0MjUsImV4cCI6MjEwMzYzNzQyNX0.pmU13DeACsbQQweV-7QLY_mYfqtRL9JWZXr18DQY1Rs";


  // =========================================================
  // SUPABASE CLIENT
  // =========================================================

  function getClient() {
    if (window.supabaseClient) {
      return window.supabaseClient;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      throw new Error(
        "Supabase library is not loaded. Load @supabase/supabase-js before api.js."
      );
    }

    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    console.log("DragonByte Supabase connected!");

    return window.supabaseClient;
  }


  // =========================================================
  // API TABLES
  // =========================================================

  const API_TABLES = {
    "/events": "events",
    "/projects": "projects",
    "/contributors": "contributors",
    "/testimonials": "testimonials",
    "/teams": "teams",
    "/members": "members"
  };


  function resolveTable(path) {
    if (API_TABLES[path]) {
      return API_TABLES[path];
    }

    if (path.endsWith("/admin/all")) {
      const basePath = path.replace(/\/admin\/all$/, "");

      if (API_TABLES[basePath]) {
        return API_TABLES[basePath];
      }
    }

    throw new Error(`Unknown API endpoint: ${path}`);
  }


  // =========================================================
  // DATABASE FIELD MAPPING
  // =========================================================

  const FIELD_MAP = {

    events: {
      registrationUrl: "registration_url",
      coverPhoto: "cover_photo"
    },

    projects: {
      githubUrl: "github_url",
      demoUrl: "demo_url",
      resourceUrl: "resource_url",
      coverPhoto: "cover_photo"
    },

    contributors: {
      coverPhoto: "cover_photo"
    },

    testimonials: {
      coverPhoto: "cover_photo"
    },

    teams: {
      logoUrl: "logo_url",
      githubUrl: "github_url",
      websiteUrl: "website_url",
      membersCount: "members_count"
    },

    members: {
      joinedAt: "joined_at"
    }

  };


  // =========================================================
  // FRONTEND -> DATABASE
  // =========================================================

  function toDb(table, value) {
    const map = FIELD_MAP[table];

    if (!map || !value) {
      return value;
    }

    const out = {};

    for (const [key, val] of Object.entries(value)) {
      out[map[key] || key] = val;
    }

    return out;
  }


  // =========================================================
  // DATABASE -> FRONTEND
  // =========================================================

  function fromDb(table, value) {
    const map = FIELD_MAP[table];

    if (!map || !value) {
      return value;
    }

    const reverse = Object.fromEntries(
      Object.entries(map).map(([a, b]) => [b, a])
    );

    const out = {};

    for (const [key, val] of Object.entries(value)) {
      out[reverse[key] || key] = val;
    }

    return out;
  }


  function fromDbList(table, list) {
    return (list || []).map((row) => fromDb(table, row));
  }


  // =========================================================
  // ENTITY TABLES
  // =========================================================

  const ENTITY_TABLES = [
    "events",
    "projects",
    "contributors",
    "testimonials",
    "members",
    "teams"
  ];


  const PUBLISHED_TABLES = new Set([
    "events",
    "projects"
  ]);


  const APPROVED_TABLES = new Set([
    "testimonials"
  ]);


  function matchEntity(path) {

    for (const table of ENTITY_TABLES) {

      if (path === `/${table}`) {
        return {
          table,
          mode: "public-list"
        };
      }

      if (path === `/${table}/admin/all`) {
        return {
          table,
          mode: "admin-list"
        };
      }

      const match = path.match(
        new RegExp(`^/${table}/([^/]+)$`)
      );

      if (match) {
        return {
          table,
          mode: "item",
          id: match[1]
        };
      }
    }

    return null;
  }


  // =========================================================
  // API OBJECT
  // =========================================================

  const Api = {

    _session: null,

    _authListenerInstalled: false,


    // =======================================================
    // INITIALIZE
    // =======================================================

    async init() {

      const client = getClient();

      const {
        data,
        error
      } = await client.auth.getSession();

      if (error) {
        console.warn(
          "DragonByte session check:",
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


      return Api._session;
    },


    // =======================================================
    // AUTH CHECK
    // =======================================================

    isAuthed() {
      return !!Api._session;
    },


    // =======================================================
    // LOGIN
    // =======================================================

    async login(email, password) {

      if (!email || !password) {
        throw new Error(
          "Email and password are required."
        );
      }

      const client = getClient();

      const {
        data,
        error
      } = await client.auth.signInWithPassword({

        email: email.trim(),

        password: password

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


      return data;
    },


    // =======================================================
    // LOGOUT
    // =======================================================

    async logout() {

      const client = getClient();

      const {
        error
      } = await client.auth.signOut();


      if (error) {
        throw error;
      }


      Api._session = null;

      localStorage.removeItem(
        "db_admin_token"
      );


      return true;
    },


    // =======================================================
    // GET
    // =======================================================

    async get(path) {

      const client = getClient();


      // -----------------------------------------------------
      // ADMIN STATS
      // -----------------------------------------------------

      if (path === "/admin/stats") {

        const {
          data,
          error
        } = await client.rpc("admin_stats");


        if (error) {
          throw error;
        }


        return data || {};
      }


      // -----------------------------------------------------
      // PUBLIC CTF CHALLENGES
      // -----------------------------------------------------

      if (path === "/ctf/challenges") {

        const {
          data,
          error
        } = await client
          .from("public_challenges")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          );


        if (error) {
          throw error;
        }


        return (data || []).map(
          (row) => ({
            ...row,
            solvedCount: row.solved_count
          })
        );
      }


      // -----------------------------------------------------
      // ADMIN CTF CHALLENGES
      // -----------------------------------------------------

      if (path === "/ctf/challenges/admin/all") {

        const {
          data,
          error
        } = await client
          .from("admin_challenges")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          );


        if (error) {
          throw error;
        }


        return (data || []).map(
          (row) => ({
            ...row,
            hasFlag: row.has_flag
          })
        );
      }


      // -----------------------------------------------------
      // LEADERBOARD
      // -----------------------------------------------------

      if (path === "/ctf/leaderboard") {

        const {
          data,
          error
        } = await client
          .from("leaderboard")
          .select("*");


        if (error) {
          throw error;
        }


        return (data || []).map(
          (row) => ({

            handle: row.handle,

            points: row.points,

            solves: row.solves,

            lastSolveAt: row.last_solve_at

          })
        );
      }


      // -----------------------------------------------------
      // CTF STATS
      // -----------------------------------------------------

      if (path === "/ctf/stats") {

        const [
          {
            data: challenges,
            error: cErr
          },

          {
            data: leaderboard,
            error: lErr
          }

        ] = await Promise.all([

          client
            .from("public_challenges")
            .select("*"),

          client
            .from("leaderboard")
            .select("*")

        ]);


        if (cErr) {
          throw cErr;
        }

        if (lErr) {
          throw lErr;
        }


        const rows = challenges || [];


        return {

          challenges: rows.length,

          categories:
            new Set(
              rows
                .map(
                  (row) => row.category
                )
                .filter(Boolean)
            ).size,

          totalPoints:
            rows.reduce(
              (sum, row) =>
                sum +
                Number(
                  row.points || 0
                ),
              0
            ),

          solvedChallenges:
            rows.filter(
              (row) =>
                Number(
                  row.solved_count || 0
                ) > 0
            ).length,

          totalSolves:
            (leaderboard || []).reduce(
              (sum, row) =>
                sum +
                Number(
                  row.solves || 0
                ),
              0
            )

        };
      }


      // -----------------------------------------------------
      // JOIN REQUESTS
      // -----------------------------------------------------

      if (path === "/join") {

        const {
          data,
          error
        } = await client
          .from("join_requests")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          );


        if (error) {
          throw error;
        }


        return data || [];
      }


      // -----------------------------------------------------
      // CONTACT MESSAGES
      // -----------------------------------------------------

      if (path === "/contact") {

        const {
          data,
          error
        } = await client
          .from("messages")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false
            }
          );


        if (error) {
          throw error;
        }


        return data || [];
      }


      // -----------------------------------------------------
      // NORMAL TABLES
      // -----------------------------------------------------

      const entity = matchEntity(path);


      if (
        entity &&
        entity.mode !== "item"
      ) {

        let query =
          client
            .from(entity.table)
            .select("*");


        if (
          entity.table !== "members" &&
          entity.table !== "teams"
        ) {

          query =
            query.order(
              "created_at",
              {
                ascending: false
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

            query =
              query.eq(
                "published",
                true
              );

          }


          if (
            APPROVED_TABLES.has(
              entity.table
            )
          ) {

            query =
              query.eq(
                "approved",
                true
              );

          }

        }


        const {
          data,
          error
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


    // =======================================================
    // POST
    // =======================================================

    async post(path, body) {

      const client = getClient();


      // -----------------------------------------------------
      // JOIN
      // -----------------------------------------------------

      if (path === "/join") {

        const {
          error
        } = await client
          .from("join_requests")
          .insert(body);


        if (error) {
          throw error;
        }


        return {
          ok: true
        };
      }


      // -----------------------------------------------------
      // CONTACT
      // -----------------------------------------------------

      if (path === "/contact") {

        const {
          error
        } = await client
          .from("messages")
          .insert(body);


        if (error) {
          throw error;
        }


        return {
          ok: true
        };
      }


      // -----------------------------------------------------
      // CTF FLAG SUBMISSION
      // -----------------------------------------------------

      if (path === "/ctf/submit") {

        const {
          data,
          error
        } = await client.rpc(
          "submit_flag",
          {

            p_challenge_id:
              body.challengeId,

            p_handle:
              body.handle,

            p_flag:
              body.flag

          }
        );


        if (error) {
          throw error;
        }


        return {

          ok: true,

          points: data

        };
      }


      // -----------------------------------------------------
      // CREATE CTF CHALLENGE
      // -----------------------------------------------------

      if (path === "/ctf/challenges") {

        const {
          data,
          error
        } = await client.rpc(
          "admin_create_challenge",
          {

            p_title:
              body.title,

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
              body.published !== false

          }
        );


        if (error) {
          throw error;
        }


        return {
          id: data
        };
      }


      // -----------------------------------------------------
      // CHANGE PASSWORD
      // -----------------------------------------------------

      if (
        path ===
        "/auth/change-password"
      ) {

        const {
          data: userData,
          error: userError
        } =
          await client.auth.getUser();


        if (
          userError ||
          !userData?.user
        ) {

          throw new Error(
            "Not signed in"
          );

        }


        const {
          error: reauthError
        } =
          await client.auth
            .signInWithPassword({

              email:
                userData.user.email,

              password:
                body.currentPassword

            });


        if (reauthError) {

          throw new Error(
            "Current password is incorrect"
          );

        }


        const {
          error
        } =
          await client.auth.updateUser({

            password:
              body.newPassword

          });


        if (error) {
          throw error;
        }


        return {
          ok: true
        };
      }


      // -----------------------------------------------------
      // NORMAL TABLE INSERT
      // -----------------------------------------------------

      const entity =
        matchEntity(path);


      if (
        entity &&
        entity.mode === "public-list"
      ) {

        const {
          data,
          error
        } =
          await client
            .from(entity.table)
            .insert(
              toDb(
                entity.table,
                body
              )
            )
            .select()
            .single();


        if (error) {
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


    // =======================================================
    // PUT / UPDATE
    // =======================================================

    async put(path, body) {

      const client = getClient();


      // -----------------------------------------------------
      // JOIN REQUEST
      // -----------------------------------------------------

      if (
        path.startsWith("/join/")
      ) {

        const id =
          path.split("/")[2];


        if (
          body?.status === "approved"
        ) {

          const {
            error
          } =
            await client.rpc(
              "admin_approve_join_request",
              {
                p_id: id
              }
            );


          if (error) {
            throw error;
          }

        } else {

          const {
            error
          } =
            await client
              .from("join_requests")
              .update(body)
              .eq("id", id);


          if (error) {
            throw error;
          }

        }


        return {
          ok: true
        };
      }


      // -----------------------------------------------------
      // CONTACT MESSAGE
      // -----------------------------------------------------

      if (
        path.startsWith("/contact/")
      ) {

        const id =
          path.split("/")[2];


        const {
          error
        } =
          await client
            .from("messages")
            .update(body)
            .eq("id", id);


        if (error) {
          throw error;
        }


        return {
          ok: true
        };
      }


      // -----------------------------------------------------
      // UPDATE CTF CHALLENGE
      // -----------------------------------------------------

      if (
        path.startsWith(
          "/ctf/challenges/"
        )
      ) {

        const id =
          path.split("/")[3];


        const {
          error
        } =
          await client.rpc(
            "admin_update_challenge",
            {

              p_id:
                id,

              p_title:
                body.title,

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
                body.published !== false

            }
          );


        if (error) {
          throw error;
        }


        return {
          ok: true
        };
      }


      // -----------------------------------------------------
      // NORMAL TABLE UPDATE
      // -----------------------------------------------------

      const entity =
        matchEntity(path);


      if (
        entity &&
        entity.mode === "item"
      ) {

        const {
          data,
          error
        } =
          await client
            .from(entity.table)
            .update(
              toDb(
                entity.table,
                body
              )
            )
            .eq(
              "id",
              entity.id
            )
            .select()
            .single();


        if (error) {
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


    // =======================================================
    // DELETE
    // =======================================================

    async del(path, id) {

      const client = getClient();


      // -----------------------------------------------------
      // DELETE JOIN REQUEST
      // -----------------------------------------------------

      if (
        path.startsWith("/join/")
      ) {

        const rowId =
          path.split("/")[2];


        const {
          error
        } =
          await client
            .from("join_requests")
            .delete()
            .eq(
              "id",
              rowId
            );


        if (error) {
          throw error;
        }


        return null;
      }


      // -----------------------------------------------------
      // DELETE CONTACT MESSAGE
      // -----------------------------------------------------

      if (
        path.startsWith("/contact/")
      ) {

        const rowId =
          path.split("/")[2];


        const {
          error
        } =
          await client
            .from("messages")
            .delete()
            .eq(
              "id",
              rowId
            );


        if (error) {
          throw error;
        }


        return null;
      }


      // -----------------------------------------------------
      // DELETE CTF CHALLENGE
      // -----------------------------------------------------

      if (
        path.startsWith(
          "/ctf/challenges/"
        )
      ) {

        const rowId =
          path.split("/")[3];


        const {
          error
        } =
          await client
            .from("challenges")
            .delete()
            .eq(
              "id",
              rowId
            );


        if (error) {
          throw error;
        }


        return null;
      }


      // -----------------------------------------------------
      // DELETE NORMAL ENTITY
      // -----------------------------------------------------

      const entity =
        matchEntity(path);


      const rowId =
        id ||
        entity?.id;


      if (
        entity &&
        entity.mode === "item" &&
        rowId
      ) {

        const {
          error
        } =
          await client
            .from(entity.table)
            .delete()
            .eq(
              "id",
              rowId
            );


        if (error) {
          throw error;
        }


        return null;
      }


      throw new Error(
        `No Supabase mapping for DELETE ${path}`
      );
    }

  };


  // =========================================================
  // GLOBALS
  // =========================================================

  window.Api = Api;

  window.supabaseClient =
    window.supabaseClient || null;

  window.API_TABLES =
    API_TABLES;


  // =========================================================
  // HTML ESCAPE HELPER
  // =========================================================

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


  // =========================================================
  // INITIALIZE IF SUPABASE IS ALREADY LOADED
  // =========================================================

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
    "DragonByte API ready!"
  );

})();