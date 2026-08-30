// /public-site/assets/js/home.js

"use strict";

/* =========================================================
   DRAGONBYTE HOME PAGE
   Events + Projects + Contributors + Testimonials
   ========================================================= */


/* =========================================================
   HTML ESCAPE
   ========================================================= */

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


/* =========================================================
   IMAGE URL HELPER
   Supports all common field names
   ========================================================= */

function getImageUrl(item) {
  if (!item) return "";

  return (
    item.coverPhoto ||
    item.cover_photo ||
    item.coverPhotoUrl ||
    item.cover_photo_url ||
    item.image ||
    item.imageUrl ||
    item.image_url ||
    item.photo ||
    item.photoUrl ||
    item.photo_url ||
    ""
  );
}


/* =========================================================
   SAFE URL
   ========================================================= */

function safeUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value, window.location.href);

    if (
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {
      return url.href;
    }

    return "";
  } catch {
    return "";
  }
}


/* =========================================================
   API CHECK
   ========================================================= */

function checkApi() {
  if (
    !window.Api ||
    typeof window.Api.get !== "function"
  ) {
    throw new Error(
      "DragonByte API is not available."
    );
  }
}


/* =========================================================
   IMAGE FALLBACK
   ========================================================= */

function eventImageHtml(event) {
  const imageUrl = safeUrl(getImageUrl(event));

  if (imageUrl) {
    return `
      <div class="home-cover-image"
        style="
          width:100%;
          height:150px;
          overflow:hidden;
          background:#eff6ff;
        "
      >
        <img
          src="${esc(imageUrl)}"
          alt="${esc(event.title || "Event")}"
          loading="lazy"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
          "
          onerror="
            this.style.display='none';
            this.parentElement.classList.add('image-error');
          "
        >

        <div
          class="image-fallback-icon"
          style="
            display:none;
            width:100%;
            height:100%;
            align-items:center;
            justify-content:center;
            font-size:2.5rem;
            background:linear-gradient(135deg,#eff6ff,#e0f2fe);
          "
        >
          📅
        </div>
      </div>
    `;
  }

  return `
    <div
      style="
        width:100%;
        height:150px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:linear-gradient(135deg,#eff6ff,#e0f2fe);
        font-size:2.5rem;
      "
    >
      📅
    </div>
  `;
}


function projectImageHtml(project) {
  const imageUrl = safeUrl(getImageUrl(project));

  if (imageUrl) {
    return `
      <div class="home-cover-image"
        style="
          width:100%;
          height:150px;
          overflow:hidden;
          background:#f0fdf4;
        "
      >
        <img
          src="${esc(imageUrl)}"
          alt="${esc(
            project.name ||
            project.title ||
            "Project"
          )}"
          loading="lazy"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
          "
          onerror="
            this.style.display='none';
            this.parentElement.classList.add('image-error');
          "
        >

        <div
          class="image-fallback-icon"
          style="
            display:none;
            width:100%;
            height:100%;
            align-items:center;
            justify-content:center;
            font-size:2.5rem;
            background:linear-gradient(135deg,#f0fdf4,#ecfeff);
          "
        >
          🔧
        </div>
      </div>
    `;
  }

  return `
    <div
      style="
        width:100%;
        height:150px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:linear-gradient(135deg,#f0fdf4,#ecfeff);
        font-size:2.5rem;
      "
    >
      🔧
    </div>
  `;
}


/* =========================================================
   FIX IMAGE FALLBACK WHEN IMAGE URL IS BROKEN
   ========================================================= */

function enableImageFallbacks() {
  document
    .querySelectorAll(".home-cover-image")
    .forEach((container) => {
      const img = container.querySelector("img");
      const fallback =
        container.querySelector(
          ".image-fallback-icon"
        );

      if (!img || !fallback) return;

      img.addEventListener("error", () => {
        img.style.display = "none";
        fallback.style.display = "flex";
      });
    });
}


/* =========================================================
   EVENTS
   ========================================================= */

async function loadHomeEvents() {
  const el =
    document.getElementById("home-events");

  if (!el) return;

  try {
    checkApi();

    const events = await window.Api.get(
      "/events"
    );

    console.log(
      "DragonByte Home Events:",
      events
    );

    if (!Array.isArray(events)) {
      throw new Error(
        "Events API returned invalid data."
      );
    }

    /*
      Prefer published events.
      If API already filters them, this keeps them unchanged.
    */

    const publishedEvents =
      events.filter(
        (event) =>
          event.published !== false
      );

    const limitedEvents =
      publishedEvents.slice(0, 3);

    if (!limitedEvents.length) {
      el.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >
          <div class="icon">📅</div>

          <h3 class="h3 mb-1">
            No upcoming events
          </h3>

          <p class="text-sm text-muted">
            New cybersecurity events will
            appear here.
          </p>
        </div>
      `;

      return;
    }

    el.innerHTML =
      limitedEvents
        .map((event) => {
          const imageUrl =
            getImageUrl(event);

          console.log(
            "Event cover:",
            event.title,
            imageUrl
          );

          const registrationUrl =
            safeUrl(
              event.registrationUrl ||
              event.registration_url
            );

          const eventDate =
            event.date ||
            event.eventDate ||
            event.event_date ||
            "TBA";

          const eventTime =
            event.time ||
            event.eventTime ||
            event.event_time ||
            "";

          return `
            <div
              class="card"
              style="
                padding:0;
                overflow:hidden;
              "
            >

              ${eventImageHtml(event)}

              <div
                style="
                  padding:20px;
                "
              >

                <span class="badge badge-blue">
                  ${esc(
                    event.category ||
                    "Event"
                  )}
                </span>

                <h3
                  class="h3 mt-2 mb-1"
                >
                  ${esc(
                    event.title ||
                    "Untitled Event"
                  )}
                </h3>

                <p
                  class="text-sm text-muted mb-3"
                >
                  ${esc(
                    event.description ||
                    ""
                  )}
                </p>

                <div
                  class="text-xs text-muted mb-3"
                >
                  📍
                  ${esc(
                    event.location ||
                    "TBA"
                  )}

                  &nbsp;·&nbsp;

                  🗓
                  ${esc(eventDate)}

                  ${
                    eventTime
                      ? `
                        &nbsp;·&nbsp;
                        ⏰
                        ${esc(eventTime)}
                      `
                      : ""
                  }
                </div>

                ${
                  registrationUrl
                    ? `
                      <a
                        href="${esc(
                          registrationUrl
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
          `;
        })
        .join("");

    enableImageFallbacks();

  } catch (error) {
    console.error(
      "Home events error:",
      error
    );

    el.innerHTML = `
      <div
        class="empty-state"
        style="grid-column:1/-1;"
      >
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load events
        </h3>

        <p class="text-sm text-muted">
          ${esc(
            error?.message ||
            "Unable to load events."
          )}
        </p>
      </div>
    `;
  }
}


/* =========================================================
   PROJECTS
   ========================================================= */

async function loadHomeProjects() {
  const el =
    document.getElementById(
      "home-projects"
    );

  if (!el) return;

  try {
    checkApi();

    const projects =
      await window.Api.get(
        "/projects"
      );

    console.log(
      "DragonByte Home Projects:",
      projects
    );

    if (!Array.isArray(projects)) {
      throw new Error(
        "Projects API returned invalid data."
      );
    }

    /*
      Only show published projects.

      If a project has featured=true,
      prioritize it.
    */

    const publishedProjects =
      projects.filter(
        (project) =>
          project.published !== false
      );

    const featuredProjects =
      publishedProjects.filter(
        (project) =>
          project.featured === true ||
          project.featured === 1
      );

    const normalProjects =
      publishedProjects.filter(
        (project) =>
          !(
            project.featured === true ||
            project.featured === 1
          )
      );

    const orderedProjects = [
      ...featuredProjects,
      ...normalProjects,
    ];

    const limitedProjects =
      orderedProjects.slice(0, 3);

    if (!limitedProjects.length) {
      el.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >
          <div class="icon">🔧</div>

          <h3 class="h3 mb-1">
            No projects yet
          </h3>

          <p class="text-sm text-muted">
            Community projects will
            appear here.
          </p>
        </div>
      `;

      return;
    }

    el.innerHTML =
      limitedProjects
        .map((project) => {
          const imageUrl =
            getImageUrl(project);

          console.log(
            "Project cover:",
            project.name ||
            project.title,
            imageUrl
          );

          let technologies =
            project.technologies;

          /*
            Support both:
            ["HTML", "CSS"]
            and
            "HTML, CSS"
          */

          if (
            typeof technologies ===
            "string"
          ) {
            technologies =
              technologies
                .split(",")
                .map((item) =>
                  item.trim()
                )
                .filter(Boolean);
          }

          if (
            !Array.isArray(
              technologies
            )
          ) {
            technologies = [];
          }

          const githubUrl =
            safeUrl(
              project.githubUrl ||
              project.github_url
            );

          const demoUrl =
            safeUrl(
              project.demoUrl ||
              project.demo_url
            );

          return `
            <div
              class="card"
              style="
                padding:0;
                overflow:hidden;
              "
            >

              ${projectImageHtml(project)}

              <div
                style="
                  padding:20px;
                "
              >

                ${
                  project.category
                    ? `
                      <span
                        class="badge badge-blue"
                      >
                        ${esc(
                          project.category
                        )}
                      </span>
                    `
                    : ""
                }

                <h3
                  class="h3 ${
                    project.category
                      ? "mt-2"
                      : ""
                  } mb-1"
                >
                  ${esc(
                    project.name ||
                    project.title ||
                    "Untitled Project"
                  )}
                </h3>

                <p
                  class="text-sm text-muted mb-3"
                >
                  ${esc(
                    project.description ||
                    ""
                  )}
                </p>

                ${
                  technologies.length
                    ? `
                      <div
                        class="flex gap-2 mb-3"
                        style="
                          flex-wrap:wrap;
                        "
                      >
                        ${technologies
                          .slice(0, 4)
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
                  style="
                    flex-wrap:wrap;
                  "
                >

                  ${
                    githubUrl
                      ? `
                        <a
                          href="${esc(
                            githubUrl
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
                    demoUrl
                      ? `
                        <a
                          href="${esc(
                            demoUrl
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
          `;
        })
        .join("");

    enableImageFallbacks();

  } catch (error) {
    console.error(
      "Home projects error:",
      error
    );

    el.innerHTML = `
      <div
        class="empty-state"
        style="grid-column:1/-1;"
      >
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load projects
        </h3>

        <p class="text-sm text-muted">
          ${esc(
            error?.message ||
            "Unable to load projects."
          )}
        </p>
      </div>
    `;
  }
}


/* =========================================================
   CONTRIBUTORS
   ========================================================= */

async function loadHomeContributors() {
  const el =
    document.getElementById(
      "home-contributors"
    );

  if (!el) return;

  try {
    checkApi();

    const contributors =
      await window.Api.get(
        "/contributors"
      );

    console.log(
      "DragonByte Home Contributors:",
      contributors
    );

    if (!Array.isArray(contributors)) {
      throw new Error(
        "Contributors API returned invalid data."
      );
    }

    const featured =
      contributors.filter(
        (member) =>
          member.featured === true ||
          member.featured === 1
      );

    const source =
      featured.length
        ? featured
        : contributors;

    const limitedContributors =
      source.slice(0, 3);

    if (!limitedContributors.length) {
      el.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >
          <div class="icon">👥</div>

          <h3 class="h3 mb-1">
            No featured members yet
          </h3>

          <p class="text-sm text-muted">
            Featured community members
            will appear here.
          </p>
        </div>
      `;

      return;
    }

    el.innerHTML =
      limitedContributors
        .map((member) => {
          const imageUrl =
            safeUrl(
              member.imageUrl ||
              member.image_url ||
              member.photo ||
              member.photo_url
            );

          return `
            <div
              class="card text-center"
            >

              ${
                imageUrl
                  ? `
                    <img
                      src="${esc(
                        imageUrl
                      )}"
                      alt="${esc(
                        member.name ||
                        "Member"
                      )}"
                      loading="lazy"
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
                    <div
                      style="
                        width:80px;
                        height:80px;
                        border-radius:50%;
                        margin:0 auto 15px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#eff6ff;
                        font-size:2rem;
                      "
                    >
                      👤
                    </div>
                  `
              }

              <h3
                class="h3 mb-1"
              >
                ${esc(
                  member.name ||
                  "Member"
                )}
              </h3>

              <p
                class="text-sm"
                style="
                  color:var(--primary);
                "
              >
                ${esc(
                  member.role ||
                  ""
                )}
              </p>

              <p
                class="text-sm text-muted mt-2"
              >
                ${esc(
                  member.bio ||
                  ""
                )}
              </p>

            </div>
          `;
        })
        .join("");

  } catch (error) {
    console.error(
      "Home contributors error:",
      error
    );

    el.innerHTML = `
      <div
        class="empty-state"
        style="grid-column:1/-1;"
      >
        <div class="icon">⚠️</div>

        <h3 class="h3 mb-1">
          Couldn't load members
        </h3>

        <p class="text-sm text-muted">
          ${esc(
            error?.message ||
            "Unable to load members."
          )}
        </p>
      </div>
    `;
  }
}


/* =========================================================
   TESTIMONIALS
   ========================================================= */

async function loadHomeTestimonials() {
  const el =
    document.getElementById(
      "home-testimonials"
    );

  if (!el) return;

  try {
    checkApi();

    const testimonials =
      await window.Api.get(
        "/testimonials"
      );

    console.log(
      "DragonByte Home Testimonials:",
      testimonials
    );

    if (!Array.isArray(testimonials)) {
      throw new Error(
        "Testimonials API returned invalid data."
      );
    }

    const approved =
      testimonials.filter(
        (item) =>
          item.approved !== false
      );

    const limitedTestimonials =
      approved.slice(0, 3);

    if (!limitedTestimonials.length) {
      el.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >
          <div class="icon">💬</div>

          <h3 class="h3 mb-1">
            No testimonials yet
          </h3>

          <p class="text-sm text-muted">
            Community feedback will
            appear here.
          </p>
        </div>
      `;

      return;
    }

    el.innerHTML =
      limitedTestimonials
        .map(
          (item) => `
            <div
              class="card"
            >

              <p
                class="text-sm mb-3"
              >
                "${esc(
                  item.quote ||
                  item.message ||
                  item.content ||
                  ""
                )}"
              </p>

              <div
                class="text-sm"
                style="
                  font-weight:600;
                "
              >
                ${esc(
                  item.name ||
                  "Anonymous"
                )}
              </div>

              <div
                class="text-xs text-muted"
              >
                ${esc(
                  item.role ||
                  ""
                )}
              </div>

            </div>
          `
        )
        .join("");

  } catch (error) {
    console.error(
      "Home testimonials error:",
      error
    );

    el.innerHTML = `
      <div
        class="empty-state"
        style="grid-column:1/-1;"
      >
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


/* =========================================================
   START HOME PAGE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "DragonByte Home: loading..."
    );

    loadHomeEvents();
    loadHomeProjects();
    loadHomeContributors();
    loadHomeTestimonials();

  }
);