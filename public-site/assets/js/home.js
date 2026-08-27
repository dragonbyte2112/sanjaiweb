function emptyState(icon, title, desc) {
  return `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">${icon}</div><h3 class="h3 mb-1">${title}</h3><p class="text-sm text-muted">${desc}</p></div>`;
}

async function loadEvents() {
  const el = document.getElementById("home-events");
  try {
    const events = await Api.get("/events");
    if (!events.length) {
      el.innerHTML = emptyState("📅", "No upcoming events yet", "Check back soon — new events are added regularly.");
      return;
    }
    el.innerHTML = events
      .slice(0, 3)
      .map(
        (e) => `
      <div class="card card-hover">
        <span class="badge badge-blue mb-2">${esc(e.category || "Event")}</span>
        <h3 class="h3 mb-1">${esc(e.title)}</h3>
        <p class="text-sm text-muted mb-3">${esc(e.description || "")}</p>
        <div class="text-xs text-muted">${esc(e.date || "")} ${e.time ? "· " + esc(e.time) : ""}</div>
        <div class="text-xs text-muted">${esc(e.location || "")}</div>
      </div>`,
      )
      .join("");
  } catch {
    el.innerHTML = emptyState("⚠️", "Couldn't load events", "Is the backend server running?");
  }
}

async function loadProjects() {
  const el = document.getElementById("home-projects");
  try {
    const projects = await Api.get("/projects");
    if (!projects.length) {
      el.innerHTML = emptyState("🔧", "No projects yet", "Community projects will show up here as they're published.");
      return;
    }
    el.innerHTML = projects
      .slice(0, 3)
      .map(
        (p) => `
      <div class="card card-hover">
        <span class="badge badge-purple mb-2">${esc(p.category || "Project")}</span>
        <h3 class="h3 mb-1">${esc(p.name)}</h3>
        <p class="text-sm text-muted">${esc(p.description || "")}</p>
      </div>`,
      )
      .join("");
  } catch {
    el.innerHTML = emptyState("⚠️", "Couldn't load projects", "Is the backend server running?");
  }
}

async function loadContributors() {
  const el = document.getElementById("home-contributors");
  try {
    const contributors = await Api.get("/contributors");
    const featured = contributors.filter((c) => c.featured);
    const list = featured.length ? featured : contributors;
    if (!list.length) {
      el.innerHTML = emptyState("⭐", "No featured members yet", "Community members will be showcased here.");
      return;
    }
    el.innerHTML = list
      .slice(0, 3)
      .map(
        (c) => `
      <div class="card card-hover text-center">
        <h3 class="h3 mb-1">${esc(c.name)}</h3>
        <p class="text-sm" style="color:var(--primary);">${esc(c.role || "")}</p>
        <p class="text-sm text-muted mt-2">${esc(c.bio || "")}</p>
      </div>`,
      )
      .join("");
  } catch {
    el.innerHTML = emptyState("⚠️", "Couldn't load members", "Is the backend server running?");
  }
}

async function loadTestimonials() {
  const el = document.getElementById("home-testimonials");
  try {
    const testimonials = await Api.get("/testimonials");
    if (!testimonials.length) {
      el.innerHTML = emptyState("💬", "No testimonials yet", "Member testimonials will appear here once approved.");
      return;
    }
    el.innerHTML = testimonials
      .slice(0, 3)
      .map(
        (t) => `
      <div class="card">
        <p class="text-sm mb-3">"${esc(t.quote)}"</p>
        <div class="text-sm" style="font-weight:600;">${esc(t.name)}</div>
        <div class="text-xs text-muted">${esc(t.role || "")}</div>
      </div>`,
      )
      .join("");
  } catch {
    el.innerHTML = emptyState("⚠️", "Couldn't load testimonials", "Is the backend server running?");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  loadProjects();
  loadContributors();
  loadTestimonials();
});
