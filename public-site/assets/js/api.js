/* =========================================================
   DragonByte API - Supabase
   Public frontend + Admin
   ========================================================= */

(function () {
  "use strict";

  // =========================================================
  // NEW DRAGONBYTE SUPABASE PROJECT
  // =========================================================

  const SUPABASE_URL =
    "https://khjmouwldnjwzvdxnbty.supabase.co";

  // PUBLIC ANON KEY ONLY.
  // NEVER put sb_secret_... here.
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoam1vdXdsZG5qd3p2ZHhuYnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNjE0MjUsImV4cCI6MjEwMzYzNzQyNX0.pmU13DeACsbQQweV-7QLY_mYfqtRL9JWZXr18DQY1Rs";

  const STORAGE_BUCKET = "dragonbyte-media";

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
        "Supabase library is not loaded. Load @supabase/supabase-js before dragonbyte-api.js."
      );
    }

    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    console.log("DragonByte Supabase connected:", SUPABASE_URL);

    return window.supabaseClient;
  }

  // =========================================================
  // TABLE MAP
  // =========================================================

  const API_TABLES = {
    "/events": "events",
    "/projects": "projects",
    "/contributors": "contributors",
    "/testimonials": "testimonials",
    "/teams": "teams",
    "/members": "members",
  };

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

  // =========================================================
  // DATABASE FIELD MAP
  // =========================================================

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

  // =========================================================
  // REMOVE AUTO/IDENTITY FIELDS
  // IMPORTANT:
  // NEVER SEND id FROM CREATE FORM
  // =========================================================

  const AUTO_FIELDS = new Set([
    "id",
    "created_at",
    "updated_at",
  ]);

  function cleanPayload(value) {
    const output = {};

    if (!value || typeof value !== "object") {
      return output;
    }

    Object.entries(value).forEach(([key, val]) => {
      if (AUTO_FIELDS.has(key)) return;

      output[key] = val;
    });

    return output;
  }

  function toDb(table, value) {
    const map = FIELD_MAP[table] || {};
    const source = cleanPayload(value);
    const output = {};

    Object.entries(source).forEach(([key, val]) => {
      output[map[key] || key] = val;
    });

    return output;
  }

  function fromDb(table, value) {
    if (!value) return value;

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
    return (list || []).map((row) =>
      fromDb(table, row)
    );
  }

  // =========================================================
  // ENTITY PATH
  // =========================================================

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

  // =========================================================
  // FILE UPLOAD
  // =========================================================

  async function uploadImage(file, folder = "images") {
    if (!file) {
      throw new Error("Please select an image.");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error("Image must be smaller than 5 MB.");
    }

    const client = getClient();

    const extension =
      file.name.split(".").pop().toLowerCase() || "jpg";

    const safeName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}.${extension}`;

    const path = `${folder}/${safeName}`;

    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("Storage upload error:", error);
      throw new Error(
        `Image upload failed: ${error.message}`
      );
    }

    const { data } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error(
        "Image uploaded but public URL could not be generated."
      );
    }

    return data.publicUrl;
  }

  // =========================================================
  // API
  // =========================================================

  const Api = {
    _session: null,

    // -------------------------------------------------------
    // INIT
    // -------------------------------------------------------

    async init() {
      const client = getClient();

      const {
        data,
        error,
      } = await client.auth.getSession();

      if (error) {
        console.warn(
          "DragonByte session:",
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

    // -------------------------------------------------------
    // AUTH
    // -------------------------------------------------------

    isAuthed() {
      return !!Api._session;
    },

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

      return data;
    },

    async logout() {
      const client = getClient();

      const { error } =
        await client.auth.signOut();

      if (error) {
        throw error;
      }

      Api._session = null;

      localStorage.removeItem(
        "db_admin_token"
      );

      return true;
    },

    // -------------------------------------------------------
    // UPLOAD
    // -------------------------------------------------------

    uploadImage,

    // -------------------------------------------------------
    // GET
    // -------------------------------------------------------

    async get(path) {
      const client = getClient();

      // Dashboard stats
      if (path === "/admin/stats") {
        try {
          const {
            data,
            error,
          } = await client.rpc("admin_stats");

          if (!error) {
            return data || {};
          }
        } catch (_) {}

        // Safe fallback if RPC is unavailable
        const tables = [
          "members",
          "events",
          "projects",
          "testimonials",
          "challenges",
        ];

        const stats = {
          members: 0,
          events: 0,
          projects: 0,
          testimonials: 0,
          challenges: 0,
          joinRequests: 0,
          messages: 0,
          ctfSolves: 0,
        };

        for (const table of tables) {
          try {
            const { count } = await client
              .from(table)
              .select("*", {
                count: "exact",
                head: true,
              });

            if (table === "members")
              stats.members = count || 0;

            if (table === "events")
              stats.events = count || 0;

            if (table === "projects")
              stats.projects = count || 0;

            if (table === "testimonials")
              stats.testimonials = count || 0;

            if (table === "challenges")
              stats.challenges = count || 0;
          } catch (_) {}
        }

        return stats;
      }

      // CTF public
      if (path === "/ctf/challenges") {
        const {
          data,
          error,
        } = await client
          .from("public_challenges")
          .select("*");

        if (error) throw error;

        return (data || []).map((row) => ({
          ...row,
          solvedCount: row.solved_count,
        }));
      }

      // CTF admin
      if (path === "/ctf/challenges/admin/all") {
        const {
          data,
          error,
        } = await client
          .from("admin_challenges")
          .select("*");

        if (error) throw error;

        return (data || []).map((row) => ({
          ...row,
          hasFlag: row.has_flag,
        }));
      }

      // Leaderboard
      if (path === "/ctf/leaderboard") {
        const {
          data,
          error,
        } = await client
          .from("leaderboard")
          .select("*");

        if (error) throw error;

        return (data || []).map((row) => ({
          handle: row.handle,
          points: row.points,
          solves: row.solves,
          lastSolveAt: row.last_solve_at,
        }));
      }

      // CTF stats
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
              .map((x) => x.category)
              .filter(Boolean)
          ).size,

          totalPoints: challenges.reduce(
            (sum, x) =>
              sum + Number(x.points || 0),
            0
          ),

          solvedChallenges:
            challenges.filter(
              (x) =>
                Number(x.solved_count || 0) > 0
            ).length,

          totalSolves:
            leaderboard.reduce(
              (sum, x) =>
                sum + Number(x.solves || 0),
              0
            ),
        };
      }

      // Join requests
      if (path === "/join") {
        const {
          data,
          error,
        } = await client
          .from("join_requests")
          .select("*");

        if (error) throw error;

        return data || [];
      }

      // Messages
      if (path === "/contact") {
        const {
          data,
          error,
        } = await client
          .from("messages")
          .select("*");

        if (error) throw error;

        return data || [];
      }

      // Entities
      const entity = matchEntity(path);

      if (
        entity &&
        entity.mode !== "item"
      ) {
        let query = client
          .from(entity.table)
          .select("*");

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

        // IMPORTANT:
        // Do NOT order by created_at.
        // Your tables don't all have created_at.
        const {
          data,
          error,
        } = await query;

        if (error) throw error;

        return fromDbList(
          entity.table,
          data
        );
      }

      throw new Error(
        `No Supabase mapping for GET ${path}`
      );
    },

    // -------------------------------------------------------
    // POST
    // -------------------------------------------------------

    async post(path, body) {
      const client = getClient();

      if (path === "/join") {
        const { error } =
          await client
            .from("join_requests")
            .insert(
              cleanPayload(body)
            );

        if (error) throw error;

        return {
          ok: true,
        };
      }

      if (path === "/contact") {
        const { error } =
          await client
            .from("messages")
            .insert(
              cleanPayload(body)
            );

        if (error) throw error;

        return {
          ok: true,
        };
      }

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

        if (error) throw error;

        return {
          ok: true,
          points: data,
        };
      }

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

        if (error) throw error;

        return {
          id: data,
        };
      }

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

        if (error) throw error;

        return {
          ok: true,
        };
      }

      const entity = matchEntity(path);

      if (
        entity &&
        entity.mode === "public-list"
      ) {
        const safeBody =
          toDb(
            entity.table,
            body
          );

        const {
          data,
          error,
        } = await client
          .from(entity.table)
          .insert(safeBody)
          .select()
          .single();

        if (error) throw error;

        return fromDb(
          entity.table,
          data
        );
      }

      throw new Error(
        `No Supabase mapping for POST ${path}`
      );
    },

    // -------------------------------------------------------
    // PUT
    // -------------------------------------------------------

    async put(path, body) {
      const client = getClient();

      if (path.startsWith("/join/")) {
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

          if (error) throw error;
        } else {
          const {
            error,
          } = await client
            .from("join_requests")
            .update(
              cleanPayload(body)
            )
            .eq("id", id);

          if (error) throw error;
        }

        return {
          ok: true,
        };
      }

      if (
        path.startsWith("/contact/")
      ) {
        const id =
          path.split("/")[2];

        const {
          error,
        } = await client
          .from("messages")
          .update(
            cleanPayload(body)
          )
          .eq("id", id);

        if (error) throw error;

        return {
          ok: true,
        };
      }

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

        if (error) throw error;

        return {
          ok: true,
        };
      }

      const entity =
        matchEntity(path);

      if (
        entity &&
        entity.mode === "item"
      ) {
        const safeBody =
          toDb(
            entity.table,
            body
          );

        // NEVER update id.
        delete safeBody.id;

        const {
          data,
          error,
        } = await client
          .from(entity.table)
          .update(safeBody)
          .eq(
            "id",
            entity.id
          )
          .select()
          .single();

        if (error) throw error;

        return fromDb(
          entity.table,
          data
        );
      }

      throw new Error(
        `No Supabase mapping for PUT ${path}`
      );
    },

    // -------------------------------------------------------
    // DELETE
    // -------------------------------------------------------

    async del(path, id) {
      const client = getClient();

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

        if (error) throw error;

        return null;
      }

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

        if (error) throw error;

        return null;
      }

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

        if (error) throw error;

        return null;
      }

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
          .eq(
            "id",
            rowId
          );

        if (error) throw error;

        return null;
      }

      throw new Error(
        `No Supabase mapping for DELETE ${path}`
      );
    },
  };

  // =========================================================
  // GLOBALS
  // =========================================================

  window.Api = Api;

  window.supabaseClient =
    window.supabaseClient || null;

  window.SUPABASE_URL =
    SUPABASE_URL;

  window.SUPABASE_STORAGE_BUCKET =
    STORAGE_BUCKET;

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