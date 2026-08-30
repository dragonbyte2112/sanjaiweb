/* =========================================================
   DRAGONBYTE ADMIN PANEL
   Supabase + Storage
   ========================================================= */

"use strict";

/* =========================================================
   SUPABASE CONFIG
   IMPORTANT:
   - NEVER put service_role / sb_secret keys here.
   - Browser code may use the publishable/anon key.
   ========================================================= */

const DB_SUPABASE_URL =
  "https://khjmouwldnjwzvdxnbty.supabase.co";

const DB_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoam91d2xkbmp3enZ4bmJ0eSwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNjE0MjUsImV4cCI6MjEwMzYzNzQyNX0.pmU13DeACsbQQweV-7QLY_mYfqtRL9JWZXr18DQY1Rs";

const STORAGE_BUCKET = "dragonbyte-media";

/* =========================================================
   MAKE SURE THE API USES THE NEW SUPABASE PROJECT
   ========================================================= */

function setupSupabaseClient() {
  if (!window.supabase) {
    throw new Error(
      "Supabase library is not loaded. Add @supabase/supabase-js before admin.js."
    );
  }

  if (
    !window.supabaseClient ||
    typeof window.supabaseClient.from !== "function"
  ) {
    window.supabaseClient = window.supabase.createClient(
      DB_SUPABASE_URL,
      DB_SUPABASE_ANON_KEY
    );
  }

  return window.supabaseClient;
}

/* =========================================================
   ADMIN SECTIONS
   ========================================================= */

const ADMIN_SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "members", label: "Members", icon: "👥" },
  { id: "contributors", label: "Contributors", icon: "⭐" },
  { id: "events", label: "Events", icon: "📅" },
  { id: "projects", label: "Projects", icon: "🔧" },
  { id: "teams", label: "Teams", icon: "🛡️" },
  { id: "challenges", label: "CTF Challenges", icon: "🚩" },
  { id: "join-requests", label: "Join Requests", icon: "📨" },
  { id: "messages", label: "Messages", icon: "✉️" },
  { id: "testimonials", label: "Testimonials", icon: "💬" },
  { id: "settings", label: "Settings", icon: "⚙️" }
];

let activeSection = "dashboard";

/* =========================================================
   HELPERS
   ========================================================= */

function esc(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
}

function getFileExtension(file) {
  if (!file || !file.name) return "jpg";

  const parts = file.name.split(".");
  return parts.length > 1
    ? parts[parts.length - 1].toLowerCase()
    : "jpg";
}

function validateImage(file) {
  if (!file) {
    throw new Error("Please select an image.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("Image must be smaller than 5 MB.");
  }
}

/* =========================================================
   STORAGE UPLOAD
   ========================================================= */

async function uploadImage(file, folder) {
  validateImage(file);

  const client = setupSupabaseClient();

  const extension = getFileExtension(file);

  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const fileName =
    `${folder}/${Date.now()}-${randomPart}.${extension}`;

  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) {
    throw new Error(
      `Image upload failed: ${error.message}`
    );
  }

  const { data } = client.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  if (!data || !data.publicUrl) {
    throw new Error("Could not create public image URL.");
  }

  return data.publicUrl;
}

/* =========================================================
   SHOW UPLOAD STATUS
   ========================================================= */

function uploadStatusHtml(key) {
  return `
    <div
      data-upload-status="${esc(key)}"
      class="text-xs text-muted mt-1"
      style="min-height:18px;"
    ></div>
  `;
}

function setUploadStatus(container, key, message, success = false) {
  const el = container.querySelector(
    `[data-upload-status="${key}"]`
  );

  if (!el) return;

  el.textContent = message || "";

  if (success) {
    el.style.color = "#16a34a";
  } else {
    el.style.color = "#64748b";
  }
}

/* =========================================================
   FILE INPUT HTML
   ========================================================= */

function fileInputHtml(field, value) {
  return `
    <input
      type="file"
      data-field="${esc(field.key)}"
      accept="image/*"
    />

    ${
      value
        ? `
          <div class="text-xs text-muted mt-1">
            Current image:
            <a
              href="${esc(value)}"
              target="_blank"
              rel="noopener"
            >
              View
            </a>
          </div>
        `
        : ""
    }

    ${uploadStatusHtml(field.key)}
  `;
}

/* =========================================================
   ENTITY CONFIG
   ========================================================= */

const entityConfigs = {

  /* -------------------------------------------------------
     MEMBERS
     ------------------------------------------------------- */

  members: {
    title: "Member",
    apiBase: "/members",

    columns: [
      "name",
      "email",
      "username"
    ],

    fields: [
      {
        key: "name",
        label: "Name",
        type: "text"
      },

      {
        key: "email",
        label: "Email",
        type: "text"
      },

      {
        key: "username",
        label: "Username",
        type: "text"
      },

      {
        key: "skills",
        label: "Skills",
        type: "text"
      },

      {
        key: "photo",
        label: "Profile Photo",
        type: "file"
      },

      {
        key: "linkedin",
        label: "LinkedIn URL",
        type: "text"
      },

      {
        key: "github",
        label: "GitHub URL",
        type: "text"
      }
    ]
  },

  /* -------------------------------------------------------
     CONTRIBUTORS
     ------------------------------------------------------- */

  contributors: {
    title: "Contributor",
    apiBase: "/contributors",

    columns: [
      "name",
      "role",
      "featured"
    ],

    fields: [
      {
        key: "name",
        label: "Name",
        type: "text"
      },

      {
        key: "role",
        label: "Role",
        type: "text"
      },

      {
        key: "bio",
        label: "Bio",
        type: "textarea"
      },

      {
        key: "photo",
        label: "Profile Photo",
        type: "file"
      },

      {
        key: "skills",
        label: "Skills",
        type: "tags"
      },

      {
        key: "github",
        label: "GitHub URL",
        type: "text"
      },

      {
        key: "linkedin",
        label: "LinkedIn URL",
        type: "text"
      },

      {
        key: "featured",
        label: "Featured on homepage",
        type: "checkbox"
      }
    ]
  },

  /* -------------------------------------------------------
     EVENTS
     ------------------------------------------------------- */

  events: {
    title: "Event",
    apiBase: "/events",

    columns: [
      "title",
      "date",
      "location",
      "published"
    ],

    fields: [
      {
        key: "title",
        label: "Title",
        type: "text"
      },

      {
        key: "description",
        label: "Description",
        type: "textarea"
      },

      {
        key: "date",
        label: "Date",
        type: "text",
        placeholder: "2026-12-01"
      },

      {
        key: "time",
        label: "Time",
        type: "text",
        placeholder: "10:00 AM"
      },

      {
        key: "location",
        label: "Location",
        type: "text"
      },

      {
        key: "category",
        label: "Category",
        type: "text"
      },

      {
        key: "image",
        label: "Event Photo URL",
        type: "text"
      },

      {
        key: "coverPhoto",
        label: "Event Cover Photo",
        type: "file"
      },

      {
        key: "registrationUrl",
        label: "Registration URL",
        type: "text"
      },

      {
        key: "featured",
        label: "Featured on homepage",
        type: "checkbox"
      },

      {
        key: "published",
        label: "Published",
        type: "checkbox"
      }
    ]
  },

  /* -------------------------------------------------------
     PROJECTS
     ------------------------------------------------------- */

  projects: {
    title: "Project",
    apiBase: "/projects",

    columns: [
      "name",
      "category",
      "published"
    ],

    fields: [
      {
        key: "name",
        label: "Name",
        type: "text"
      },

      {
        key: "description",
        label: "Description",
        type: "textarea"
      },

      {
        key: "image",
        label: "Project Photo URL",
        type: "text"
      },

      {
        key: "coverPhoto",
        label: "Project Cover Photo",
        type: "file"
      },

      {
        key: "githubUrl",
        label: "GitHub URL",
        type: "text"
      },

      {
        key: "demoUrl",
        label: "Demo URL",
        type: "text"
      },

      {
        key: "resourceUrl",
        label: "Resource Link",
        type: "text"
      },

      {
        key: "technologies",
        label: "Technologies",
        type: "tags"
      },

      {
        key: "contributors",
        label: "Contributors",
        type: "tags"
      },

      {
        key: "category",
        label: "Category",
        type: "text"
      },

      {
        key: "featured",
        label: "Featured on homepage",
        type: "checkbox"
      },

      {
        key: "published",
        label: "Published",
        type: "checkbox"
      }
    ]
  },

  /* -------------------------------------------------------
     TEAMS
     ------------------------------------------------------- */

  teams: {
    title: "Team",
    apiBase: "/teams",

    columns: [
      "name",
      "category",
      "membersCount"
    ],

    fields: [
      {
        key: "name",
        label: "Name",
        type: "text"
      },

      {
        key: "description",
        label: "Description",
        type: "textarea"
      },

      {
        key: "category",
        label: "Category",
        type: "text"
      },

      {
        key: "logoUrl",
        label: "Logo URL",
        type: "text"
      },

      {
        key: "githubUrl",
        label: "GitHub URL",
        type: "text"
      },

      {
        key: "websiteUrl",
        label: "Website URL",
        type: "text"
      },

      {
        key: "membersCount",
        label: "Members Count",
        type: "number"
      }
    ]
  },

  /* -------------------------------------------------------
     TESTIMONIALS
     ------------------------------------------------------- */

  testimonials: {
    title: "Testimonial",
    apiBase: "/testimonials",

    columns: [
      "name",
      "role",
      "approved"
    ],

    fields: [
      {
        key: "quote",
        label: "Quote",
        type: "textarea"
      },

      {
        key: "name",
        label: "Name",
        type: "text"
      },

      {
        key: "role",
        label: "Role",
        type: "text"
      },

      {
        key: "photo",
        label: "Photo URL",
        type: "text"
      },

      {
        key: "approved",
        label: "Approved",
        type: "checkbox"
      }
    ]
  }
};

/* =========================================================
   FIELD HTML
   ========================================================= */

function fieldInputHtml(field, value) {

  const v =
    value ??
    (field.type === "checkbox" ? false : "");

  /* CHECKBOX */

  if (field.type === "checkbox") {
    return `
      <label class="field-check mt-2">
        <input
          type="checkbox"
          data-field="${esc(field.key)}"
          ${v ? "checked" : ""}
        />
        <span class="text-sm">Yes</span>
      </label>
    `;
  }

  /* FILE */

  if (field.type === "file") {
    return fileInputHtml(field, v);
  }

  /* TEXTAREA */

  if (field.type === "textarea") {
    return `
      <textarea
        data-field="${esc(field.key)}"
        rows="3"
        placeholder="${esc(field.placeholder || "")}"
      >${esc(v)}</textarea>
    `;
  }

  /* TAGS */

  const displayVal =
    field.type === "tags" && Array.isArray(v)
      ? v.join(", ")
      : v;

  /* NUMBER */

  if (field.type === "number") {
    return `
      <input
        type="number"
        data-field="${esc(field.key)}"
        value="${esc(displayVal)}"
        placeholder="${esc(field.placeholder || "")}"
      />
    `;
  }

  /* DEFAULT TEXT */

  return `
    <input
      type="text"
      data-field="${esc(field.key)}"
      value="${esc(displayVal)}"
      placeholder="${esc(
        field.placeholder ||
        (field.type === "tags"
          ? "comma, separated, values"
          : "")
      )}"
    />
  `;
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function renderSidebar() {

  const nav = document.getElementById("admin-nav");

  if (!nav) return;

  nav.innerHTML = ADMIN_SECTIONS
    .map(
      section => `
        <button
          class="admin-nav-item ${
            section.id === activeSection
              ? "active"
              : ""
          }"
          data-section="${esc(section.id)}"
        >
          <span>${section.icon}</span>
          ${esc(section.label)}
        </button>
      `
    )
    .join("");

  nav
    .querySelectorAll("button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => goToSection(button.dataset.section)
      );

    });
}

/* =========================================================
   ADMIN SHELL
   ========================================================= */

function showAdminShell() {

  const loginScreen =
    document.getElementById("login-screen");

  const adminShell =
    document.getElementById("admin-shell");

  if (loginScreen) {
    loginScreen.classList.add("hidden");
  }

  if (adminShell) {
    adminShell.classList.remove("hidden");
  }

  renderSidebar();
  goToSection("dashboard");
}

function showLoginScreen() {

  const loginScreen =
    document.getElementById("login-screen");

  const adminShell =
    document.getElementById("admin-shell");

  if (adminShell) {
    adminShell.classList.add("hidden");
  }

  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function goToSection(id) {

  activeSection = id;

  renderSidebar();

  const section =
    ADMIN_SECTIONS.find(
      item => item.id === id
    );

  const title =
    document.getElementById("section-title");

  if (title && section) {
    title.textContent = section.label;
  }

  renderSection(id);
}

function renderSection(id) {

  const element =
    document.getElementById("section-content");

  if (!element) return;

  element.innerHTML = "";

  if (id === "dashboard") {
    return renderDashboard(element);
  }

  if (id === "members") {
    return renderEntityManager(
      element,
      entityConfigs.members
    );
  }

  if (id === "contributors") {
    return renderEntityManager(
      element,
      entityConfigs.contributors
    );
  }

  if (id === "events") {
    return renderEntityManager(
      element,
      entityConfigs.events
    );
  }

  if (id === "projects") {
    return renderEntityManager(
      element,
      entityConfigs.projects
    );
  }

  if (id === "teams") {
    return renderEntityManager(
      element,
      entityConfigs.teams
    );
  }

  if (id === "testimonials") {
    return renderEntityManager(
      element,
      entityConfigs.testimonials
    );
  }

  if (id === "challenges") {
    return renderChallengesPanel(element);
  }

  if (id === "join-requests") {
    return renderJoinRequestsPanel(element);
  }

  if (id === "messages") {
    return renderMessagesPanel(element);
  }

  if (id === "settings") {
    return renderSettingsPanel(element);
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

const STAT_META = [
  {
    key: "members",
    label: "Members",
    icon: "👥"
  },
  {
    key: "events",
    label: "Events",
    icon: "📅"
  },
  {
    key: "projects",
    label: "Projects",
    icon: "🔧"
  },
  {
    key: "joinRequests",
    label: "Pending Join Requests",
    icon: "📨"
  },
  {
    key: "messages",
    label: "Unread Messages",
    icon: "✉️"
  },
  {
    key: "testimonials",
    label: "Testimonials",
    icon: "💬"
  },
  {
    key: "challenges",
    label: "CTF Challenges",
    icon: "🚩"
  },
  {
    key: "ctfSolves",
    label: "Total CTF Solves",
    icon: "✅"
  }
];

async function renderDashboard(el) {

  el.innerHTML = `
    <div
      class="grid grid-3"
      id="stat-grid"
    >
      ${STAT_META
        .map(
          stat => `
            <div class="stat-card">
              <div class="top">
                <span>${stat.icon}</span>
                <span
                  class="value"
                  id="stat-${esc(stat.key)}"
                >
                  …
                </span>
              </div>

              <div
                class="text-sm"
                style="
                  font-weight:500;
                  color:#475569;
                "
              >
                ${esc(stat.label)}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;

  try {

    const stats =
      await Api.get("/admin/stats");

    STAT_META.forEach(stat => {

      const node =
        document.getElementById(
          `stat-${stat.key}`
        );

      if (node) {
        node.textContent =
          stats?.[stat.key] ?? 0;
      }

    });

  } catch (error) {

    el.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="form-error mb-4">
          ${esc(error.message)}
        </div>
      `
    );
  }
}

/* =========================================================
   GENERIC ENTITY MANAGER
   ========================================================= */

function renderEntityManager(container, config) {

  let rows = [];

  let showForm = false;

  let editingId = null;

  container.innerHTML = `
    <div
      class="flex justify-between items-center mb-4"
    >
      <div
        class="text-sm text-muted"
        id="em-count"
      >
        Loading…
      </div>

      <button
        id="em-toggle"
        class="btn btn-primary btn-sm"
      >
        + Add ${esc(config.title)}
      </button>
    </div>

    <div id="em-error"></div>

    <div id="em-form"></div>

    <div id="em-table"></div>
  `;

  const countEl =
    container.querySelector("#em-count");

  const toggleBtn =
    container.querySelector("#em-toggle");

  const errorEl =
    container.querySelector("#em-error");

  const formEl =
    container.querySelector("#em-form");

  const tableEl =
    container.querySelector("#em-table");

  function showError(message) {

    errorEl.innerHTML =
      message
        ? `
          <div
            class="form-error mb-3"
            style="
              background:#fef2f2;
              padding:12px 16px;
              border-radius:10px;
            "
          >
            ${esc(message)}
          </div>
        `
        : "";
  }

  /* -------------------------------------------------------
     FORM
     ------------------------------------------------------- */

  function renderForm() {

    if (!showForm) {

      formEl.innerHTML = "";

      toggleBtn.textContent =
        `+ Add ${config.title}`;

      return;
    }

    toggleBtn.textContent = "Cancel";

    const editingRow =
      editingId
        ? rows.find(
            row =>
              String(row.id) ===
              String(editingId)
          )
        : null;

    formEl.innerHTML = `
      <form
        id="em-entity-form"
        class="admin-panel-box"
      >

        <h3 class="h3 mb-3">
          ${
            editingId
              ? "Edit"
              : "New"
          }
          ${esc(config.title)}
        </h3>

        <div class="grid grid-2">

          ${config.fields
            .map(
              field => `
                <div
                  class="field"
                  style="${
                    field.type === "textarea"
                      ? "grid-column:1/-1;"
                      : ""
                  }"
                >

                  <label>
                    ${esc(field.label)}
                  </label>

                  ${fieldInputHtml(
                    field,
                    editingRow
                      ? editingRow[field.key]
                      : undefined
                  )}

                </div>
              `
            )
            .join("")}

        </div>

        <button
          type="submit"
          class="btn btn-primary mt-2"
        >
          ${
            editingId
              ? "Save Changes"
              : "Create"
          }
        </button>

      </form>
    `;

    const form =
      formEl.querySelector(
        "#em-entity-form"
      );

    /* -----------------------------------------------------
       FILE INPUT PREVIEW / STATUS
       ----------------------------------------------------- */

    config.fields
      .filter(
        field =>
          field.type === "file"
      )
      .forEach(field => {

        const input =
          form.querySelector(
            `[data-field="${field.key}"]`
          );

        if (!input) return;

        input.addEventListener(
          "change",
          () => {

            if (
              input.files &&
              input.files[0]
            ) {

              setUploadStatus(
                form,
                field.key,
                `Selected: ${input.files[0].name}`
              );

            }

          }
        );

      });

    /* -----------------------------------------------------
       SUBMIT
       ----------------------------------------------------- */

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const submitButton =
          form.querySelector(
            'button[type="submit"]'
          );

        submitButton.disabled = true;

        submitButton.textContent =
          editingId
            ? "Saving…"
            : "Creating…";

        showError(null);

        try {

          /*
           IMPORTANT:
           payload starts EMPTY.

           We NEVER copy row.id.

           This prevents:
           "column id is an identity column"
          */

          const payload = {};

          /* -----------------------------------------------
             NORMAL FIELDS
             ----------------------------------------------- */

          for (const field of config.fields) {

            const input =
              form.querySelector(
                `[data-field="${field.key}"]`
              );

            if (!input) continue;

            /* FILE */

            if (
              field.type === "file"
            ) {

              const existingValue =
                editingRow
                  ? editingRow[field.key]
                  : "";

              if (
                input.files &&
                input.files.length > 0
              ) {

                setUploadStatus(
                  form,
                  field.key,
                  "Uploading image…"
                );

                const folder =
                  `${config.apiBase
                    .replace("/", "")}`;

                const publicUrl =
                  await uploadImage(
                    input.files[0],
                    folder
                  );

                payload[field.key] =
                  publicUrl;

                setUploadStatus(
                  form,
                  field.key,
                  "Image uploaded successfully.",
                  true
                );

              } else if (
                existingValue
              ) {

                /*
                 Keep existing image
                 during edit.
                */

                payload[field.key] =
                  existingValue;
              }

              continue;
            }

            /* CHECKBOX */

            if (
              field.type === "checkbox"
            ) {

              payload[field.key] =
                input.checked;

              continue;
            }

            /* TAGS */

            if (
              field.type === "tags"
            ) {

              payload[field.key] =
                input.value
                  .split(",")
                  .map(
                    value =>
                      value.trim()
                  )
                  .filter(Boolean);

              continue;
            }

            /* NUMBER */

            if (
              field.type === "number"
            ) {

              const value =
                input.value.trim();

              payload[field.key] =
                value === ""
                  ? 0
                  : Number(value);

              continue;
            }

            /* TEXT */

            payload[field.key] =
              input.value.trim();
          }

          /* -----------------------------------------------
             SAVE
             ----------------------------------------------- */

          if (editingId) {

            await Api.put(
              `${config.apiBase}/${encodeURIComponent(
                editingId
              )}`,
              payload
            );

          } else {

            await Api.post(
              config.apiBase,
              payload
            );
          }

          showForm = false;

          editingId = null;

          showError(null);

          await load();

        } catch (error) {

          console.error(
            "Admin save error:",
            error
          );

          showError(
            error.message ||
            "Failed to save."
          );

        } finally {

          submitButton.disabled =
            false;

          submitButton.textContent =
            editingId
              ? "Save Changes"
              : "Create";
        }

      }
    );
  }

  /* -------------------------------------------------------
     TABLE
     ------------------------------------------------------- */

  function renderTable() {

    if (!rows.length) {

      tableEl.innerHTML = `
        <div class="empty-state">
          <p class="text-sm text-muted">
            No ${esc(
              config.title.toLowerCase()
            )}s yet.
          </p>
        </div>
      `;

      return;
    }

    tableEl.innerHTML = `
      <div
        class="admin-panel-box"
        style="
          padding:0;
          overflow-x:auto;
        "
      >

        <table class="admin-table">

          <thead>
            <tr>

              ${config.columns
                .map(
                  column =>
                    `<th>${esc(column)}</th>`
                )
                .join("")}

              <th
                style="
                  text-align:right;
                "
              >
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            ${rows
              .map(
                row => `
                  <tr>

                    ${config.columns
                      .map(
                        column => {

                          const value =
                            row[column];

                          let display;

                          if (
                            Array.isArray(
                              value
                            )
                          ) {

                            display =
                              value.join(
                                ", "
                              );

                          } else if (
                            typeof value ===
                            "boolean"
                          ) {

                            display =
                              value
                                ? "✓"
                                : "—";

                          } else {

                            display =
                              esc(value);
                          }

                          return `
                            <td>
                              ${display}
                            </td>
                          `;
                        }
                      )
                      .join("")}

                    <td
                      style="
                        text-align:right;
                        white-space:nowrap;
                      "
                    >

                      <button
                        class="
                          link-btn
                          link-blue
                          mr-2
                        "
                        data-edit="${esc(
                          row.id
                        )}"
                        style="
                          margin-right:12px;
                        "
                      >
                        Edit
                      </button>

                      <button
                        class="
                          link-btn
                          link-red
                        "
                        data-delete="${esc(
                          row.id
                        )}"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")}

          </tbody>

        </table>

      </div>
    `;

    /* EDIT */

    tableEl
      .querySelectorAll(
        "[data-edit]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            editingId =
              button.dataset.edit;

            showForm = true;

            renderForm();

            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });

          }
        );

      });

    /* DELETE */

    tableEl
      .querySelectorAll(
        "[data-delete]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            const id =
              button.dataset.delete;

            if (
              !confirm(
                "Delete this item? This cannot be undone."
              )
            ) {
              return;
            }

            try {

              await Api.del(
                `${config.apiBase}/${encodeURIComponent(
                  id
                )}`
              );

              await load();

            } catch (error) {

              showError(
                error.message
              );
            }

          }
        );

      });
  }

  /* -------------------------------------------------------
     LOAD
     ------------------------------------------------------- */

  async function load() {

    countEl.textContent =
      "Loading…";

    try {

      rows =
        await Api.get(
          `${config.apiBase}/admin/all`
        );

      if (!Array.isArray(rows)) {
        rows = [];
      }

      countEl.textContent =
        `${rows.length} item${
          rows.length === 1
            ? ""
            : "s"
        }`;

      renderTable();

    } catch (error) {

      console.error(
        `Failed loading ${config.title}:`,
        error
      );

      showError(
        error.message
      );

      countEl.textContent =
        "Failed to load";
    }
  }

  /* -------------------------------------------------------
     TOGGLE
     ------------------------------------------------------- */

  toggleBtn.addEventListener(
    "click",
    () => {

      showForm = !showForm;

      editingId = null;

      showError(null);

      renderForm();
    }
  );

  load();
}

/* =========================================================
   JOIN REQUESTS
   ========================================================= */

const JOIN_STATUS_BADGE = {
  pending: "badge-yellow",
  approved: "badge-green",
  rejected: "badge-red"
};

function renderJoinRequestsPanel(container) {

  container.innerHTML = `
    <div id="jr-error"></div>

    <div id="jr-list">
      <div class="loading-text">
        Loading…
      </div>
    </div>
  `;

  const errorEl =
    container.querySelector(
      "#jr-error"
    );

  const listEl =
    container.querySelector(
      "#jr-list"
    );

  function showError(message) {

    errorEl.innerHTML =
      message
        ? `
          <div
            class="form-error mb-3"
            style="
              background:#fef2f2;
              padding:12px 16px;
              border-radius:10px;
            "
          >
            ${esc(message)}
          </div>
        `
        : "";
  }

  async function load() {

    try {

      const rows =
        await Api.get("/join");

      if (!rows.length) {

        listEl.innerHTML = `
          <div class="empty-state">
            <p class="text-sm text-muted">
              No applications yet.
            </p>
          </div>
        `;

        return;
      }

      listEl.innerHTML =
        rows
          .map(
            row => `
              <div class="admin-panel-box">

                <div
                  class="
                    flex
                    justify-between
                    items-start
                  "
                  style="gap:16px;"
                >

                  <div>

                    <div
                      class="
                        flex
                        items-center
                        gap-2
                        mb-1
                      "
                    >

                      <h4 class="h3">
                        ${esc(row.name)}
                      </h4>

                      <span
                        class="
                          badge
                          ${
                            JOIN_STATUS_BADGE[
                              row.status
                            ] ||
                            "badge-slate"
                          }
                        "
                      >
                        ${esc(row.status)}
                      </span>

                    </div>

                    <p class="text-sm text-muted">
                      ${esc(row.email)}
                      ·
                      @${esc(row.username)}
                    </p>

                    ${
                      row.skills
                        ? `
                          <p
                            class="
                              text-xs
                              text-muted
                              mt-1
                            "
                          >
                            Skills:
                            ${esc(row.skills)}
                          </p>
                        `
                        : ""
                    }

                    ${
                      row.message
                        ? `
                          <p class="text-sm mt-2">
                            ${esc(row.message)}
                          </p>
                        `
                        : ""
                    }

                  </div>

                  <div
                    class="
                      flex
                      flex-col
                      gap-2
                    "
                    style="
                      flex-shrink:0;
                      align-items:flex-end;
                    "
                  >

                    ${
                      row.status !==
                      "approved"
                        ? `
                          <button
                            class="btn btn-sm"
                            style="
                              background:#16a34a;
                              color:#fff;
                            "
                            data-approve="${esc(
                              row.id
                            )}"
                          >
                            Approve
                          </button>
                        `
                        : ""
                    }

                    ${
                      row.status !==
                      "rejected"
                        ? `
                          <button
                            class="btn btn-sm"
                            style="
                              background:#fef2f2;
                              color:#dc2626;
                            "
                            data-reject="${esc(
                              row.id
                            )}"
                          >
                            Reject
                          </button>
                        `
                        : ""
                    }

                    <button
                      class="link-btn"
                      style="
                        color:#94a3b8;
                      "
                      data-delete="${esc(
                        row.id
                      )}"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>
            `
          )
          .join("");

      listEl
        .querySelectorAll(
          "[data-approve]"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            () =>
              updateStatus(
                button.dataset.approve,
                "approved"
              )
          );

        });

      listEl
        .querySelectorAll(
          "[data-reject]"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            () =>
              updateStatus(
                button.dataset.reject,
                "rejected"
              )
          );

        });

      listEl
        .querySelectorAll(
          "[data-delete]"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            async () => {

              if (
                !confirm(
                  "Delete this application?"
                )
              ) {
                return;
              }

              try {

                await Api.del(
                  `/join/${encodeURIComponent(
                    button.dataset.delete
                  )}`
                );

                await load();

              } catch (error) {

                showError(
                  error.message
                );
              }

            }
          );

        });

    } catch (error) {

      showError(
        error.message
      );
    }
  }

  async function updateStatus(
    id,
    status
  ) {

    try {

      await Api.put(
        `/join/${encodeURIComponent(id)}`,
        { status }
      );

      await load();

    } catch (error) {

      showError(
        error.message
      );
    }
  }

  load();
}

/* =========================================================
   MESSAGES
   ========================================================= */

function renderMessagesPanel(container) {

  container.innerHTML = `
    <div id="msg-error"></div>

    <div id="msg-list">
      <div class="loading-text">
        Loading…
      </div>
    </div>
  `;

  const errorEl =
    container.querySelector(
      "#msg-error"
    );

  const listEl =
    container.querySelector(
      "#msg-list"
    );

  function showError(message) {

    errorEl.innerHTML =
      message
        ? `
          <div
            class="form-error mb-3"
            style="
              background:#fef2f2;
              padding:12px 16px;
              border-radius:10px;
            "
          >
            ${esc(message)}
          </div>
        `
        : "";
  }

  async function load() {

    try {

      const rows =
        await Api.get("/contact");

      if (!rows.length) {

        listEl.innerHTML = `
          <div class="empty-state">
            <p class="text-sm text-muted">
              No messages yet.
            </p>
          </div>
        `;

        return;
      }

      listEl.innerHTML =
        rows
          .map(
            message => `
              <div
                class="admin-panel-box"
                style="${
                  message.read
                    ? ""
                    : `
                      background:#eff6ff;
                      border-color:#bfdbfe;
                    `
                }"
              >

                <div
                  class="
                    flex
                    justify-between
                    items-start
                  "
                  style="gap:16px;"
                >

                  <div>

                    <div
                      class="
                        flex
                        items-center
                        gap-2
                        mb-1
                      "
                    >

                      <h4 class="h3">
                        ${esc(
                          message.subject
                        )}
                      </h4>

                      ${
                        !message.read
                          ? `
                            <span
                              class="badge"
                              style="
                                background:#1d4ed8;
                                color:#fff;
                              "
                            >
                              New
                            </span>
                          `
                          : ""
                      }

                    </div>

                    <p class="text-sm text-muted">
                      ${esc(message.name)}
                      ·
                      ${esc(message.email)}
                    </p>

                    <p class="text-sm mt-2">
                      ${esc(message.message)}
                    </p>

                  </div>

                  <div
                    class="
                      flex
                      flex-col
                      gap-2
                    "
                    style="
                      flex-shrink:0;
                      align-items:flex-end;
                    "
                  >

                    <button
                      class="btn btn-sm"
                      style="
                        background:#f1f5f9;
                        color:#475569;
                      "
                      data-toggle-read="${esc(
                        message.id
                      )}"
                      data-read="${message.read}"
                    >
                      ${
                        message.read
                          ? "Mark unread"
                          : "Mark read"
                      }
                    </button>

                    <button
                      class="link-btn"
                      style="
                        color:#94a3b8;
                      "
                      data-delete="${esc(
                        message.id
                      )}"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>
            `
          )
          .join("");

      listEl
        .querySelectorAll(
          "[data-toggle-read]"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            async () => {

              try {

                await Api.put(
                  `/contact/${encodeURIComponent(
                    button.dataset.toggleRead
                  )}`,
                  {
                    read:
                      button.dataset.read !==
                      "true"
                  }
                );

                await load();

              } catch (error) {

                showError(
                  error.message
                );
              }

            }
          );

        });

      listEl
        .querySelectorAll(
          "[data-delete]"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            async () => {

              if (
                !confirm(
                  "Delete this message?"
                )
              ) {
                return;
              }

              try {

                await Api.del(
                  `/contact/${encodeURIComponent(
                    button.dataset.delete
                  )}`
                );

                await load();

              } catch (error) {

                showError(
                  error.message
                );
              }

            }
          );

        });

    } catch (error) {

      showError(
        error.message
      );
    }
  }

  load();
}

/* =========================================================
   CTF CHALLENGES
   ========================================================= */

function renderChallengesPanel(container) {

  let rows = [];

  let showForm = false;

  let editingId = null;

  container.innerHTML = `
    <div
      class="
        flex
        justify-between
        items-center
        mb-4
      "
    >

      <div
        class="text-sm text-muted"
        id="ch-count"
      >
        Loading…
      </div>

      <button
        id="ch-toggle"
        class="btn btn-primary btn-sm"
      >
        + Add Challenge
      </button>

    </div>

    <div id="ch-error"></div>

    <div id="ch-form"></div>

    <div id="ch-table"></div>
  `;

  const countEl =
    container.querySelector(
      "#ch-count"
    );

  const toggleBtn =
    container.querySelector(
      "#ch-toggle"
    );

  const errorEl =
    container.querySelector(
      "#ch-error"
    );

  const formEl =
    container.querySelector(
      "#ch-form"
    );

  const tableEl =
    container.querySelector(
      "#ch-table"
    );

  function showError(message) {

    errorEl.innerHTML =
      message
        ? `
          <div
            class="form-error mb-3"
            style="
              background:#fef2f2;
              padding:12px 16px;
              border-radius:10px;
            "
          >
            ${esc(message)}
          </div>
        `
        : "";
  }

  function renderForm() {

    if (!showForm) {

      formEl.innerHTML = "";

      toggleBtn.textContent =
        "+ Add Challenge";

      return;
    }

    toggleBtn.textContent =
      "Cancel";

    const row =
      editingId
        ? rows.find(
            item =>
              String(item.id) ===
              String(editingId)
          )
        : null;

    formEl.innerHTML = `
      <form
        id="ch-entity-form"
        class="admin-panel-box"
      >

        <h3 class="h3 mb-3">
          ${
            editingId
              ? "Edit"
              : "New"
          }
          Challenge
        </h3>

        <div class="grid grid-2">

          <div class="field">

            <label>
              Title
            </label>

            <input
              data-f="title"
              value="${esc(
                row?.title || ""
              )}"
            />

          </div>

          <div class="field">

            <label>
              Category
            </label>

            <input
              data-f="category"
              value="${esc(
                row?.category || ""
              )}"
              placeholder="
                Crypto, Web, Forensics, Pwn…
              "
            />

          </div>

          <div
            class="field"
            style="grid-column:1/-1;"
          >

            <label>
              Description
            </label>

            <textarea
              data-f="description"
              rows="3"
            >${esc(
              row?.description || ""
            )}</textarea>

          </div>

          <div class="field">

            <label>
              Difficulty
            </label>

            <select data-f="difficulty">

              ${[
                "Easy",
                "Medium",
                "Hard",
                "Insane"
              ]
                .map(
                  difficulty => `
                    <option
                      value="${difficulty}"
                      ${
                        row?.difficulty ===
                        difficulty
                          ? "selected"
                          : ""
                      }
                    >
                      ${difficulty}
                    </option>
                  `
                )
                .join("")}

            </select>

          </div>

          <div class="field">

            <label>
              Points
            </label>

            <input
              data-f="points"
              type="number"
              value="${
                row?.points ?? 50
              }"
            />

          </div>

          <div
            class="field"
            style="grid-column:1/-1;"
          >

            <label>
              Flag

              ${
                editingId
                  ? `
                    <span
                      style="
                        color:#94a3b8;
                        font-weight:400;
                      "
                    >
                      (leave blank to keep current flag)
                    </span>
                  `
                  : ""
              }

            </label>

            <input
              data-f="flag"
              class="mono"
              placeholder="flag{...}"
            />

            <p class="text-xs text-muted mt-1">
              Stored hashed — never shown again.
            </p>

          </div>

          <div class="field-check mt-2">

            <input
              type="checkbox"
              data-f="published"
              ${
                row?.published !== false
                  ? "checked"
                  : ""
              }
            />

            <span class="text-sm">
              Published
            </span>

          </div>

        </div>

        <button
          type="submit"
          class="btn btn-primary mt-2"
        >
          ${
            editingId
              ? "Save Changes"
              : "Create"
          }
        </button>

      </form>
    `;

    formEl
      .querySelector(
        "#ch-entity-form"
      )
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          const get = key =>
            formEl.querySelector(
              `[data-f="${key}"]`
            );

          const payload = {
            title:
              get("title").value.trim(),

            category:
              get("category").value.trim(),

            description:
              get("description").value.trim(),

            difficulty:
              get("difficulty").value,

            points:
              Number(
                get("points").value
              ),

            published:
              get("published").checked
          };

          const flag =
            get("flag")
              .value
              .trim();

          if (flag) {
            payload.flag = flag;
          }

          try {

            if (editingId) {

              await Api.put(
                `/ctf/challenges/${encodeURIComponent(
                  editingId
                )}`,
                payload
              );

            } else {

              if (!flag) {

                showError(
                  "A flag is required when creating a new challenge."
                );

                return;
              }

              await Api.post(
                "/ctf/challenges",
                payload
              );
            }

            showForm = false;

            editingId = null;

            showError(null);

            await load();

          } catch (error) {

            showError(
              error.message
            );
          }
        }
      );
  }

  function renderTable() {

    if (!rows.length) {

      tableEl.innerHTML = `
        <div class="empty-state">
          <p class="text-sm text-muted">
            No challenges yet.
          </p>
        </div>
      `;

      return;
    }

    tableEl.innerHTML = `
      <div
        class="admin-panel-box"
        style="
          padding:0;
          overflow-x:auto;
        "
      >

        <table class="admin-table">

          <thead>

            <tr>
              <th>title</th>
              <th>category</th>
              <th>difficulty</th>
              <th>points</th>
              <th>published</th>
              <th
                style="text-align:right;"
              >
                Actions
              </th>
            </tr>

          </thead>

          <tbody>

            ${rows
              .map(
                row => `
                  <tr>

                    <td>
                      ${esc(row.title)}
                    </td>

                    <td>
                      ${esc(row.category)}
                    </td>

                    <td>
                      ${esc(
                        row.difficulty
                      )}
                    </td>

                    <td>
                      ${row.points}
                    </td>

                    <td>
                      ${
                        row.published !== false
                          ? "✓"
                          : "—"
                      }
                    </td>

                    <td
                      style="
                        text-align:right;
                        white-space:nowrap;
                      "
                    >

                      <button
                        class="
                          link-btn
                          link-blue
                        "
                        data-edit="${esc(
                          row.id
                        )}"
                        style="
                          margin-right:12px;
                        "
                      >
                        Edit
                      </button>

                      <button
                        class="
                          link-btn
                          link-red
                        "
                        data-delete="${esc(
                          row.id
                        )}"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")}

          </tbody>

        </table>

      </div>
    `;

    tableEl
      .querySelectorAll(
        "[data-edit]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            editingId =
              button.dataset.edit;

            showForm = true;

            renderForm();
          }
        );

      });

    tableEl
      .querySelectorAll(
        "[data-delete]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            if (
              !confirm(
                "Delete this challenge?"
              )
            ) {
              return;
            }

            try {

              await Api.del(
                `/ctf/challenges/${encodeURIComponent(
                  button.dataset.delete
                )}`
              );

              await load();

            } catch (error) {

              showError(
                error.message
              );
            }

          }
        );

      });
  }

  async function load() {

    countEl.textContent =
      "Loading…";

    try {

      rows =
        await Api.get(
          "/ctf/challenges/admin/all"
        );

      if (!Array.isArray(rows)) {
        rows = [];
      }

      countEl.textContent =
        `${rows.length} challenge${
          rows.length === 1
            ? ""
            : "s"
        }`;

      renderTable();

    } catch (error) {

      showError(
        error.message
      );
    }
  }

  toggleBtn.addEventListener(
    "click",
    () => {

      showForm = !showForm;

      editingId = null;

      renderForm();
    }
  );

  load();
}

/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettingsPanel(container) {

  container.innerHTML = `
    <div
      class="admin-panel-box"
      style="max-width:420px;"
    >

      <h3 class="h3 mb-3">
        Change Admin Password
      </h3>

      <form id="settings-form">

        <div class="field">

          <label>
            Current Password
          </label>

          <input
            type="password"
            id="s-current"
            required
          />

        </div>

        <div class="field">

          <label>
            New Password
          </label>

          <input
            type="password"
            id="s-new"
            required
          />

        </div>

        <div class="field">

          <label>
            Confirm New Password
          </label>

          <input
            type="password"
            id="s-confirm"
            required
          />

        </div>

        <p
          id="settings-error"
          class="form-error hidden"
        ></p>

        <p
          id="settings-success"
          class="form-success hidden"
        >
          Password updated.
        </p>

        <button
          type="submit"
          id="settings-submit"
          class="btn btn-primary mt-1"
        >
          Update Password
        </button>

      </form>

    </div>
  `;

  const form =
    document.getElementById(
      "settings-form"
    );

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const errorEl =
        document.getElementById(
          "settings-error"
        );

      const successEl =
        document.getElementById(
          "settings-success"
        );

      const button =
        document.getElementById(
          "settings-submit"
        );

      errorEl.classList.add(
        "hidden"
      );

      successEl.classList.add(
        "hidden"
      );

      const currentPassword =
        document.getElementById(
          "s-current"
        ).value;

      const newPassword =
        document.getElementById(
          "s-new"
        ).value;

      const confirmation =
        document.getElementById(
          "s-confirm"
        ).value;

      if (
        newPassword !==
        confirmation
      ) {

        errorEl.textContent =
          "New password and confirmation don't match.";

        errorEl.classList.remove(
          "hidden"
        );

        return;
      }

      button.disabled = true;

      button.textContent =
        "Saving…";

      try {

        await Api.post(
          "/auth/change-password",
          {
            currentPassword,
            newPassword
          }
        );

        successEl.classList.remove(
          "hidden"
        );

        form.reset();

      } catch (error) {

        errorEl.textContent =
          error.message ||
          "Failed to change password.";

        errorEl.classList.remove(
          "hidden"
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "Update Password";
      }
    }
  );
}

/* =========================================================
   AUTH
   ========================================================= */

async function initAdminAuth() {

  try {

    setupSupabaseClient();

    if (
      typeof Api !==
      "undefined" &&
      typeof Api.init ===
      "function"
    ) {

      await Api.init();
    }

    if (
      typeof Api !==
      "undefined" &&
      typeof Api.isAuthed ===
      "function" &&
      Api.isAuthed()
    ) {

      showAdminShell();

    } else {

      showLoginScreen();
    }

  } catch (error) {

    console.error(
      "Admin initialization error:",
      error
    );

    showLoginScreen();
  }
}

/* =========================================================
   LOGIN
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupSupabaseClient();

    const loginForm =
      document.getElementById(
        "login-form"
      );

    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        async event => {

          event.preventDefault();

          const button =
            document.getElementById(
              "login-submit"
            );

          const errorEl =
            document.getElementById(
              "login-error"
            );

          const username =
            document.getElementById(
              "login-username"
            );

          const password =
            document.getElementById(
              "login-password"
            );

          if (errorEl) {
            errorEl.classList.add(
              "hidden"
            );
          }

          if (button) {
            button.disabled = true;
            button.textContent =
              "Signing in…";
          }

          try {

            await Api.login(
              username.value,
              password.value
            );

            showAdminShell();

          } catch (error) {

            if (errorEl) {

              errorEl.textContent =
                error.message ||
                "Invalid credentials.";

              errorEl.classList.remove(
                "hidden"
              );
            }

          } finally {

            if (button) {

              button.disabled =
                false;

              button.textContent =
                "Sign In";
            }
          }
        }
      );
    }

    const logoutButton =
      document.getElementById(
        "logout-btn"
      );

    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        async () => {

          try {

            await Api.logout();

          } catch (error) {

            console.error(
              "Logout error:",
              error
            );

          } finally {

            showLoginScreen();
          }
        }
      );
    }

    initAdminAuth();
  }
);