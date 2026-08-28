// /assets/js/supabase-data.js

(function () {
  "use strict";

  if (!window.supabaseClient) {
    console.error("Supabase client not found.");
    return;
  }

  const client = window.supabaseClient;

  function normalize(row) {
    if (!row) return row;

    return {
      ...row,

      // Support both camelCase and snake_case database columns
      registrationUrl:
        row.registrationUrl ??
        row.registration_url ??
        "",

      githubUrl:
        row.githubUrl ??
        row.github_url ??
        "",

      demoUrl:
        row.demoUrl ??
        row.demo_url ??
        "",

      resourceUrl:
        row.resourceUrl ??
        row.resource_url ??
        "",

      profileUrl:
        row.profileUrl ??
        row.profile_url ??
        "",

      imageUrl:
        row.imageUrl ??
        row.image_url ??
        "",

      technologies:
        Array.isArray(row.technologies)
          ? row.technologies
          : []
    };
  }

  async function getTable(table, options = {}) {
    let query = client.from(table).select("*");

    if (options.orderBy) {
      query = query.order(
        options.orderBy,
        {
          ascending:
            options.ascending !== undefined
              ? options.ascending
              : false
        }
      );
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Supabase error [${table}]:`, error);
      throw error;
    }

    return (data || []).map(normalize);
  }

  // EVENTS
  async function getEvents(limit = null) {
    return getTable("events", {
      orderBy: "date",
      ascending: true,
      limit
    });
  }

  // PROJECTS
  async function getProjects(limit = null) {
    return getTable("projects", {
      orderBy: "created_at",
      ascending: false,
      limit
    });
  }

  // CONTRIBUTORS
  async function getContributors(limit = null) {
    return getTable("contributors", {
      orderBy: "created_at",
      ascending: false,
      limit
    });
  }

  // TESTIMONIALS
  async function getTestimonials(limit = null) {
    return getTable("testimonials", {
      orderBy: "created_at",
      ascending: false,
      limit
    });
  }

  // MEMBERS
  async function getMembers(limit = null) {
    return getTable("members", {
      orderBy: "created_at",
      ascending: false,
      limit
    });
  }

  // TEAMS
  async function getTeams(limit = null) {
    return getTable("teams", {
      orderBy: "created_at",
      ascending: false,
      limit
    });
  }

  window.DragonByteData = {
    getEvents,
    getProjects,
    getContributors,
    getTestimonials,
    getMembers,
    getTeams
  };

  console.log("DragonByte Supabase data layer loaded.");
})();