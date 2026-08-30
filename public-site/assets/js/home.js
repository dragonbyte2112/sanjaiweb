// /assets/js/home.js

"use strict";

/* =========================================================
   DRAGONBYTE HOME PAGE
   Loads:
   - Upcoming Events
   - Featured Projects
   - Featured Members
   - Testimonials

   Images:
   - Event cover photo
   - Project cover photo
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
   GET IMAGE URL
========================================================= */

function getImageUrl(item, type) {
  if (!item) {
    return "";
  }

  /* -------------------------
     EVENT IMAGE
  ------------------------- */

  if (type === "event") {
    return (
      item.eventCoverPhoto ||
      item.event_cover_photo ||
      item.eventCoverPhotoUrl ||
      item.event_cover_photo_url ||
      item.coverPhotoUrl ||
      item.cover_photo_url ||
      item.coverUrl ||
      item.cover_url ||
      item.photoUrl ||
      item.photo_url ||
      ""
    );
  }


  /* -------------------------
     PROJECT IMAGE
  ------------------------- */

  if (type === "project") {
    return (
      item.projectCoverPhoto ||
      item.project_cover_photo ||
      item.projectCoverPhotoUrl ||
      item.project_cover_photo_url ||
      item.coverPhotoUrl ||
      item.cover_photo_url ||
      item.coverUrl ||
      item.cover_url ||
      item.photoUrl ||
      item.photo_url ||
      ""
    );
  }


  return "";
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {
  if (!value) {
    return "TBA";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (error) {
    return String(value);
  }
}


/* =========================================================
   EVENTS
========================================================= */

async function loadHomeEvents() {
  const el = document.getElementById("home-events");

  if (!el) {
    return;
  }

  try {
    /* -------------------------
       API CHECK
    ------------------------- */

    if (
      !window.Api ||
      typeof window.Api.get !== "function"
    ) {
      throw new Error(
        "DragonByte API is not available."
      );
    }


    /* -------------------------
       LOAD EVENTS
    ------------------------- */

    const events = await window.Api.get("/events");

    console.log(
      "DragonByte Home Events:",
      events
    );


    const limitedEvents = Array.isArray(events)
      ? events.slice(0, 3)
      : [];


    /* -------------------------
       EMPTY STATE
    ------------------------- */

    if (!limitedEvents.length) {
      el.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >

          <div class="icon">
            📅
          </div>

          <h3 class="h3 mb-1">
            No upcoming events
          </h3>

          <p class="text-sm text-muted">
            New cybersecurity events will appear here.
          </p>

        </div>
      `;

      return;
    }


    /* -------------------------
       RENDER EVENTS
    ------------------------- */

    el.innerHTML = limitedEvents
      .map((event) => {

        const coverPhoto =
          getImageUrl(event, "event");


        const eventTitle =
          event.title ||
          event.name ||
          "Untitled Event";


        const eventDescription =
          event.description ||
          "";


        const eventCategory =
          event.category ||
          "Event";


        const eventLocation =
          event.location ||
          "TBA";


        const eventDate =
          event.date ||
          event.eventDate ||
          event.event_date ||
          "";


        const registrationUrl =
          event.registrationUrl ||
          event.registration_url ||
          "";


        return `
          <div
            class="card"
            style="
              padding:0;
              overflow:hidden;
            "
          >

            <!-- =====================================
                 EVENT COVER IMAGE
            ====================================== -->

            <div
              style="
                height:150px;
                width:100%;
                overflow:hidden;
                display:flex;
                align-items:center;
                justify-content:center;
                background:
                  linear-gradient(
                    135deg,
                    #eff6ff,
                    #e0f2fe
                  );
              "
            >

              ${
                coverPhoto
                  ? `
                    <img
                      src="${esc(coverPhoto)}"
                      alt="${esc(eventTitle)}"
                      loading="lazy"
                      style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        display:block;
                      "
                      onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                      "
                    >

                    <!-- FALLBACK -->
                    <div
                      style="
                        display:none;
                        width:100%;
                        height:100%;
                        align-items:center;
                        justify-content:center;
                        font-size:2.5rem;
                      "
                    >
                      📅
                    </div>
                  `
                  : `
                    <!-- NO IMAGE FALLBACK -->
                    <div
                      style="
                        width:100%;
                        height:100%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:2.5rem;
                      "
                    >
                      📅
                    </div>
                  `
              }

            </div>


            <!-- =====================================
                 EVENT CONTENT
            ====================================== -->

            <div
              style="
                padding:20px;
              "
            >

              <!-- CATEGORY -->

              <span class="badge badge-blue">
                ${esc(eventCategory)}
              </span>


              <!-- TITLE -->

              <h3
                class="h3 mt-2 mb-1"
              >
                ${esc(eventTitle)}
              </h3>


              <!-- DESCRIPTION -->

              <p
                class="text-sm text-muted mb-3"
              >
                ${esc(eventDescription)}
              </p>


              <!-- LOCATION + DATE -->

              <div
                class="text-xs text-muted mb-3"
              >

                📍
                ${esc(eventLocation)}

                &nbsp;·&nbsp;

                🗓
                ${esc(formatDate(eventDate))}

              </div>


              <!-- REGISTER BUTTON -->

              ${
                registrationUrl
                  ? `
                    <a
                      href="${esc(registrationUrl)}"
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

        <div class="icon">
          ⚠️
        </div>

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
  const el = document.getElementById(
    "home-projects"
  );

  if (!el) {
    return;
  }

  try {

    /* -------------------------
       API CHECK
    ------------------------- */

    if (
      !window.Api ||
      typeof window.Api.get !== "function"
    ) {
      throw new Error(
        "DragonByte API is not available."
      );
    }


    /* -------------------------
       LOAD PROJECTS
    ------------------------- */

    const projects =
      await window.Api.get("/projects");


    console.log(
      "DragonByte Home Projects:",
      projects
    );


    const limitedProjects =
      Array.isArray(projects)
        ? projects.slice(0, 3)
        : [];


    /* -------------------------
       EMPTY STATE
    ------------------------- */

    if (!limitedProjects.length) {

      el.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >

          <div class="icon">
            🔧
          </div>

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


    /* -------------------------
       RENDER PROJECTS
    ------------------------- */

    el.innerHTML = limitedProjects
      .map((project) => {

        const coverPhoto =
          getImageUrl(
            project,
            "project"
          );


        const projectName =
          project.name ||
          project.title ||
          "Untitled Project";


        const projectDescription =
          project.description ||
          "";


        const githubUrl =
          project.githubUrl ||
          project.github_url ||
          "";


        const demoUrl =
          project.demoUrl ||
          project.demo_url ||
          "";


        return `
          <div
            class="card"
            style="
              padding:0;
              overflow:hidden;
            "
          >

            <!-- =====================================
                 PROJECT COVER IMAGE
            ====================================== -->

            <div
              style="
                height:150px;
                width:100%;
                overflow:hidden;
                display:flex;
                align-items:center;
                justify-content:center;
                background:
                  linear-gradient(
                    135deg,
                    #f0fdf4,
                    #ecfeff
                  );
              "
            >

              ${
                coverPhoto
                  ? `
                    <img
                      src="${esc(coverPhoto)}"
                      alt="${esc(projectName)}"
                      loading="lazy"
                      style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        display:block;
                      "
                      onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                      "
                    >

                    <!-- FALLBACK -->
                    <div
                      style="
                        display:none;
                        width:100%;
                        height:100%;
                        align-items:center;
                        justify-content:center;
                        font-size:2.5rem;
                      "
                    >
                      🔧
                    </div>
                  `
                  : `
                    <!-- NO IMAGE FALLBACK -->
                    <div
                      style="
                        width:100%;
                        height:100%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:2.5rem;
                      "
                    >
                      🔧
                    </div>
                  `
              }

            </div>


            <!-- =====================================
                 PROJECT CONTENT
            ====================================== -->

            <div
              style="
                padding:20px;
              "
            >

              <!-- PROJECT NAME -->

              <h3
                class="h3 mb-1"
              >
                ${esc(projectName)}
              </h3>


              <!-- DESCRIPTION -->

              <p
                class="text-sm text-muted mb-3"
              >
                ${esc(projectDescription)}
              </p>


              <!-- =================================
                   TECHNOLOGIES
              ================================== -->

              ${
                Array.isArray(
                  project.technologies
                ) &&
                project.technologies.length
                  ? `
                    <div
                      class="flex gap-2 mb-3"
                      style="
                        flex-wrap:wrap;
                      "
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


              <!-- =================================
                   PROJECT LINKS
              ================================== -->

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
                        href="${esc(githubUrl)}"
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
                        href="${esc(demoUrl)}"
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

        <div class="icon">
          ⚠️
        </div>

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

  if (!el) {
    return;
  }

  try {

    if (
      !window.Api ||
      typeof window.Api.get !== "function"
    ) {
      throw new Error(
        "DragonByte API is not available."
      );
    }


    const contributors =
      await window.Api.get(
        "/contributors"
      );


    console.log(
      "DragonByte Home Contributors:",
      contributors
    );


    const limitedContributors =
      Array.isArray(contributors)
        ? contributors.slice(0, 3)
        : [];


    if (!limitedContributors.length) {

      el.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >

          <div class="icon">
            👥
          </div>

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


    el.innerHTML =
      limitedContributors
        .map((member) => {

          const imageUrl =
            member.imageUrl ||
            member.image_url ||
            "";


          return `
            <div
              class="card text-center"
            >

              ${
                imageUrl
                  ? `
                    <img
                      src="${esc(imageUrl)}"
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


              <h3 class="h3 mb-1">
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

        <div class="icon">
          ⚠️
        </div>

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

  if (!el) {
    return;
  }

  try {

    if (
      !window.Api ||
      typeof window.Api.get !== "function"
    ) {
      throw new Error(
        "DragonByte API is not available."
      );
    }


    const testimonials =
      await window.Api.get(
        "/testimonials"
      );


    console.log(
      "DragonByte Home Testimonials:",
      testimonials
    );


    const limitedTestimonials =
      Array.isArray(testimonials)
        ? testimonials.slice(0, 3)
        : [];


    if (!limitedTestimonials.length) {

      el.innerHTML = `
        <div
          class="empty-state"
          style="grid-column:1/-1;"
        >

          <div class="icon">
            💬
          </div>

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


    el.innerHTML =
      limitedTestimonials
        .map((item) => {

          const quote =
            item.quote ||
            item.message ||
            item.content ||
            "";


          return `
            <div
              class="card"
            >

              <p
                class="text-sm mb-3"
              >
                "${esc(quote)}"
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
          `;
        })
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

        <div class="icon">
          ⚠️
        </div>

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
      "DragonByte Home: Loading..."
    );


    loadHomeEvents();

    loadHomeProjects();

    loadHomeContributors();

    loadHomeTestimonials();

  }
);