// =====================================================
// DragonByte Admin Panel
// =====================================================

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
  { id: "settings", label: "Settings", icon: "⚙️" },
];

let activeSection = "dashboard";

// =====================================================
// AUTH
// =====================================================

function showAdminShell() {
  const loginScreen = document.getElementById("login-screen");
  const adminShell = document.getElementById("admin-shell");

  if (loginScreen) loginScreen.classList.add("hidden");
  if (adminShell) adminShell.classList.remove("hidden");

  renderSidebar();
  goToSection("dashboard");
}

function showLoginScreen() {
  const loginScreen = document.getElementById("login-screen");
  const adminShell = document.getElementById("admin-shell");

  if (adminShell) adminShell.classList.add("hidden");
  if (loginScreen) loginScreen.classList.remove("hidden");
}

// =====================================================
// LOGIN
// =====================================================

function setupLogin() {
  const form = document.getElementById("login-form");

  if (!form) {
    console.warn("DragonByte Admin: login-form not found.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.getElementById("login-submit");
    const errEl = document.getElementById("login-error");

    if (errEl) {
      errEl.classList.add("hidden");
      errEl.textContent = "";
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Signing in…";
    }

    try {
      const email = document.getElementById("login-username")?.value || "";
      const password = document.getElementById("login-password")?.value || "";

      await Api.login(email, password);

      showAdminShell();
    } catch (err) {
      if (errEl) {
        errEl.textContent = err?.message || "Invalid credentials";
        errEl.classList.remove("hidden");
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Sign In";
      }
    }
  });
}

// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {
  const btn = document.getElementById("logout-btn");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      await Api.logout();
    } catch (err) {
      console.error("Logout error:", err);
    }

    showLoginScreen();
  });
}

// =====================================================
// SIDEBAR
// =====================================================

function renderSidebar() {
  const nav = document.getElementById("admin-nav");

  if (!nav) return;

  nav.innerHTML = ADMIN_SECTIONS.map(
    (section) => `
      <button
        type="button"
        class="admin-nav-item ${
          section.id === activeSection ? "active" : ""
        }"
        data-section="${section.id}"
      >
        <span>${section.icon}</span>
        ${section.label}
      </button>
    `,
  ).join("");

  nav.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      goToSection(btn.dataset.section);
    });
  });
}

// =====================================================
// NAVIGATION
// =====================================================

function goToSection(id) {
  const section = ADMIN_SECTIONS.find((s) => s.id === id);

  if (!section) {
    console.warn("Unknown admin section:", id);
    return;
  }

  activeSection = id;

  renderSidebar();

  const title = document.getElementById("section-title");

  if (title) {
    title.textContent = section.label;
  }

  renderSection(id);
}

// =====================================================
// SECTION ROUTER
// =====================================================

function renderSection(id) {
  const el = document.getElementById("section-content");

  if (!el) return;

  el.innerHTML = "";

  switch (id) {
    case "dashboard":
      return renderDashboard(el);

    case "members":
      return renderEntityManager(el, entityConfigs.members);

    case "contributors":
      return renderEntityManager(el, entityConfigs.contributors);

    case "events":
      return renderEntityManager(el, entityConfigs.events);

    case "projects":
      return renderEntityManager(el, entityConfigs.projects);

    case "teams":
      return renderEntityManager(el, entityConfigs.teams);

    case "testimonials":
      return renderEntityManager(el, entityConfigs.testimonials);

    case "challenges":
      return renderChallengesPanel(el);

    case "join-requests":
      return renderJoinRequestsPanel(el);

    case "messages":
      return renderMessagesPanel(el);

    case "settings":
      return renderSettingsPanel(el);

    default:
      el.innerHTML = `
        <div class="empty-state">
          <p class="text-sm text-muted">
            Section not found.
          </p>
        </div>
      `;
  }
}

// =====================================================
// DASHBOARD
// =====================================================

const STAT_META = [
  {
    key: "members",
    label: "Members",
    icon: "👥",
    endpoint: "/members",
  },
  {
    key: "events",
    label: "Events",
    icon: "📅",
    endpoint: "/events",
  },
  {
    key: "projects",
    label: "Projects",
    icon: "🔧",
    endpoint: "/projects",
  },
  {
    key: "contributors",
    label: "Contributors",
    icon: "⭐",
    endpoint: "/contributors",
  },
  {
    key: "teams",
    label: "Teams",
    icon: "🛡️",
    endpoint: "/teams",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    icon: "💬",
    endpoint: "/testimonials",
  },
  {
    key: "challenges",
    label: "CTF Challenges",
    icon: "🚩",
    endpoint: "/ctf/challenges",
  },
];

async function renderDashboard(el) {
  el.innerHTML = `
    <div class="grid grid-3" id="stat-grid">
      ${STAT_META.map(
        (stat) => `
          <div class="stat-card">
            <div class="top">
              <span>${stat.icon}</span>
              <span
                class="value"
                id="stat-${stat.key}"
              >
                …
              </span>
            </div>

            <div
              class="text-sm"
              style="font-weight:500; color:#475569;"
            >
              ${stat.label}
            </div>
          </div>
        `,
      ).join("")}
    </div>
  `;

  for (const stat of STAT_META) {
    try {
      const rows = await Api.get(stat.endpoint);

      const node = document.getElementById(`stat-${stat.key}`);

      if (node) {
        node.textContent = Array.isArray(rows)
          ? rows.length
          : 0;
      }
    } catch (err) {
      console.error(
        `Dashboard ${stat.key} error:`,
        err,
      );

      const node = document.getElementById(
        `stat-${stat.key}`,
      );

      if (node) {
        node.textContent = "0";
      }
    }
  }
}

// =====================================================
// ENTITY CONFIGURATION
// =====================================================

const entityConfigs = {
  // ---------------------------------------------------
  // MEMBERS
  // ---------------------------------------------------

  members: {
    title: "Member",
    apiBase: "/members",

    columns: [
      "name",
      "email",
      "username",
      "photo",
    ],

    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
      },

      {
        key: "email",
        label: "Email",
        type: "text",
      },

      {
        key: "username",
        label: "Username",
        type: "text",
      },

      {
        key: "skills",
        label: "Skills",
        type: "tags",
      },

      {
        key: "photo",
        label: "Profile Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "cover_photo",
        label: "Cover Photo URL",
        type: "text",
        placeholder: "https://...",
      },
    ],
  },

  // ---------------------------------------------------
  // CONTRIBUTORS
  // ---------------------------------------------------

  contributors: {
    title: "Contributor",
    apiBase: "/contributors",

    columns: [
      "name",
      "role",
      "featured",
    ],

    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
      },

      {
        key: "role",
        label: "Role",
        type: "text",
      },

      {
        key: "bio",
        label: "Bio",
        type: "textarea",
      },

      {
        key: "photo",
        label: "Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "cover_photo",
        label: "Cover Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "skills",
        label: "Skills",
        type: "tags",
      },

      {
        key: "github",
        label: "GitHub URL",
        type: "text",
      },

      {
        key: "linkedin",
        label: "LinkedIn URL",
        type: "text",
      },

      {
        key: "featured",
        label: "Featured on homepage",
        type: "checkbox",
      },
    ],
  },

  // ---------------------------------------------------
  // EVENTS
  // ---------------------------------------------------

  events: {
    title: "Event",
    apiBase: "/events",

    columns: [
      "title",
      "date",
      "location",
      "published",
    ],

    fields: [
      {
        key: "title",
        label: "Title",
        type: "text",
      },

      {
        key: "description",
        label: "Description",
        type: "textarea",
      },

      {
        key: "date",
        label: "Date",
        type: "text",
        placeholder: "2026-12-01",
      },

      {
        key: "time",
        label: "Time",
        type: "text",
        placeholder: "10:00 AM",
      },

      {
        key: "location",
        label: "Location",
        type: "text",
      },

      {
        key: "category",
        label: "Category",
        type: "text",
      },

      {
        key: "image",
        label: "Event Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "cover_photo",
        label: "Event Cover Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "registrationUrl",
        label: "Registration URL",
        type: "text",
      },

      {
        key: "featured",
        label: "Featured on homepage",
        type: "checkbox",
      },

      {
        key: "published",
        label: "Published (visible to visitors)",
        type: "checkbox",
      },
    ],
  },

  // ---------------------------------------------------
  // PROJECTS
  // ---------------------------------------------------

  projects: {
    title: "Project",
    apiBase: "/projects",

    columns: [
      "name",
      "category",
      "published",
    ],

    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
      },

      {
        key: "description",
        label: "Description",
        type: "textarea",
      },

      {
        key: "image",
        label: "Project Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "cover_photo",
        label: "Project Cover Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "githubUrl",
        label: "GitHub URL",
        type: "text",
      },

      {
        key: "demoUrl",
        label: "Demo URL",
        type: "text",
      },

      {
        key: "resourceUrl",
        label: "Resource Link",
        type: "text",
      },

      {
        key: "technologies",
        label: "Technologies",
        type: "tags",
      },

      {
        key: "contributors",
        label: "Contributors",
        type: "tags",
      },

      {
        key: "category",
        label: "Category",
        type: "text",
      },

      {
        key: "featured",
        label: "Featured on homepage",
        type: "checkbox",
      },

      {
        key: "published",
        label: "Published (visible to visitors)",
        type: "checkbox",
      },
    ],
  },

  // ---------------------------------------------------
  // TEAMS
  // ---------------------------------------------------

  teams: {
    title: "Team",
    apiBase: "/teams",

    columns: [
      "name",
      "description",
    ],

    fields: [
      {
        key: "name",
        label: "Team Name",
        type: "text",
      },

      {
        key: "description",
        label: "Description",
        type: "textarea",
      },

      {
        key: "photo",
        label: "Team Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "cover_photo",
        label: "Team Cover Photo URL",
        type: "text",
        placeholder: "https://...",
      },

      {
        key: "members",
        label: "Members",
        type: "tags",
      },

      {
        key: "featured",
        label: "Featured",
        type: "checkbox",
      },
    ],
  },

  // ---------------------------------------------------
  // TESTIMONIALS
  // ---------------------------------------------------

  testimonials: {
    title: "Testimonial",
    apiBase: "/testimonials",

    columns: [
      "name",
      "role",
      "approved",
    ],

    fields: [
      {
        key: "quote",
        label: "Quote",
        type: "textarea",
      },

      {
        key: "name",
        label: "Name",
        type: "text",
      },

      {
        key: "role",
        label: "Role",
        type: "text",
      },

      {
        key: "photo",
        label: "Photo URL",
        type: "text",
      },

      {
        key: "approved",
        label: "Approved (visible to visitors)",
        type: "checkbox",
      },
    ],
  },
};

// =====================================================
// FIELD HTML
// =====================================================

function fieldInputHtml(field, value) {
  const v =
    value ??
    (field.type === "checkbox" ? false : "");

  // CHECKBOX
  if (field.type === "checkbox") {
    return `
      <label class="field-check mt-2">
        <input
          type="checkbox"
          data-field="${field.key}"
          ${v ? "checked" : ""}
        />
        <span class="text-sm">Yes</span>
      </label>
    `;
  }

  // TEXTAREA
  if (field.type === "textarea") {
    return `
      <textarea
        data-field="${field.key}"
        rows="4"
        placeholder="${esc(field.placeholder || "")}"
      >${esc(v)}</textarea>
    `;
  }

  // TAGS
  const displayValue =
    field.type === "tags" && Array.isArray(v)
      ? v.join(", ")
      : v;

  return `
    <input
      type="${field.inputType || "text"}"
      data-field="${field.key}"
      value="${esc(displayValue)}"
      placeholder="${esc(
        field.placeholder ||
          (field.type === "tags"
            ? "comma, separated, values"
            : ""),
      )}"
    />
  `;
}

// =====================================================
// GENERIC ENTITY MANAGER
// =====================================================

function renderEntityManager(container, config) {
  let rows = [];
  let showForm = false;
  let editingId = null;

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <div
        class="text-sm text-muted"
        id="em-count"
      >
        Loading…
      </div>

      <button
        type="button"
        id="em-toggle"
        class="btn btn-primary btn-sm"
      >
        + Add ${config.title}
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

  // ---------------------------------------------------
  // ERROR
  // ---------------------------------------------------

  function showError(message) {
    if (!errorEl) return;

    errorEl.innerHTML = message
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

  // ---------------------------------------------------
  // FORM
  // ---------------------------------------------------

  function renderForm() {
    if (!showForm) {
      formEl.innerHTML = "";

      toggleBtn.textContent =
        `+ Add ${config.title}`;

      return;
    }

    toggleBtn.textContent = "Cancel";

    const editingRow = editingId
      ? rows.find(
          (row) => String(row.id) === String(editingId),
        )
      : null;

    formEl.innerHTML = `
      <form
        id="em-entity-form"
        class="admin-panel-box"
      >
        <h3 class="h3 mb-3">
          ${editingId ? "Edit" : "New"}
          ${config.title}
        </h3>

        <div class="grid grid-2">

          ${config.fields
            .map(
              (field) => `
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
                      : undefined,
                  )}
                </div>
              `,
            )
            .join("")}

        </div>

        <div class="flex gap-2 mt-3">
          <button
            type="submit"
            class="btn btn-primary"
          >
            ${editingId ? "Save Changes" : "Create"}
          </button>

          <button
            type="button"
            id="em-form-cancel"
            class="btn"
          >
            Cancel
          </button>
        </div>
      </form>
    `;

    const form =
      formEl.querySelector("#em-entity-form");

    const cancelBtn =
      formEl.querySelector("#em-form-cancel");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        showForm = false;
        editingId = null;
        renderForm();
      });
    }

    form.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();

        const submitBtn =
          form.querySelector(
            'button[type="submit"]',
          );

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = editingId
            ? "Saving…"
            : "Creating…";
        }

        const payload = {};

        config.fields.forEach((field) => {
          const input =
            form.querySelector(
              `[data-field="${field.key}"]`,
            );

          if (!input) return;

          if (field.type === "checkbox") {
            payload[field.key] =
              input.checked;
          } else if (
            field.type === "tags"
          ) {
            payload[field.key] =
              input.value
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean);
          } else {
            payload[field.key] =
              input.value.trim();
          }
        });

        try {
          if (editingId) {
            // IMPORTANT:
            // Your Api.js uses Api.update()
            await Api.update(
              config.apiBase,
              editingId,
              payload,
            );
          } else {
            await Api.post(
              config.apiBase,
              payload,
            );
          }

          showForm = false;
          editingId = null;

          showError(null);

          await load();
        } catch (err) {
          console.error(
            `Save ${config.title} error:`,
            err,
          );

          showError(
            err?.message ||
              `Failed to save ${config.title}`,
          );
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = editingId
              ? "Save Changes"
              : "Create";
          }
        }
      },
    );
  }

  // ---------------------------------------------------
  // TABLE
  // ---------------------------------------------------

  function renderTable() {
    if (!rows.length) {
      tableEl.innerHTML = `
        <div class="empty-state">
          <p class="text-sm text-muted">
            No ${config.title.toLowerCase()}s yet.
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
                  (column) => `
                    <th>
                      ${esc(column)}
                    </th>
                  `,
                )
                .join("")}

              <th style="text-align:right;">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>

            ${rows
              .map(
                (row) => `
                  <tr>

                    ${config.columns
                      .map((column) => {
                        const value =
                          row[column];

                        let display = "";

                        if (
                          Array.isArray(value)
                        ) {
                          display =
                            value.join(", ");
                        } else if (
                          typeof value ===
                          "boolean"
                        ) {
                          display =
                            value
                              ? "✓"
                              : "—";
                        } else if (
                          value === null ||
                          value === undefined
                        ) {
                          display = "—";
                        } else {
                          display =
                            esc(value);
                        }

                        return `
                          <td>
                            ${display}
                          </td>
                        `;
                      })
                      .join("")}

                    <td
                      style="
                        text-align:right;
                        white-space:nowrap;
                      "
                    >
                      <button
                        type="button"
                        class="link-btn link-blue"
                        data-edit="${esc(row.id)}"
                        style="margin-right:12px;"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        class="link-btn link-red"
                        data-delete="${esc(row.id)}"
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                `,
              )
              .join("")}

          </tbody>
        </table>
      </div>
    `;

    // EDIT
    tableEl
      .querySelectorAll("[data-edit]")
      .forEach((btn) => {
        btn.addEventListener(
          "click",
          () => {
            editingId =
              btn.dataset.edit;

            showForm = true;

            renderForm();

            formEl.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          },
        );
      });

    // DELETE
    tableEl
      .querySelectorAll("[data-delete]")
      .forEach((btn) => {
        btn.addEventListener(
          "click",
          async () => {
            const id =
              btn.dataset.delete;

            if (
              !confirm(
                `Delete this ${config.title.toLowerCase()}? This can't be undone.`,
              )
            ) {
              return;
            }

            try {
              // IMPORTANT:
              // Your Api.js expects:
              // Api.del(path, id)
              await Api.del(
                config.apiBase,
                id,
              );

              await load();
            } catch (err) {
              console.error(
                "Delete error:",
                err,
              );

              showError(
                err?.message ||
                  "Delete failed",
              );
            }
          },
        );
      });
  }

  // ---------------------------------------------------
  // LOAD
  // ---------------------------------------------------

  async function load() {
    countEl.textContent = "Loading…";

    try {
      rows = await Api.get(
        `${config.apiBase}/admin/all`,
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
    } catch (err) {
      console.error(
        `Load ${config.title} error:`,
        err,
      );

      rows = [];

      countEl.textContent = "0 items";

      renderTable();

      showError(
        err?.message ||
          `Failed to load ${config.title}s`,
      );
    }
  }

  // ---------------------------------------------------
  // ADD BUTTON
  // ---------------------------------------------------

  toggleBtn.addEventListener(
    "click",
    () => {
      showForm = !showForm;
      editingId = null;

      renderForm();
    },
  );

  // INITIAL LOAD
  load();
}

// =====================================================
// JOIN REQUESTS
// =====================================================

const JOIN_STATUS_BADGE = {
  pending: "badge-yellow",
  approved: "badge-green",
  rejected: "badge-red",
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
    container.querySelector("#jr-error");

  const listEl =
    container.querySelector("#jr-list");

  function showError(message) {
    errorEl.innerHTML = message
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
      /*
       * NOTE:
       * Your current api.js does not contain
       * "/join" in API_TABLES.
       *
       * So this section requires /join to be
       * added to api.js OR handled by your API.
       */
      const rows = await Api.get("/join");

      if (!Array.isArray(rows) || !rows.length) {
        listEl.innerHTML = `
          <div class="empty-state">
            <p class="text-sm text-muted">
              No applications yet.
            </p>
          </div>
        `;

        return;
      }

      listEl.innerHTML = rows
        .map(
          (row) => `
            <div class="admin-panel-box">

              <div
                class="flex justify-between items-start"
                style="gap:16px;"
              >

                <div>

                  <div
                    class="flex items-center gap-2 mb-1"
                  >
                    <h4 class="h3">
                      ${esc(row.name)}
                    </h4>

                    <span
                      class="badge ${
                        JOIN_STATUS_BADGE[
                          row.status
                        ] ||
                        "badge-slate"
                      }"
                    >
                      ${esc(row.status)}
                    </span>
                  </div>

                  <p class="text-sm text-muted">
                    ${esc(row.email)}
                    · @${esc(row.username)}
                  </p>

                  ${
                    row.skills
                      ? `
                        <p class="text-xs text-muted mt-1">
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
                  class="flex flex-col gap-2"
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
                          type="button"
                          class="btn btn-sm"
                          style="
                            background:#16a34a;
                            color:#fff;
                          "
                          data-approve="${esc(
                            row.id,
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
                          type="button"
                          class="btn btn-sm"
                          style="
                            background:#fef2f2;
                            color:#dc2626;
                          "
                          data-reject="${esc(
                            row.id,
                          )}"
                        >
                          Reject
                        </button>
                      `
                      : ""
                  }

                  <button
                    type="button"
                    class="link-btn"
                    style="color:#94a3b8;"
                    data-delete="${esc(row.id)}"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>
          `,
        )
        .join("");

      // APPROVE
      listEl
        .querySelectorAll("[data-approve]")
        .forEach((btn) => {
          btn.addEventListener(
            "click",
            () =>
              updateStatus(
                btn.dataset.approve,
                "approved",
              ),
          );
        });

      // REJECT
      listEl
        .querySelectorAll("[data-reject]")
        .forEach((btn) => {
          btn.addEventListener(
            "click",
            () =>
              updateStatus(
                btn.dataset.reject,
                "rejected",
              ),
          );
        });

      // DELETE
      listEl
        .querySelectorAll("[data-delete]")
        .forEach((btn) => {
          btn.addEventListener(
            "click",
            async () => {
              if (
                !confirm(
                  "Delete this application?",
                )
              ) {
                return;
              }

              try {
                await Api.del(
                  "/join",
                  btn.dataset.delete,
                );

                await load();
              } catch (err) {
                showError(
                  err?.message ||
                    "Delete failed",
                );
              }
            },
          );
        });
    } catch (err) {
      showError(
        err?.message ||
          "Failed to load join requests",
      );
    }
  }

  async function updateStatus(
    id,
    status,
  ) {
    try {
      await Api.update(
        "/join",
        id,
        { status },
      );

      await load();
    } catch (err) {
      showError(
        err?.message ||
          "Failed to update status",
      );
    }
  }

  load();
}

// =====================================================
// MESSAGES
// =====================================================

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
    container.querySelector("#msg-error");

  const listEl =
    container.querySelector("#msg-list");

  function showError(message) {
    errorEl.innerHTML = message
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
      /*
       * NOTE:
       * Your current api.js does not contain
       * "/contact" in API_TABLES.
       */
      const rows =
        await Api.get("/contact");

      if (!Array.isArray(rows) || !rows.length) {
        listEl.innerHTML = `
          <div class="empty-state">
            <p class="text-sm text-muted">
              No messages yet.
            </p>
          </div>
        `;

        return;
      }

      listEl.innerHTML = rows
        .map(
          (message) => `
            <div
              class="admin-panel-box"
              style="${
                message.read
                  ? ""
                  : "background:#eff6ff; border-color:#bfdbfe;"
              }"
            >

              <div
                class="flex justify-between items-start"
                style="gap:16px;"
              >

                <div>

                  <div
                    class="flex items-center gap-2 mb-1"
                  >
                    <h4 class="h3">
                      ${esc(
                        message.subject ||
                          "No subject",
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
                  class="flex flex-col gap-2"
                  style="
                    flex-shrink:0;
                    align-items:flex-end;
                  "
                >

                  <button
                    type="button"
                    class="btn btn-sm"
                    style="
                      background:#f1f5f9;
                      color:#475569;
                    "
                    data-toggle-read="${esc(
                      message.id,
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
                    type="button"
                    class="link-btn"
                    style="color:#94a3b8;"
                    data-delete="${esc(
                      message.id,
                    )}"
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>
          `,
        )
        .join("");

      // READ / UNREAD
      listEl
        .querySelectorAll(
          "[data-toggle-read]",
        )
        .forEach((btn) => {
          btn.addEventListener(
            "click",
            async () => {
              try {
                await Api.update(
                  "/contact",
                  btn.dataset.toggleRead,
                  {
                    read:
                      btn.dataset.read !==
                      "true",
                  },
                );

                await load();
              } catch (err) {
                showError(
                  err?.message ||
                    "Failed to update message",
                );
              }
            },
          );
        });

      // DELETE
      listEl
        .querySelectorAll("[data-delete]")
        .forEach((btn) => {
          btn.addEventListener(
            "click",
            async () => {
              if (
                !confirm(
                  "Delete this message?",
                )
              ) {
                return;
              }

              try {
                await Api.del(
                  "/contact",
                  btn.dataset.delete,
                );

                await load();
              } catch (err) {
                showError(
                  err?.message ||
                    "Delete failed",
                );
              }
            },
          );
        });
    } catch (err) {
      showError(
        err?.message ||
          "Failed to load messages",
      );
    }
  }

  load();
}

// =====================================================
// CTF CHALLENGES
// =====================================================

function renderChallengesPanel(container) {
  let rows = [];
  let showForm = false;
  let editingId = null;

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">

      <div
        class="text-sm text-muted"
        id="ch-count"
      >
        Loading…
      </div>

      <button
        type="button"
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
    container.querySelector("#ch-count");

  const toggleBtn =
    container.querySelector("#ch-toggle");

  const errorEl =
    container.querySelector("#ch-error");

  const formEl =
    container.querySelector("#ch-form");

  const tableEl =
    container.querySelector("#ch-table");

  function showError(message) {
    errorEl.innerHTML = message
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

  // ---------------------------------------------------
  // CTF FORM
  // ---------------------------------------------------

  function renderForm() {
    if (!showForm) {
      formEl.innerHTML = "";
      toggleBtn.textContent =
        "+ Add Challenge";
      return;
    }

    toggleBtn.textContent = "Cancel";

    const row = editingId
      ? rows.find(
          (item) =>
            String(item.id) ===
            String(editingId),
        )
      : null;

    formEl.innerHTML = `
      <form
        id="ch-entity-form"
        class="admin-panel-box"
      >

        <h3 class="h3 mb-3">
          ${editingId ? "Edit" : "New"}
          Challenge
        </h3>

        <div class="grid grid-2">

          <div class="field">
            <label>Title</label>

            <input
              data-f="title"
              value="${esc(
                row?.title || "",
              )}"
            />
          </div>

          <div class="field">
            <label>Category</label>

            <input
              data-f="category"
              value="${esc(
                row?.category || "",
              )}"
              placeholder="Crypto, Web, Forensics, Pwn…"
            />
          </div>

          <div
            class="field"
            style="grid-column:1/-1;"
          >
            <label>Description</label>

            <textarea
              data-f="description"
              rows="4"
            >${esc(
              row?.description || "",
            )}</textarea>
          </div>

          <div class="field">
            <label>Difficulty</label>

            <select data-f="difficulty">

              ${[
                "Easy",
                "Medium",
                "Hard",
                "Insane",
              ]
                .map(
                  (difficulty) => `
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
                  `,
                )
                .join("")}

            </select>
          </div>

          <div class="field">
            <label>Points</label>

            <input
              data-f="points"
              type="number"
              min="1"
              value="${row?.points ?? 50}"
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
              Stored hashed — never shown again after saving.
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
              Published (visible to visitors)
            </span>

          </div>

        </div>

        <div class="flex gap-2 mt-3">

          <button
            type="submit"
            class="btn btn-primary"
          >
            ${
              editingId
                ? "Save Changes"
                : "Create"
            }
          </button>

          <button
            type="button"
            id="ch-cancel"
            class="btn"
          >
            Cancel
          </button>

        </div>

      </form>
    `;

    formEl
      .querySelector("#ch-cancel")
      .addEventListener("click", () => {
        showForm = false;
        editingId = null;
        renderForm();
      });

    formEl
      .querySelector("#ch-entity-form")
      .addEventListener(
        "submit",
        async (e) => {
          e.preventDefault();

          const get = (key) =>
            formEl.querySelector(
              `[data-f="${key}"]`,
            );

          const title =
            get("title").value.trim();

          const category =
            get("category").value.trim();

          const description =
            get("description").value.trim();

          const difficulty =
            get("difficulty").value;

          const points =
            Number(get("points").value);

          const published =
            get("published").checked;

          const flag =
            get("flag").value.trim();

          if (!title) {
            return showError(
              "Challenge title is required.",
            );
          }

          if (
            !editingId &&
            !flag
          ) {
            return showError(
              "A flag is required when creating a new challenge.",
            );
          }

          const payload = {
            title,
            category,
            description,
            difficulty,
            points,
            published,
          };

          if (flag) {
            payload.flag = flag;
          }

          try {
            if (editingId) {
              await Api.update(
                "/ctf/challenges",
                editingId,
                payload,
              );
            } else {
              await Api.post(
                "/ctf/challenges",
                payload,
              );
            }

            showForm = false;
            editingId = null;

            showError(null);

            await load();
          } catch (err) {
            showError(
              err?.message ||
                "Failed to save challenge",
            );
          }
        },
      );
  }

  // ---------------------------------------------------
  // CTF TABLE
  // ---------------------------------------------------

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
              <th>Title</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Points</th>
              <th>Published</th>
              <th style="text-align:right;">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>

            ${rows
              .map(
                (row) => `
                  <tr>

                    <td>
                      ${esc(row.title)}
                    </td>

                    <td>
                      ${esc(row.category)}
                    </td>

                    <td>
                      ${esc(row.difficulty)}
                    </td>

                    <td>
                      ${Number(row.points) || 0}
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
                        type="button"
                        class="link-btn link-blue"
                        data-edit="${esc(
                          row.id,
                        )}"
                        style="margin-right:12px;"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        class="link-btn link-red"
                        data-delete="${esc(
                          row.id,
                        )}"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                `,
              )
              .join("")}

          </tbody>

        </table>

      </div>
    `;

    // EDIT
    tableEl
      .querySelectorAll("[data-edit]")
      .forEach((btn) => {
        btn.addEventListener(
          "click",
          () => {
            editingId =
              btn.dataset.edit;

            showForm = true;

            renderForm();

            formEl.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          },
        );
      });

    // DELETE
    tableEl
      .querySelectorAll("[data-delete]")
      .forEach((btn) => {
        btn.addEventListener(
          "click",
          async () => {
            if (
              !confirm(
                "Delete this challenge? Its solves and leaderboard points may also be removed.",
              )
            ) {
              return;
            }

            try {
              await Api.del(
                "/ctf/challenges",
                btn.dataset.delete,
              );

              await load();
            } catch (err) {
              showError(
                err?.message ||
                  "Failed to delete challenge",
              );
            }
          },
        );
      });
  }

  // ---------------------------------------------------
  // LOAD
  // ---------------------------------------------------

  async function load() {
    countEl.textContent =
      "Loading…";

    try {
      rows = await Api.get(
        "/ctf/challenges/admin/all",
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
    } catch (err) {
      rows = [];

      countEl.textContent =
        "0 challenges";

      renderTable();

      showError(
        err?.message ||
          "Failed to load challenges",
      );
    }
  }

  toggleBtn.addEventListener(
    "click",
    () => {
      showForm = !showForm;
      editingId = null;

      renderForm();
    },
  );

  load();
}

// =====================================================
// SETTINGS
// =====================================================

function renderSettingsPanel(container) {
  container.innerHTML = `
    <div
      class="admin-panel-box"
      style="max-width:520px;"
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
            minlength="6"
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
            minlength="6"
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
          Password updated successfully.
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
    container.querySelector(
      "#settings-form",
    );

  form.addEventListener(
    "submit",
    async (e) => {
      e.preventDefault();

      const errorEl =
        container.querySelector(
          "#settings-error",
        );

      const successEl =
        container.querySelector(
          "#settings-success",
        );

      const btn =
        container.querySelector(
          "#settings-submit",
        );

      errorEl.classList.add(
        "hidden",
      );

      successEl.classList.add(
        "hidden",
      );

      const currentPassword =
        container.querySelector(
          "#s-current",
        ).value;

      const newPassword =
        container.querySelector(
          "#s-new",
        ).value;

      const confirmPassword =
        container.querySelector(
          "#s-confirm",
        ).value;

      if (
        newPassword !==
        confirmPassword
      ) {
        errorEl.textContent =
          "New password and confirmation don't match.";

        errorEl.classList.remove(
          "hidden",
        );

        return;
      }

      if (newPassword.length < 6) {
        errorEl.textContent =
          "Password must contain at least 6 characters.";

        errorEl.classList.remove(
          "hidden",
        );

        return;
      }

      btn.disabled = true;
      btn.textContent =
        "Saving…";

      try {
        /*
         * Re-authenticate first using your existing
         * Supabase Auth login.
         */

        const user =
          await Api.getUser();

        if (!user?.email) {
          throw new Error(
            "Unable to determine current admin account.",
          );
        }

        await Api.login(
          user.email,
          currentPassword,
        );

        /*
         * Supabase client is already loaded by
         * supabase-client.js / supabase.js.
         */

        if (
          typeof supabaseClient ===
          "undefined"
        ) {
          throw new Error(
            "Supabase client is not available.",
          );
        }

        const {
          error,
        } =
          await supabaseClient.auth.updateUser(
            {
              password:
                newPassword,
            },
          );

        if (error) {
          throw error;
        }

        successEl.classList.remove(
          "hidden",
        );

        form.reset();
      } catch (err) {
        console.error(
          "Password update error:",
          err,
        );

        errorEl.textContent =
          err?.message ||
          "Failed to change password.";

        errorEl.classList.remove(
          "hidden",
        );
      } finally {
        btn.disabled = false;
        btn.textContent =
          "Update Password";
      }
    },
  );
}

// =====================================================
// INIT
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    try {
      // Initialize API if available
      if (
        typeof Api !== "undefined" &&
        typeof Api.init === "function"
      ) {
        await Api.init();
      }

      // IMPORTANT:
      // isAuthed() is async in your Api.js.
      // Therefore it MUST be awaited.
      const authenticated =
        typeof Api !== "undefined" &&
        typeof Api.isAuthed ===
          "function"
          ? await Api.isAuthed()
          : false;

      if (authenticated) {
        showAdminShell();
      } else {
        showLoginScreen();
      }

      setupLogin();
      setupLogout();
    } catch (err) {
      console.error(
        "DragonByte Admin initialization error:",
        err,
      );

      showLoginScreen();

      setupLogin();
      setupLogout();
    }
  },
);

// =====================================================
// EXPORTS
// =====================================================

window.DragonByteAdmin = {
  goToSection,
  renderSection,
  renderSidebar,
};

console.log(
  "DragonByte Admin loaded successfully.",
);