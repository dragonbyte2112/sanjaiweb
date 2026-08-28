// DragonByte Supabase Data Helpers

function esc(str) {
  if (str === null || str === undefined) return "";

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===============================
// EVENTS
// ===============================

async function getEvents() {
  const { data, error } = await supabaseClient
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Supabase events error:", error);
    throw error;
  }

  return data || [];
}


// ===============================
// MEMBERS / CONTRIBUTORS
// ===============================

async function getMembers() {
  const { data, error } = await supabaseClient
    .from("contributors")
    .select("*");

  if (error) {
    console.error("Supabase contributors error:", error);
    throw error;
  }

  return data || [];
}


// ===============================
// FEATURED MEMBERS
// ===============================

async function getFeaturedMembers() {
  const { data, error } = await supabaseClient
    .from("contributors")
    .select("*")
    .eq("featured", true);

  if (error) {
    console.error("Supabase featured members error:", error);
    throw error;
  }

  return data || [];
}


// ===============================
// TESTIMONIALS
// ===============================

async function getTestimonials() {
  const { data, error } = await supabaseClient
    .from("testimonials")
    .select("*");

  if (error) {
    console.error("Supabase testimonials error:", error);
    throw error;
  }

  return data || [];
}


// ===============================
// PROJECTS
// ===============================

async function getProjects() {
  const { data, error } = await supabaseClient
    .from("projects")
    .select("*");

  if (error) {
    console.error("Supabase projects error:", error);
    throw error;
  }

  return data || [];
}