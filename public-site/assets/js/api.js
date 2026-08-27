// Same-origin by default since the backend now serves this site directly.
// Override by defining window.API_BASE before this script runs, if needed.
const API_BASE = window.API_BASE || "/api";
const TOKEN_KEY = "db_admin_token";

const Api = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  isAuthed() {
    return !!Api.getToken();
  },
  async request(path, options = {}) {
    const token = Api.getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 401) Api.setToken(null);

    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        message = body.error || message;
      } catch {
        /* non-JSON error body */
      }
      throw new Error(message);
    }
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },
  get(path) {
    return Api.request(path);
  },
  post(path, body) {
    return Api.request(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
  },
  put(path, body) {
    return Api.request(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined });
  },
  del(path) {
    return Api.request(path, { method: "DELETE" });
  },
  async login(username, password) {
    const data = await Api.post("/auth/login", { username, password });
    Api.setToken(data.token);
    return data;
  },
  logout() {
    Api.setToken(null);
  },
};

// Tiny helper: escape text before injecting into innerHTML templates.
function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
