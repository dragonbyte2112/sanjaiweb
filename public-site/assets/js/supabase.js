/* =========================================================
   DragonByte - Supabase Client
========================================================= */

(function () {
  "use strict";

  const SUPABASE_URL =
    "https://khjmouwldnjwzvdxnbty.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_NHxQgBGJ4CrUFhiwRyT0fw_vMnibVQI";

  /* -------------------------------------------------------
     Check Supabase library
  ------------------------------------------------------- */

  if (!window.supabase) {
    console.error(
      "DragonByte: Supabase library was not loaded."
    );
    return;
  }

  /* -------------------------------------------------------
     Prevent duplicate client
  ------------------------------------------------------- */

  if (window.supabaseClient) {
    console.log(
      "DragonByte: Supabase client already exists."
    );
    return;
  }

  /* -------------------------------------------------------
     Create Supabase client
  ------------------------------------------------------- */

  try {
    window.supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );

    console.log(
      "DragonByte: Supabase connected!"
    );
  } catch (error) {
    console.error(
      "DragonByte: Failed to create Supabase client:",
      error
    );
  }

  /* -------------------------------------------------------
     Auth listener
  ------------------------------------------------------- */

  if (window.supabaseClient) {
    window.supabaseClient.auth.onAuthStateChange(
      function (event, session) {
        console.log(
          "DragonByte Auth:",
          event
        );

        if (
          session &&
          session.access_token
        ) {
          localStorage.setItem(
            "db_admin_token",
            session.access_token
          );
        }

        if (event === "SIGNED_OUT") {
          localStorage.removeItem(
            "db_admin_token"
          );
        }
      }
    );
  }
})();