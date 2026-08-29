// /assets/js/home.js

"use strict";

// -------------------------------------
// HTML ESCAPE
// -------------------------------------

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
    if (!window.Api || typeof window.Api.get !== "function") {
      throw new Error("DragonByte API is not available.");
    }

    const events = await window.Api.get("/events");
    const limitedEvents = Array.isArray(events)
      ? events.slice(0, 3)
      : [];

    if (!limitedEvents.length) {
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

    el.innerHTML = limitedEvents
      .map(
        (event) => `
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
                ${esc(event.title || "Untitled Event")}
              </h3>

              <p class="text-sm text-muted mb-3">
                ${esc(event.description || "")}
              </p>

              <div class="text-xs text-muted mb-3">
                📍 ${esc(event.location || "TBA")}
                &nbsp;·&nbsp;
                🗓 ${esc(
                  event.date ||
                    event.eventDate ||
                    event.event_date ||
                    "TBA"
                )}
              </div>

              ${
                event.registrationUrl ||
                event.registration_url
                  ? `
                    <a
                      href="${esc(
                        event.registrationUrl ||
                          event.registration_url
                      )}"
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
        `
      )
      .join("");
  } catch (error) {
    console.error("Home events error:", error);

    el.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load events
        </h3>

        <p class="text-sm text-muted">
          ${esc(error?.message || "Unable to load events.")}
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
    if (!window.Api || typeof window.Api.get !== "function") {
      throw new Error("DragonByte API is not available.");
    }

    const projects = await window.Api.get("/projects");
    const limitedProjects = Array.isArray(projects)
      ? projects.slice(0, 3)
      : [];

    if (!limitedProjects.length) {
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

    el.innerHTML = limitedProjects
      .map(
        (project) => `
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
                ${esc(project.name || project.title || "Untitled Project")}
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
                        .map(
                          (tech) => `
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
                          `
                        )
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
                  project.githubUrl ||
                  project.github_url
                    ? `
                      <a
                        href="${esc(
                          project.githubUrl ||
                            project.github_url
                        )}"
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
                  project.demoUrl ||
                  project.demo_url
                    ? `
                      <a
                        href="${esc(
                          project.demoUrl ||
                            project.demo_url
                        )}"
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
        `
      )
      .join("");
  } catch (error) {
    console.error("Home projects error:", error);

    el.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load projects
        </h3>

        <p class="text-sm text-muted">
          ${esc(error?.message || "Unable to load projects.")}
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
    if (!window.Api || typeof window.Api.get !== "function") {
      throw new Error("DragonByte API is not available.");
    }

    const contributors = await window.Api.get("/contributors");
    const limitedContributors = Array.isArray(contributors)
      ? contributors.slice(0, 3)
      : [];

    if (!limitedContributors.length) {
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

    el.innerHTML = limitedContributors
      .map(
        (member) => `
          <div class="card text-center">

            ${
              member.imageUrl ||
              member.image_url
                ? `
                  <img
                    src="${esc(
                      member.imageUrl ||
                        member.image_url
                    )}"
                    alt="${esc(member.name || "Member")}"
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
              ${esc(member.name || "Member")}
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
        `
      )
      .join("");
  } catch (error) {
    console.error("Home contributors error:", error);

    el.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load members
        </h3>

        <p class="text-sm text-muted">
          ${esc(error?.message || "Unable to load members.")}
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
    if (!window.Api || typeof window.Api.get !== "function") {
      throw new Error("DragonByte API is not available.");
    }

    const testimonials = await window.Api.get("/testimonials");
    const limitedTestimonials = Array.isArray(testimonials)
      ? testimonials.slice(0, 3)
      : [];

    if (!limitedTestimonials.length) {
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

    el.innerHTML = limitedTestimonials
      .map(
        (item) => `
          <div class="card">

            <p class="text-sm mb-3">
              "${esc(
                item.quote ||
                  item.message ||
                  item.content ||
                  ""
              )}"
            </p>

            <div
              class="text-sm"
              style="font-weight:600;"
            >
              ${esc(item.name || "Anonymous")}
            </div>

            <div class="text-xs text-muted">
              ${esc(item.role || "")}
            </div>

          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Home testimonials error:", error);

    el.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load testimonials
        </h3>

        <p class="text-sm text-muted">
          ${esc(
            error?.message ||
              "Unable to load testimonials."
          )}
        </p>
      </div>
    `;
  }
}

// -------------------------------------
// START
// -------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  loadHomeEvents();
  loadHomeProjects();
  loadHomeContributors();
  loadHomeTestimonials();
});