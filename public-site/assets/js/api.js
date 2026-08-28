const API_TABLES = {
  "/events": "events",
  "/projects": "projects",
  "/contributors": "contributors",
  "/testimonials": "testimonials",
};

const Api = {
  async get(path) {
    const table = API_TABLES[path];

    if (!table) {
      throw new Error(`Unknown API endpoint: ${path}`);
    }

    const { data, error } = await supabaseClient
      .from(table)
      .select("*");

    if (error) {
      console.error(`Supabase error (${table}):`, error);
      throw error;
    }

    return data || [];
  },

  async post(path, body) {
    const table = API_TABLES[path];

    if (!table) {
      throw new Error(`Unknown API endpoint: ${path}`);
    }

    const { data, error } = await supabaseClient
      .from(table)
      .insert(body)
      .select();

    if (error) throw error;

    return data;
  },

  async put(path, body) {
    throw new Error("PUT endpoint needs to be configured with the table ID.");
  },

  async del(path) {
    throw new Error("DELETE endpoint needs to be configured with the table ID.");
  },

  isAuthed() {
    return !!localStorage.getItem("db_admin_token");
  },

  logout() {
    localStorage.removeItem("db_admin_token");
  }
};

function esc(str) {
  if (str === null || str === undefined) return "";

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}