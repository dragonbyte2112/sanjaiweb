// /assets/js/home.js

"use strict";

function esc(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// -------------------------------------
// EVENTS
// -------------------------------------

async function loadHomeEvents() {
  const el = document.getElementById("home-events");

  if (!el) return;

  try {
    const events = await DragonByteData.getEvents(3);

    if (!events.length) {
      el.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">📅</div>
          <h3 class="h3 mb-1">No upcoming events</h3>
          <p class="text-sm text-muted">
            New cybersecurity events will appear here.
          </p>
        </div>
      `;
      return;
    }

    el.innerHTML = events.map(event => `
      <div class="card" style="padding:0; overflow:hidden;">

        <div style="
          height:150px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:linear-gradient(135deg,#eff6ff,#e0f2fe);
          font-size:2.5rem;
        ">
          📅
        </div>

        <div style="padding:20px;">

          <span class="badge badge-blue">
            ${esc(event.category || "Event")}
          </span>

          <h3 class="h3 mt-2 mb-1">
            ${esc(event.title)}
          </h3>

          <p class="text-sm text-muted mb-3">
            ${esc(event.description || "")}
          </p>

          <div class="text-xs text-muted mb-3">
            📍 ${esc(event.location || "TBA")}
            &nbsp;·&nbsp;
            🗓 ${esc(event.date || "TBA")}
          </div>

          ${
            event.registrationUrl
              ? `
                <a
                  href="${esc(event.registrationUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary btn-sm"
                >
                  Register
                </a>
              `
              : ""
          }

        </div>
      </div>
    `).join("");

  } catch (error) {

    console.error("Home events error:", error);

    el.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load events
        </h3>

        <p class="text-sm text-muted">
          ${esc(error.message)}
        </p>
      </div>
    `;
  }
}


// -------------------------------------
// PROJECTS
// -------------------------------------

async function loadHomeProjects() {
  const el = document.getElementById("home-projects");

  if (!el) return;

  try {

    const projects = await DragonByteData.getProjects(3);

    if (!projects.length) {

      el.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">🔧</div>

          <h3 class="h3 mb-1">
            No projects yet
          </h3>

          <p class="text-sm text-muted">
            Community projects will appear here.
          </p>
        </div>
      `;

      return;
    }

    el.innerHTML = projects.map(project => `

      <div class="card" style="padding:0; overflow:hidden;">

        <div style="
          height:150px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:linear-gradient(135deg,#f0fdf4,#ecfeff);
          font-size:2.5rem;
        ">
          🔧
        </div>

        <div style="padding:20px;">

          <h3 class="h3 mb-1">
            ${esc(project.name)}
          </h3>

          <p class="text-sm text-muted mb-3">
            ${esc(project.description || "")}
          </p>

          ${
            Array.isArray(project.technologies) &&
            project.technologies.length
              ? `
                <div
                  class="flex gap-2 mb-3"
                  style="flex-wrap:wrap;"
                >
                  ${project.technologies
                    .slice(0, 3)
                    .map(tech => `
                      <span
                        class="text-xs mono"
                        style="
                          color:#0891b2;
                          background:#ecfeff;
                          padding:2px 8px;
                          border-radius:6px;
                        "
                      >
                        ${esc(tech)}
                      </span>
                    `)
                    .join("")}
                </div>
              `
              : ""
          }

          <div
            class="flex gap-2"
            style="flex-wrap:wrap;"
          >

            ${
              project.githubUrl
                ? `
                  <a
                    href="${esc(project.githubUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-outline btn-sm"
                  >
                    GitHub
                  </a>
                `
                : ""
            }

            ${
              project.demoUrl
                ? `
                  <a
                    href="${esc(project.demoUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-primary btn-sm"
                  >
                    Live Demo
                  </a>
                `
                : ""
            }

          </div>

        </div>

      </div>

    `).join("");

  } catch (error) {

    console.error("Home projects error:", error);

    el.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load projects
        </h3>

        <p class="text-sm text-muted">
          ${esc(error.message)}
        </p>
      </div>
    `;
  }
}


// -------------------------------------
// CONTRIBUTORS
// -------------------------------------

async function loadHomeContributors() {

  const el = document.getElementById("home-contributors");

  if (!el) return;

  try {

    const contributors =
      await DragonByteData.getContributors(3);

    if (!contributors.length) {

      el.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">👥</div>

          <h3 class="h3 mb-1">
            No featured members yet
          </h3>

          <p class="text-sm text-muted">
            Featured community members will appear here.
          </p>
        </div>
      `;

      return;
    }

    el.innerHTML = contributors.map(member => `

      <div class="card text-center">

        ${
          member.imageUrl
            ? `
              <img
                src="${esc(member.imageUrl)}"
                alt="${esc(member.name)}"
                style="
                  width:80px;
                  height:80px;
                  border-radius:50%;
                  object-fit:cover;
                  margin:0 auto 15px;
                "
              >
            `
            : `
              <div style="
                width:80px;
                height:80px;
                border-radius:50%;
                margin:0 auto 15px;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#eff6ff;
                font-size:2rem;
              ">
                👤
              </div>
            `
        }

        <h3 class="h3 mb-1">
          ${esc(member.name)}
        </h3>

        <p
          class="text-sm"
          style="color:var(--primary);"
        >
          ${esc(member.role || "")}
        </p>

        <p class="text-sm text-muted mt-2">
          ${esc(member.bio || "")}
        </p>

      </div>

    `).join("");

  } catch (error) {

    console.error("Home contributors error:", error);

    el.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load members
        </h3>

        <p class="text-sm text-muted">
          ${esc(error.message)}
        </p>
      </div>
    `;
  }
}


// -------------------------------------
// TESTIMONIALS
// -------------------------------------

async function loadHomeTestimonials() {

  const el = document.getElementById("home-testimonials");

  if (!el) return;

  try {

    const testimonials =
      await DragonByteData.getTestimonials(3);

    if (!testimonials.length) {

      el.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">💬</div>

          <h3 class="h3 mb-1">
            No testimonials yet
          </h3>

          <p class="text-sm text-muted">
            Community feedback will appear here.
          </p>
        </div>
      `;

      return;
    }

    el.innerHTML = testimonials.map(item => `

      <div class="card">

        <p class="text-sm mb-3">
          "${esc(item.quote)}"
        </p>

        <div
          class="text-sm"
          style="font-weight:600;"
        >
          ${esc(item.name)}
        </div>

        <div class="text-xs text-muted">
          ${esc(item.role || "")}
        </div>

      </div>

    `).join("");

  } catch (error) {

    console.error("Home testimonials error:", error);

    el.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load testimonials
        </h3>

        <p class="text-sm text-muted">
          ${esc(error.message)}
        </p>
      </div>
    `;
  }
}


// -------------------------------------
// START
// -------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  loadHomeEvents();

  loadHomeProjects();

  loadHomeContributors();

  loadHomeTestimonials();

});