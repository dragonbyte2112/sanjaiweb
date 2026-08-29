// =====================================================
// DragonByte Supabase Client
// =====================================================

(function () {
  "use strict";

  // Prevent duplicate initialization
  if (window.supabaseClient) {
    console.log("DragonByte Supabase client already initialized.");
    return;
  }

  // Supabase library check
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error(
      "DragonByte Supabase Error: Supabase JavaScript library is not loaded."
    );
    return;
  }

  // Config check
  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "DragonByte Supabase Error: SUPABASE_URL or SUPABASE_ANON_KEY is missing."
    );
    return;
  }

  // Create client
  try {
    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    // Backwards compatibility
    window.supabaseClientInstance = window.supabaseClient;

    console.log("DragonByte Supabase client initialized successfully.");
  } catch (error) {
    console.error(
      "DragonByte Supabase initialization failed:",
      error
    );
  }
})();