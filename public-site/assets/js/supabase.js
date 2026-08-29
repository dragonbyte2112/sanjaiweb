// =====================================================
// DragonByte — Supabase Configuration
// =====================================================

const SUPABASE_URL =
  "https://lfwwslohugqojibcpkys.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_4OBUm9wgJwRAqN9hi8QLOw_5WYgQcUG";


// =====================================================
// Create Supabase Client
// =====================================================

window.supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

console.log("DragonByte Supabase connected!");


// =====================================================
// HTML Escape Helper
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
// Supabase Auth Helpers
// =====================================================

window.DragonByteAuth = {

  // Get current session
  async getSession() {

    const {
      data,
      error
    } = await window.supabaseClient.auth.getSession();

    if (error) {
      console.error(
        "Supabase session error:",
        error
      );

      throw error;
    }

    return data.session;
  },


  // Get current user
  async getUser() {

    const {
      data,
      error
    } = await window.supabaseClient.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  },


  // Login
  async login(email, password) {

    const {
      data,
      error
    } = await window.supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      console.error(
        "Supabase login error:",
        error
      );

      throw error;
    }

    return data;
  },


  // Register
  async register(email, password) {

    const {
      data,
      error
    } = await window.supabaseClient.auth.signUp({
      email: email.trim(),
      password: password
    });

    if (error) {
      console.error(
        "Supabase registration error:",
        error
      );

      throw error;
    }

    return data;
  },


  // Logout
  async logout() {

    const {
      error
    } = await window.supabaseClient.auth.signOut();

    if (error) {
      console.error(
        "Supabase logout error:",
        error
      );

      throw error;
    }

    return true;
  }

};


// =====================================================
// Auth State Listener
// =====================================================

window.supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "DragonByte Auth:",
      event
    );

    window.dispatchEvent(
      new CustomEvent(
        "dragonbyte-auth-change",
        {
          detail: {
            event,
            session
          }
        }
      )
    );

  }
);