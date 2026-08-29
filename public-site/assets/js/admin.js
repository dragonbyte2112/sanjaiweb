/* =========================================================
   DragonByte Admin Dashboard
   ========================================================= */

"use strict";

/* =========================================================
   ADMIN SECTIONS
   ========================================================= */

const ADMIN_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "📊",
  },
  {
    id: "members",
    label: "Members",
    icon: "👥",
  },
  {
    id: "contributors",
    label: "Contributors",
    icon: "⭐",
  },
  {
    id: "events",
    label: "Events",
    icon: "📅",
  },
  {
    id: "projects",
    label: "Projects",
    icon: "🔧",
  },
  {
    id: "teams",
    label: "Teams",
    icon: "🛡️",
  },
  {
    id: "challenges",
    label: "CTF Challenges",
    icon: "🚩",
  },
  {
    id: "join-requests",
    label: "Join Requests",
    icon: "📨",
  },
  {
    id: "messages",
    label: "Messages",
    icon: "✉️",
  },
  {
    id: "testimonials",
    label: "Testimonials",
    icon: "💬",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "⚙️",
  },
];

let activeSection = "dashboard";

/* =========================================================
   HELPERS
   ========================================================= */

function getEl(id) {
  return document.getElementById(id);
}

function showErrorElement(element, message) {
  if (!element) return;

  if (!message) {
    element.innerHTML = "";
    return;
  }

  element.innerHTML = `
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
  `;
}

/* =========================================================
   AUTH SCREEN
   ========================================================= */

function showAdminShell() {
  const login =
    getEl("login-screen");

  const shell =
    getEl("admin-shell");

  if (login) {
    login.classList.add("hidden");
  }

  if (shell) {
    shell.classList.remove("hidden");
  }

  renderSidebar();
  goToSection("dashboard");
}

function showLoginScreen() {
  const login =
    getEl("login-screen");

  const shell =
    getEl("admin-shell");

  if (shell) {
    shell.classList.add("hidden");
  }

  if (login) {
    login.classList.remove("hidden");
  }
}

/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {
  const form =
    getEl("login-form");

  if (!form) return;

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const email =
        getEl("login-username")?.value
          ?.trim();

      const password =
        getEl("login-password")?.value;

      const button =
        getEl("login-submit");

      const error =
        getEl("login-error");

      if (error) {
        error.classList.add(
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
          email,
          password
        );

        showAdminShell();
      } catch (err) {
        if (error) {
          error.textContent =
            err?.message ||
            "Invalid credentials";

          error.classList.remove(
            "hidden"
          );
        }
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent =
            "Sign In";
        }
      }
    }
  );
}

/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {
  const button =
    getEl("logout-btn");

  if (!button) return;

  button.addEventListener(
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

/* =========================================================
   SIDEBAR
   ========================================================= */

function renderSidebar() {
  const nav =
    getEl("admin-nav");

  if (!nav) return;

  nav.innerHTML =
    ADMIN_SECTIONS.map(
      (section) => `
        <button
          class="
            admin-nav-item
            ${
              section.id ===
              activeSection
                ? "active"
                : ""
            }
          "
          data-section="${section.id}"
          type="button"
        >
          <span>
            ${section.icon}
          </span>

          ${section.label}
        </button>
      `
    ).join("");

  nav
    .querySelectorAll(
      "button[data-section]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          goToSection(
            button.dataset.section
          );
        }
      );
    });
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function goToSection(id) {
  const section =
    ADMIN_SECTIONS.find(
      (item) =>
        item.id === id
    );

  if (!section) {
    return;
  }

  activeSection = id;

  renderSidebar();

  const title =
    getEl("section-title");

  if (title) {
    title.textContent =
      section.label;
  }

  renderSection(id);
}

function renderSection(id) {
  const container =
    getEl("section-content");

  if (!container) return;

  container.innerHTML = "";

  switch (id) {
    case "dashboard":
      renderDashboard(
        container
      );
      break;

    case "members":
      renderEntityManager(
        container,
        entityConfigs.members
      );
      break;

    case "contributors":
      renderEntityManager(
        container,
        entityConfigs.contributors
      );
      break;

    case "events":
      renderEntityManager(
        container,
        entityConfigs.events
      );
      break;

    case "projects":
      renderEntityManager(
        container,
        entityConfigs.projects
      );
      break;

    case "teams":
      renderEntityManager(
        container,
        entityConfigs.teams
      );
      break;

    case "testimonials":
      renderEntityManager(
        container,
        entityConfigs.testimonials
      );
      break;

    case "challenges":
      renderChallengesPanel(
        container
      );
      break;

    case "join-requests":
      renderJoinRequestsPanel(
        container
      );
      break;

    case "messages":
      renderMessagesPanel(
        container
      );
      break;

    case "settings":
      renderSettingsPanel(
        container
      );
      break;

    default:
      container.innerHTML = `
        <div class="empty-state">
          Unknown section.
        </div>
      `;
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

const STAT_META = [
  {
    key: "members",
    label: "Members",
    icon: "👥",
  },
  {
    key: "events",
    label: "Events",
    icon: "📅",
  },
  {
    key: "projects",
    label: "Projects",
    icon: "🔧",
  },
  {
    key: "joinRequests",
    label: "Pending Join Requests",
    icon: "📨",
  },
  {
    key: "messages",
    label: "Unread Messages",
    icon: "✉️",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    icon: "💬",
  },
  {
    key: "challenges",
    label: "CTF Challenges",
    icon: "🚩",
  },
  {
    key: "ctfSolves",
    label: "Total CTF Solves",
    icon: "✅",
  },
];

async function renderDashboard(
  container
) {
  container.innerHTML = `
    <div
      class="grid grid-3"
      id="stat-grid"
    >
      ${STAT_META.map(
        (stat) => `
          <div class="stat-card">
            <div class="top">
              <span>
                ${stat.icon}
              </span>

              <span
                class="value"
                id="stat-${stat.key}"
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
              ${stat.label}
            </div>
          </div>
        `
      ).join("")}
    </div>
  `;

  try {
    const stats =
      await Api.get(
        "/admin/stats"
      );

    STAT_META.forEach(
      (stat) => {
        const element =
          getEl(
            `stat-${stat.key}`
          );

        if (element) {
          element.textContent =
            stats?.[stat.key] ??
            0;
        }
      }
    );
  } catch (error) {
    container.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="form-error mb-4">
          ${esc(
            error?.message ||
              "Failed to load dashboard"
          )}
        </div>
      `
    );
  }
}

/* =========================================================
   ENTITY CONFIGURATION
   ========================================================= */

const entityConfigs = {
  members: {
    title: "Member",

    apiBase: "/members",

    columns: [
      "name",
      "email",
      "username",
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
        type: "text",
      },
    ],
  },

  contributors: {
    title: "Contributor",

    apiBase:
      "/contributors",

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
      },
      {
        key: "coverPhoto",
        label: "Cover Photo URL",
        type: "text",
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
        label:
          "Featured on homepage",
        type: "checkbox",
      },
    ],
  },

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
        placeholder:
          "2026-12-01",
      },
      {
        key: "time",
        label: "Time",
        type: "text",
        placeholder:
          "10:00 AM",
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
      },
      {
        key: "coverPhoto",
        label:
          "Event Cover Photo URL",
        type: "text",
      },
      {
        key:
          "registrationUrl",
        label:
          "Registration URL",
        type: "text",
      },
      {
        key: "featured",
        label:
          "Featured on homepage",
        type: "checkbox",
      },
      {
        key: "published",
        label:
          "Published (visible to visitors)",
        type: "checkbox",
      },
    ],
  },

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
      },
      {
        key: "coverPhoto",
        label:
          "Project Cover Photo URL",
        type: "text",
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
        label:
          "Resource Link",
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
        label:
          "Featured on homepage",
        type: "checkbox",
      },
      {
        key: "published",
        label:
          "Published (visible to visitors)",
        type: "checkbox",
      },
    ],
  },

  teams: {
    title: "Team",

    apiBase: "/teams",

    columns: [
      "name",
      "category",
      "membersCount",
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
        key: "category",
        label: "Category",
        type: "text",
      },
      {
        key: "logoUrl",
        label: "Logo URL",
        type: "text",
      },
      {
        key: "githubUrl",
        label: "GitHub URL",
        type: "text",
      },
      {
        key: "websiteUrl",
        label: "Website URL",
        type: "text",
      },
      {
        key: "membersCount",
        label:
          "Members Count",
        type: "number",
      },
    ],
  },

  testimonials: {
    title: "Testimonial",

    apiBase:
      "/testimonials",

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
        label:
          "Approved (visible to visitors)",
        type: "checkbox",
      },
    ],
  },
};

/* =========================================================
   FIELD HTML
   ========================================================= */

function fieldInputHtml(
  field,
  value
) {
  const current =
    value ??
    (field.type ===
    "checkbox"
      ? false
      : "");

  if (
    field.type ===
    "checkbox"
  ) {
    return `
      <label
        class="field-check mt-2"
      >
        <input
          type="checkbox"
          data-field="${field.key}"
          ${
            current
              ? "checked"
              : ""
          }
        />

        <span class="text-sm">
          Yes
        </span>
      </label>
    `;
  }

  if (
    field.type ===
    "textarea"
  ) {
    return `
      <textarea
        data-field="${field.key}"
        rows="3"
        placeholder="${esc(
          field.placeholder ||
            ""
        )}"
      >${esc(current)}</textarea>
    `;
  }

  let displayValue =
    current;

  if (
    field.type ===
      "tags" &&
    Array.isArray(current)
  ) {
    displayValue =
      current.join(", ");
  }

  const type =
    field.type ===
    "number"
      ? "number"
      : "text";

  const placeholder =
    field.placeholder ||
    (field.type ===
    "tags"
      ? "comma, separated, values"
      : "");

  return `
    <input
      type="${type}"
      data-field="${field.key}"
      value="${esc(
        displayValue
      )}"
      placeholder="${esc(
        placeholder
      )}"
    />
  `;
}

/* =========================================================
   GENERIC ENTITY MANAGER
   ========================================================= */

function renderEntityManager(
  container,
  config
) {
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
        type="button"
      >
        + Add ${config.title}
      </button>
    </div>

    <div id="em-error"></div>

    <div id="em-form"></div>

    <div id="em-table"></div>
  `;

  const countEl =
    container.querySelector(
      "#em-count"
    );

  const toggleBtn =
    container.querySelector(
      "#em-toggle"
    );

  const errorEl =
    container.querySelector(
      "#em-error"
    );

  const formEl =
    container.querySelector(
      "#em-form"
    );

  const tableEl =
    container.querySelector(
      "#em-table"
    );

  function showError(
    message
  ) {
    showErrorElement(
      errorEl,
      message
    );
  }

  function renderForm() {
    if (!showForm) {
      formEl.innerHTML = "";

      toggleBtn.textContent =
        `+ Add ${config.title}`;

      return;
    }

    toggleBtn.textContent =
      "Cancel";

    const editingRow =
      editingId
        ? rows.find(
            (row) =>
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
          ${config.title}
        </h3>

        <div class="grid grid-2">
          ${config.fields
            .map(
              (field) => `
                <div
                  class="field"
                  style="${
                    field.type ===
                    "textarea"
                      ? "grid-column:1/-1;"
                      : ""
                  }"
                >
                  <label>
                    ${field.label}
                  </label>

                  ${fieldInputHtml(
                    field,
                    editingRow
                      ? editingRow[
                          field.key
                        ]
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

    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        const payload = {};

        config.fields.forEach(
          (field) => {
            const input =
              form.querySelector(
                `[data-field="${field.key}"]`
              );

            if (!input) return;

            if (
              field.type ===
              "checkbox"
            ) {
              payload[field.key] =
                input.checked;
            } else if (
              field.type ===
              "tags"
            ) {
              payload[field.key] =
                input.value
                  .split(",")
                  .map(
                    (item) =>
                      item.trim()
                  )
                  .filter(Boolean);
            } else if (
              field.type ===
              "number"
            ) {
              payload[field.key] =
                Number(
                  input.value || 0
                );
            } else {
              payload[field.key] =
                input.value.trim();
            }
          }
        );

        try {
          if (editingId) {
            await Api.put(
              `${config.apiBase}/${editingId}`,
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
            "Save error:",
            error
          );

          showError(
            error?.message ||
              "Unable to save item"
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
            No ${
              config.title.toLowerCase()
            }s yet.
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
                  (column) =>
                    `<th>${esc(
                      column
                    )}</th>`
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
                (row) => `
                  <tr>
                    ${config.columns
                      .map(
                        (column) => {
                          const value =
                            row[
                              column
                            ];

                          let display =
                            "";

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
                              esc(
                                value
                              );
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
                        class="link-btn link-blue"
                        data-edit="${esc(
                          row.id
                        )}"
                        type="button"
                        style="
                          margin-right:12px;
                        "
                      >
                        Edit
                      </button>

                      <button
                        class="link-btn link-red"
                        data-delete="${esc(
                          row.id
                        )}"
                        type="button"
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
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              editingId =
                button.dataset.edit;

              showForm = true;

              renderForm();

              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              });
            }
          );
        }
      );

    tableEl
      .querySelectorAll(
        "[data-delete]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            async () => {
              if (
                !confirm(
                  "Delete this item? This cannot be undone."
                )
              ) {
                return;
              }

              try {
                await Api.del(
                  `${config.apiBase}/${button.dataset.delete}`
                );

                await load();
              } catch (error) {
                console.error(
                  "Delete error:",
                  error
                );

                showError(
                  error?.message ||
                    "Unable to delete item"
                );
              }
            }
          );
        }
      );
  }

  async function load() {
    countEl.textContent =
      "Loading…";

    try {
      rows = await Api.get(
        `${config.apiBase}/admin/all`
      );

      countEl.textContent =
        `${rows.length} item${
          rows.length === 1
            ? ""
            : "s"
        }`;

      renderTable();
    } catch (error) {
      console.error(
        "Load error:",
        error
      );

      countEl.textContent =
        "Unable to load";

      showError(
        error?.message ||
          "Unable to load data"
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
   JOIN REQUESTS
   ========================================================= */

const JOIN_STATUS_BADGE = {
  pending:
    "badge-yellow",
  approved:
    "badge-green",
  rejected:
    "badge-red",
};

function renderJoinRequestsPanel(
  container
) {
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

  function showError(
    message
  ) {
    showErrorElement(
      errorEl,
      message
    );
  }

  async function load() {
    try {
      const rows =
        await Api.get(
          "/join"
        );

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
            (row) => `
              <div
                class="admin-panel-box"
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
                          row.name
                        )}
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
                        ${esc(
                          row.status
                        )}
                      </span>
                    </div>

                    <p
                      class="
                        text-sm
                        text-muted
                      "
                    >
                      ${esc(
                        row.email
                      )}
                      ·
                      @${esc(
                        row.username
                      )}
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
                            ${esc(
                              row.skills
                            )}
                          </p>
                        `
                        : ""
                    }

                    ${
                      row.message
                        ? `
                          <p
                            class="
                              text-sm
                              mt-2
                            "
                          >
                            ${esc(
                              row.message
                            )}
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
                            type="button"
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
                            type="button"
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
                      type="button"
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
        .forEach(
          (button) => {
            button.addEventListener(
              "click",
              () =>
                updateStatus(
                  button.dataset
                    .approve,
                  "approved"
                )
            );
          }
        );

      listEl
        .querySelectorAll(
          "[data-reject]"
        )
        .forEach(
          (button) => {
            button.addEventListener(
              "click",
              () =>
                updateStatus(
                  button.dataset
                    .reject,
                  "rejected"
                )
            );
          }
        );

      listEl
        .querySelectorAll(
          "[data-delete]"
        )
        .forEach(
          (button) => {
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
                    `/join/${button.dataset.delete}`
                  );

                  await load();
                } catch (error) {
                  showError(
                    error?.message
                  );
                }
              }
            );
          }
        );
    } catch (error) {
      console.error(
        "Join request load error:",
        error
      );

      showError(
        error?.message ||
          "Unable to load applications"
      );
    }
  }

  async function updateStatus(
    id,
    status
  ) {
    try {
      await Api.put(
        `/join/${id}`,
        {
          status,
        }
      );

      await load();
    } catch (error) {
      showError(
        error?.message ||
          "Unable to update application"
      );
    }
  }

  load();
}

/* =========================================================
   MESSAGES
   ========================================================= */

function renderMessagesPanel(
  container
) {
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

  function showError(
    message
  ) {
    showErrorElement(
      errorEl,
      message
    );
  }

  async function load() {
    try {
      const rows =
        await Api.get(
          "/contact"
        );

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
            (message) => `
              <div
                class="admin-panel-box"
                style="
                  ${
                    message.read
                      ? ""
                      : "background:#eff6ff; border-color:#bfdbfe;"
                  }
                "
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

                    <p
                      class="
                        text-sm
                        text-muted
                      "
                    >
                      ${esc(
                        message.name
                      )}
                      ·
                      ${esc(
                        message.email
                      )}
                    </p>

                    <p
                      class="
                        text-sm
                        mt-2
                      "
                    >
                      ${esc(
                        message.message
                      )}
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
                      type="button"
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
                      type="button"
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
        .forEach(
          (button) => {
            button.addEventListener(
              "click",
              async () => {
                try {
                  await Api.put(
                    `/contact/${button.dataset.toggleRead}`,
                    {
                      read:
                        button.dataset
                          .read !==
                        "true",
                    }
                  );

                  await load();
                } catch (error) {
                  showError(
                    error?.message
                  );
                }
              }
            );
          }
        );

      listEl
        .querySelectorAll(
          "[data-delete]"
        )
        .forEach(
          (button) => {
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
                    `/contact/${button.dataset.delete}`
                  );

                  await load();
                } catch (error) {
                  showError(
                    error?.message
                  );
                }
              }
            );
          }
        );
    } catch (error) {
      console.error(
        "Message load error:",
        error
      );

      showError(
        error?.message ||
          "Unable to load messages"
      );
    }
  }

  load();
}

/* =========================================================
   CTF CHALLENGES
   ========================================================= */

function renderChallengesPanel(
  container
) {
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
        type="button"
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

  function showError(
    message
  ) {
    showErrorElement(
      errorEl,
      message
    );
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

    const row = editingId
      ? rows.find(
          (item) =>
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
                row?.title ||
                  ""
              )}"
              required
            />
          </div>

          <div class="field">
            <label>
              Category
            </label>

            <input
              data-f="category"
              value="${esc(
                row?.category ||
                  ""
              )}"
              placeholder="Crypto, Web, Forensics, Pwn…"
            />
          </div>

          <div
            class="field"
            style="
              grid-column:1/-1;
            "
          >
            <label>
              Description
            </label>

            <textarea
              data-f="description"
              rows="4"
            >${esc(
              row?.description ||
                ""
            )}</textarea>
          </div>

          <div class="field">
            <label>
              Difficulty
            </label>

            <select
              data-f="difficulty"
            >
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
              min="1"
              value="${
                row?.points ??
                50
              }"
              required
            />
          </div>

          <div
            class="field"
            style="
              grid-column:1/-1;
            "
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
              ${
                editingId
                  ? ""
                  : "required"
              }
            />

            <p
              class="
                text-xs
                text-muted
                mt-1
              "
            >
              Stored hashed and never shown again.
            </p>
          </div>

          <div
            class="field-check mt-2"
          >
            <input
              type="checkbox"
              data-f="published"
              ${
                row?.published !==
                false
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
        async (event) => {
          event.preventDefault();

          const get =
            (key) =>
              formEl.querySelector(
                `[data-f="${key}"]`
              );

          const payload = {
            title:
              get("title")
                .value
                .trim(),

            category:
              get("category")
                .value
                .trim(),

            description:
              get("description")
                .value
                .trim(),

            difficulty:
              get("difficulty")
                .value,

            points:
              Number(
                get("points")
                  .value
              ),

            published:
              get("published")
                .checked,
          };

          const flag =
            get("flag")
              .value
              .trim();

          if (flag) {
            payload.flag =
              flag;
          }

          try {
            if (editingId) {
              await Api.put(
                `/ctf/challenges/${editingId}`,
                payload
              );
            } else {
              if (!flag) {
                showError(
                  "A flag is required when creating a challenge."
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
              error?.message ||
                "Unable to save challenge"
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
              <th>Title</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Points</th>
              <th>Published</th>
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
                (row) => `
                  <tr>
                    <td>
                      ${esc(
                        row.title
                      )}
                    </td>

                    <td>
                      ${esc(
                        row.category
                      )}
                    </td>

                    <td>
                      ${esc(
                        row.difficulty
                      )}
                    </td>

                    <td>
                      ${Number(
                        row.points ||
                          0
                      )}
                    </td>

                    <td>
                      ${
                        row.published !==
                        false
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
                        class="link-btn link-blue"
                        data-edit="${esc(
                          row.id
                        )}"
                        type="button"
                        style="
                          margin-right:12px;
                        "
                      >
                        Edit
                      </button>

                      <button
                        class="link-btn link-red"
                        data-delete="${esc(
                          row.id
                        )}"
                        type="button"
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
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            () => {
              editingId =
                button.dataset.edit;

              showForm = true;

              renderForm();
            }
          );
        }
      );

    tableEl
      .querySelectorAll(
        "[data-delete]"
      )
      .forEach(
        (button) => {
          button.addEventListener(
            "click",
            async () => {
              if (
                !confirm(
                  "Delete this challenge? Its solves and leaderboard points will also be removed."
                )
              ) {
                return;
              }

              try {
                await Api.del(
                  `/ctf/challenges/${button.dataset.delete}`
                );

                await load();
              } catch (error) {
                showError(
                  error?.message
                );
              }
            }
          );
        }
      );
  }

  async function load() {
    countEl.textContent =
      "Loading…";

    try {
      rows =
        await Api.get(
          "/ctf/challenges/admin/all"
        );

      countEl.textContent =
        `${rows.length} challenge${
          rows.length === 1
            ? ""
            : "s"
        }`;

      renderTable();
    } catch (error) {
      showError(
        error?.message ||
          "Unable to load challenges"
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

function renderSettingsPanel(
  container
) {
  container.innerHTML = `
    <div
      class="admin-panel-box"
      style="
        max-width:420px;
      "
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
      "#settings-form"
    );

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const error =
        container.querySelector(
          "#settings-error"
        );

      const success =
        container.querySelector(
          "#settings-success"
        );

      const button =
        container.querySelector(
          "#settings-submit"
        );

      error.classList.add(
        "hidden"
      );

      success.classList.add(
        "hidden"
      );

      const currentPassword =
        container.querySelector(
          "#s-current"
        ).value;

      const newPassword =
        container.querySelector(
          "#s-new"
        ).value;

      const confirmPassword =
        container.querySelector(
          "#s-confirm"
        ).value;

      if (
        newPassword !==
        confirmPassword
      ) {
        error.textContent =
          "New password and confirmation do not match.";

        error.classList.remove(
          "hidden"
        );

        return;
      }

      if (
        newPassword.length <
        6
      ) {
        error.textContent =
          "New password must be at least 6 characters.";

        error.classList.remove(
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
            newPassword,
          }
        );

        success.classList.remove(
          "hidden"
        );

        form.reset();
      } catch (errorObject) {
        error.textContent =
          errorObject?.message ||
          "Failed to change password.";

        error.classList.remove(
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
   INIT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    try {
      setupLogin();
      setupLogout();

      if (
        typeof Api.init ===
        "function"
      ) {
        await Api.init();
      }

      if (Api.isAuthed()) {
        console.log(
          "DragonByte Admin API initialized: Authenticated"
        );

        showAdminShell();
      } else {
        console.log(
          "DragonByte Admin: Not authenticated"
        );

        showLoginScreen();
      }
    } catch (error) {
      console.error(
        "DragonByte Admin initialization failed:",
        error
      );

      showLoginScreen();
    }
  }
);