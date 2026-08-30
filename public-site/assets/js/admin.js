/* =========================================================
   DragonByte Admin Panel
   ========================================================= */

"use strict";

/* =========================================================
   SUPABASE STORAGE
   ========================================================= */

const MEDIA_BUCKET = "dragonbyte-media";

/*
  Use the same Supabase client created by api.js.
*/
function getSupabaseClient() {

  if (window.supabaseClient) {
    return window.supabaseClient;
  }

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    throw new Error(
      "Supabase library is not loaded."
    );
  }

  const SUPABASE_URL =
    "https://lfwwslohugqojibcpkys.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_4OBUm9wgJwRAqN9hi8QLOw_5WYgQcUG";

  window.supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

  return window.supabaseClient;
}


/* =========================================================
   HELPERS
   ========================================================= */

function esc(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function safeArray(value) {

  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}


function valueForField(record, key) {

  if (!record) {
    return "";
  }

  const value = record[key];

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value ?? "";
}


/* =========================================================
   ADMIN SECTIONS
   ========================================================= */

const ADMIN_SECTIONS = [

  {
    id: "dashboard",
    label: "Dashboard",
    icon: "📊"
  },

  {
    id: "members",
    label: "Members",
    icon: "👥"
  },

  {
    id: "contributors",
    label: "Contributors",
    icon: "⭐"
  },

  {
    id: "events",
    label: "Events",
    icon: "📅"
  },

  {
    id: "projects",
    label: "Projects",
    icon: "🔧"
  },

  {
    id: "teams",
    label: "Teams",
    icon: "🛡️"
  },

  {
    id: "challenges",
    label: "CTF Challenges",
    icon: "🚩"
  },

  {
    id: "join-requests",
    label: "Join Requests",
    icon: "📨"
  },

  {
    id: "messages",
    label: "Messages",
    icon: "✉️"
  },

  {
    id: "testimonials",
    label: "Testimonials",
    icon: "💬"
  },

  {
    id: "settings",
    label: "Settings",
    icon: "⚙️"
  }

];


let activeSection = "dashboard";


/* =========================================================
   AUTH
   ========================================================= */

function showAdminShell() {

  document
    .getElementById("login-screen")
    .classList
    .add("hidden");

  document
    .getElementById("admin-shell")
    .classList
    .remove("hidden");

  renderSidebar();

  goToSection("dashboard");
}


function showLoginScreen() {

  document
    .getElementById("admin-shell")
    .classList
    .add("hidden");

  document
    .getElementById("login-screen")
    .classList
    .remove("hidden");
}


/* =========================================================
   LOGIN
   ========================================================= */

document
  .getElementById("login-form")
  .addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const button =
        document.getElementById("login-submit");

      const errorElement =
        document.getElementById("login-error");

      errorElement.classList.add("hidden");

      button.disabled = true;
      button.textContent = "Signing in…";

      try {

        const email =
          document
            .getElementById("login-username")
            .value
            .trim();

        const password =
          document
            .getElementById("login-password")
            .value;

        await Api.login(
          email,
          password
        );

        showAdminShell();

      } catch (error) {

        errorElement.textContent =
          error?.message ||
          "Invalid credentials.";

        errorElement.classList.remove("hidden");

      } finally {

        button.disabled = false;
        button.textContent = "Sign In";

      }

    }
  );


/* =========================================================
   LOGOUT
   ========================================================= */

document
  .getElementById("logout-btn")
  .addEventListener(
    "click",
    async function () {

      try {

        await Api.logout();

      } catch (error) {

        console.error(error);

      } finally {

        showLoginScreen();

      }

    }
  );


/* =========================================================
   SIDEBAR
   ========================================================= */

function renderSidebar() {

  const navigation =
    document.getElementById("admin-nav");

  navigation.innerHTML =
    ADMIN_SECTIONS
      .map(section => {

        return `
          <button
            class="admin-nav-item ${
              section.id === activeSection
                ? "active"
                : ""
            }"
            data-section="${esc(section.id)}"
          >
            <span>${section.icon}</span>
            <span>${esc(section.label)}</span>
          </button>
        `;

      })
      .join("");


  navigation
    .querySelectorAll("button")
    .forEach(button => {

      button.addEventListener(
        "click",
        function () {

          goToSection(
            button.dataset.section
          );

        }
      );

    });

}


function goToSection(id) {

  activeSection = id;

  renderSidebar();

  const section =
    ADMIN_SECTIONS.find(
      item => item.id === id
    );

  document
    .getElementById("section-title")
    .textContent =
      section
        ? section.label
        : "Admin";

  renderSection(id);

}


function renderSection(id) {

  const element =
    document.getElementById(
      "section-content"
    );

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


async function renderDashboard(element) {

  element.innerHTML = `

    <div class="grid grid-3">

      ${STAT_META
        .map(stat => {

          return `
            <div class="stat-card">

              <div class="top">

                <span>
                  ${stat.icon}
                </span>

                <span
                  class="value"
                  id="stat-${esc(stat.key)}"
                >
                  …
                </span>

              </div>

              <div class="text-sm">
                ${esc(stat.label)}
              </div>

            </div>
          `;

        })
        .join("")}

    </div>
  `;


  try {

    const stats =
      await Api.get(
        "/admin/stats"
      );


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

    element.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="form-error mb-4">
          ${esc(
            error?.message ||
            "Unable to load dashboard."
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

  /* -------------------------------------------------------
     MEMBERS
     ------------------------------------------------------- */

  members: {

    title: "Member",

    apiBase: "/members",

    columns: [
      "name",
      "email",
      "username",
      "linkedin"
    ],

    fields: [

      {
        key: "name",
        label: "Full Name",
        type: "text",
        required: true
      },

      {
        key: "email",
        label: "Email",
        type: "email"
      },

      {
        key: "username",
        label: "Username",
        type: "text"
      },

      {
        key: "skills",
        label: "Skills",
        type: "text",
        placeholder: "Web Security, OSINT, CTF"
      },

      {
        key: "linkedin",
        label: "LinkedIn URL",
        type: "url",
        placeholder: "https://linkedin.com/in/username"
      },

      {
        key: "github",
        label: "GitHub URL",
        type: "url",
        placeholder: "https://github.com/username"
      },

      {
        key: "photo",
        label: "Profile Photo",
        type: "file",
        uploadType: "profile"
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
      "github",
      "linkedin",
      "featured"
    ],

    fields: [

      {
        key: "name",
        label: "Full Name",
        type: "text",
        required: true
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
        type: "file",
        uploadType: "profile"
      },

      {
        key: "skills",
        label: "Skills",
        type: "tags",
        placeholder: "Web Security, Forensics, OSINT"
      },

      {
        key: "github",
        label: "GitHub URL",
        type: "url",
        placeholder: "https://github.com/username"
      },

      {
        key: "linkedin",
        label: "LinkedIn URL",
        type: "url",
        placeholder: "https://linkedin.com/in/username"
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
        type: "text",
        required: true
      },

      {
        key: "description",
        label: "Description",
        type: "textarea"
      },

      {
        key: "date",
        label: "Date",
        type: "date"
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
        label: "Event Photo",
        type: "file",
        uploadType: "event"
      },

      {
        key: "coverPhoto",
        label: "Event Cover Photo",
        type: "file",
        uploadType: "cover"
      },

      {
        key: "registrationUrl",
        label: "Registration URL",
        type: "url"
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
        label: "Project Name",
        type: "text",
        required: true
      },

      {
        key: "description",
        label: "Description",
        type: "textarea"
      },

      {
        key: "image",
        label: "Project Photo",
        type: "file",
        uploadType: "project"
      },

      {
        key: "coverPhoto",
        label: "Project Cover Photo",
        type: "file",
        uploadType: "cover"
      },

      {
        key: "githubUrl",
        label: "GitHub URL",
        type: "url"
      },

      {
        key: "demoUrl",
        label: "Demo URL",
        type: "url"
      },

      {
        key: "resourceUrl",
        label: "Resource URL",
        type: "url"
      },

      {
        key: "technologies",
        label: "Technologies",
        type: "tags",
        placeholder: "HTML, JavaScript, Supabase"
      },

      {
        key: "contributors",
        label: "Contributors",
        type: "tags",
        placeholder: "Sanjai, Aravind"
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
        label: "Team Name",
        type: "text",
        required: true
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
        type: "url"
      },

      {
        key: "githubUrl",
        label: "GitHub URL",
        type: "url"
      },

      {
        key: "websiteUrl",
        label: "Website URL",
        type: "url"
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
        type: "textarea",
        required: true
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
        label: "Photo",
        type: "file",
        uploadType: "profile"
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
   IMAGE UPLOAD
   ========================================================= */

async function uploadImage(
  file,
  folder
) {

  if (!file) {
    return null;
  }


  if (!file.type.startsWith("image/")) {

    throw new Error(
      "Please select an image file."
    );

  }


  const maxSize =
    8 * 1024 * 1024;

  if (file.size > maxSize) {

    throw new Error(
      "Image must be smaller than 8MB."
    );

  }


  const supabase =
    getSupabaseClient();


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const randomPart =
    Math.random()
      .toString(36)
      .slice(2);


  const timestamp =
    Date.now();


  const fileName =
    `${timestamp}-${randomPart}.${extension}`;


  const path =
    `${folder}/${fileName}`;


  const {
    error
  } =
    await supabase
      .storage
      .from(MEDIA_BUCKET)
      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        }
      );


  if (error) {

    throw new Error(
      `Image upload failed: ${error.message}`
    );

  }


  const {
    data
  } =
    supabase
      .storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(path);


  if (!data?.publicUrl) {

    throw new Error(
      "Image uploaded but public URL could not be generated."
    );

  }


  return data.publicUrl;

}


/* =========================================================
   FIELD HTML
   ========================================================= */

function fieldInputHtml(
  field,
  value,
  record = null
) {

  const currentValue =
    valueForField(
      record || {},
      field.key
    );


  /* -------------------------------------------------------
     CHECKBOX
     ------------------------------------------------------- */

  if (field.type === "checkbox") {

    return `
      <label class="field-check">

        <input
          type="checkbox"
          data-field="${esc(field.key)}"
          ${record?.[field.key] ? "checked" : ""}
        >

        <span>
          Yes
        </span>

      </label>
    `;

  }


  /* -------------------------------------------------------
     FILE
     ------------------------------------------------------- */

  if (field.type === "file") {

    const previewClass =
      field.uploadType === "profile"
        ? "image-preview profile-preview"
        : "image-preview";


    return `
      <div class="upload-box">

        <input
          type="file"
          data-file-field="${esc(field.key)}"
          accept="image/*"
        >

        <div class="upload-help">
          ${field.uploadType === "profile"
            ? "Upload profile photo. JPG, PNG, WEBP."
            : "Upload image. JPG, PNG, WEBP. Maximum 8MB."
          }
        </div>

        ${
          currentValue
            ? `
              <img
                class="${previewClass}"
                data-preview-for="${esc(field.key)}"
                src="${esc(currentValue)}"
                alt="Current image"
              >
            `
            : `
              <img
                class="${previewClass} hidden"
                data-preview-for="${esc(field.key)}"
                alt="Preview"
              >
            `
        }

        <div
          class="upload-progress"
          data-upload-status="${esc(field.key)}"
        ></div>

      </div>
    `;

  }


  /* -------------------------------------------------------
     TEXTAREA
     ------------------------------------------------------- */

  if (field.type === "textarea") {

    return `
      <textarea
        data-field="${esc(field.key)}"
        placeholder="${esc(field.placeholder || "")}"
      >${esc(currentValue)}</textarea>
    `;

  }


  /* -------------------------------------------------------
     URL / EMAIL / DATE / NUMBER
     ------------------------------------------------------- */

  let inputType = "text";

  if (
    field.type === "url" ||
    field.type === "email" ||
    field.type === "date" ||
    field.type === "number"
  ) {
    inputType = field.type;
  }


  return `
    <input
      type="${inputType}"
      data-field="${esc(field.key)}"
      value="${esc(currentValue)}"
      placeholder="${esc(
        field.placeholder ||
        ""
      )}"
      ${field.required ? "required" : ""}
    >
  `;

}


/* =========================================================
   ENTITY MANAGER
   ========================================================= */

async function renderEntityManager(
  container,
  config
) {

  let rows = [];

  let editingId = null;

  let showForm = false;


  async function loadRows() {

    container.innerHTML = `
      <div class="empty-state">
        Loading ${esc(config.title)}s…
      </div>
    `;


    try {

      rows =
        await Api.get(
          `${config.apiBase}/admin/all`
        );


      if (!Array.isArray(rows)) {
        rows = [];
      }

    } catch (error) {

      container.innerHTML = `
        <div class="form-error">
          ${esc(
            error?.message ||
            `Failed to load ${config.title}s.`
          )}
        </div>
      `;

      return;

    }


    render();

  }


  function render() {

    container.innerHTML = "";


    /* =====================================================
       HEADER
       ===================================================== */

    container.insertAdjacentHTML(
      "beforeend",
      `
        <div class="entity-header">

          <div>
            <h3>
              ${esc(config.title)}s
            </h3>
          </div>

          <button
            class="btn btn-primary"
            id="add-entity-btn"
          >
            + Add ${esc(config.title)}
          </button>

        </div>
      `
    );


    /* =====================================================
       FORM
       ===================================================== */

    if (showForm) {

      const editingRecord =
        editingId
          ? rows.find(
              row =>
                String(row.id) ===
                String(editingId)
            )
          : null;


      const form =
        document.createElement("div");

      form.className =
        "entity-form-card";


      form.innerHTML = `

        <h3>
          ${
            editingRecord
              ? `Edit ${esc(config.title)}`
              : `Add ${esc(config.title)}`
          }
        </h3>

        <div
          id="entity-form-error"
          class="form-error hidden mb-4"
        ></div>

        <div
          id="entity-form-success"
          class="form-success hidden mb-4"
        ></div>

        <div class="form-grid">

          ${config.fields
            .map(field => {

              const value =
                editingRecord
                  ? editingRecord[field.key]
                  : "";


              const full =
                field.type === "textarea" ||
                field.type === "file";


              return `

                <div
                  class="form-field ${
                    full ? "full" : ""
                  }"
                >

                  <label>
                    ${esc(field.label)}
                    ${
                      field.required
                        ? " *"
                        : ""
                    }
                  </label>

                  ${fieldInputHtml(
                    field,
                    value,
                    editingRecord
                  )}

                </div>

              `;

            })
            .join("")}

        </div>

        <div class="form-actions">

          <button
            class="btn btn-primary"
            id="save-entity-btn"
          >
            ${
              editingRecord
                ? "Update"
                : "Create"
            }
          </button>

          <button
            class="btn btn-secondary"
            id="cancel-entity-btn"
          >
            Cancel
          </button>

        </div>

      `;


      container.appendChild(form);


      /* FILE PREVIEW */

      form
        .querySelectorAll(
          'input[type="file"]'
        )
        .forEach(fileInput => {

          fileInput.addEventListener(
            "change",
            function () {

              const key =
                fileInput.dataset.fileField;

              const file =
                fileInput.files?.[0];

              const preview =
                form.querySelector(
                  `[data-preview-for="${key}"]`
                );

              if (!file || !preview) {
                return;
              }


              const reader =
                new FileReader();


              reader.onload =
                function (event) {

                  preview.src =
                    event.target.result;

                  preview.classList.remove(
                    "hidden"
                  );

                };


              reader.readAsDataURL(file);

            }
          );

        });


      /* CANCEL */

      document
        .getElementById(
          "cancel-entity-btn"
        )
        .addEventListener(
          "click",
          function () {

            editingId = null;

            showForm = false;

            render();

          }
        );


      /* SAVE */

      document
        .getElementById(
          "save-entity-btn"
        )
        .addEventListener(
          "click",
          async function () {

            await saveEntity(
              form,
              config,
              editingRecord
            );

          }
        );

    }


    /* =====================================================
       ADD BUTTON
       ===================================================== */

    document
      .getElementById(
        "add-entity-btn"
      )
      .addEventListener(
        "click",
        function () {

          editingId = null;

          showForm = true;

          render();

        }
      );


    /* =====================================================
       TABLE
       ===================================================== */

    const tableWrapper =
      document.createElement("div");

    tableWrapper.className =
      "entity-table-wrap";


    if (!rows.length) {

      tableWrapper.innerHTML = `
        <div class="empty-state">
          No ${esc(config.title.toLowerCase())}s found.
        </div>
      `;

      container.appendChild(
        tableWrapper
      );

      return;

    }


    const table =
      document.createElement("table");

    table.className =
      "entity-table";


    table.innerHTML = `

      <thead>

        <tr>

          ${config.columns
            .map(column => {

              return `
                <th>
                  ${esc(
                    column
                      .replace(
                        /([A-Z])/g,
                        " $1"
                      )
                      .replace(/^./, c =>
                        c.toUpperCase()
                      )
                  )}
                </th>
              `;

            })
            .join("")}

          <th>
            Actions
          </th>

        </tr>

      </thead>

      <tbody>

        ${rows
          .map(row => {

            return `

              <tr>

                ${config.columns
                  .map(column => {

                    let value =
                      row[column];


                    if (
                      column === "featured" ||
                      column === "published" ||
                      column === "approved"
                    ) {

                      value =
                        value
                          ? "Yes"
                          : "No";

                    }


                    if (
                      Array.isArray(value)
                    ) {

                      value =
                        value.join(", ");

                    }


                    return `
                      <td>
                        ${esc(
                          value ?? ""
                        )}
                      </td>
                    `;

                  })
                  .join("")}

                <td>

                  <div class="entity-actions">

                    <button
                      class="edit-btn"
                      data-edit-id="${esc(
                        row.id
                      )}"
                    >
                      Edit
                    </button>

                    <button
                      class="delete-btn"
                      data-delete-id="${esc(
                        row.id
                      )}"
                    >
                      Delete
                    </button>

                  </div>

                </td>

              </tr>

            `;

          })
          .join("")}

      </tbody>

    `;


    tableWrapper.appendChild(
      table
    );

    container.appendChild(
      tableWrapper
    );


    /* =====================================================
       EDIT BUTTONS
       ===================================================== */

    table
      .querySelectorAll(
        "[data-edit-id]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          function () {

            editingId =
              button.dataset.editId;

            showForm = true;

            render();

            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });

          }
        );

      });


    /* =====================================================
       DELETE BUTTONS
       ===================================================== */

    table
      .querySelectorAll(
        "[data-delete-id]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async function () {

            const id =
              button.dataset.deleteId;


            const confirmed =
              window.confirm(
                `Delete this ${config.title.toLowerCase()}?`
              );


            if (!confirmed) {
              return;
            }


            button.disabled = true;

            button.textContent =
              "Deleting…";


            try {

              await Api.del(
                `${config.apiBase}/${encodeURIComponent(id)}`
              );


              await loadRows();

            } catch (error) {

              alert(
                error?.message ||
                "Delete failed."
              );

              button.disabled = false;

              button.textContent =
                "Delete";

            }

          }
        );

      });

  }


  await loadRows();

}


/* =========================================================
   SAVE ENTITY
   ========================================================= */

async function saveEntity(
  form,
  config,
  editingRecord
) {

  const errorBox =
    form.querySelector(
      "#entity-form-error"
    );

  const successBox =
    form.querySelector(
      "#entity-form-success"
    );

  const saveButton =
    form.querySelector(
      "#save-entity-btn"
    );


  errorBox.classList.add(
    "hidden"
  );

  successBox.classList.add(
    "hidden"
  );


  saveButton.disabled = true;

  saveButton.textContent =
    editingRecord
      ? "Updating…"
      : "Creating…";


  try {

    /*
      IMPORTANT:
      Never send id during CREATE.
      This prevents:
      column "id" is an identity column
    */

    const payload = {};


    /* =====================================================
       NORMAL FIELDS
       ===================================================== */

    config.fields.forEach(field => {

      if (field.type === "file") {
        return;
      }


      const element =
        form.querySelector(
          `[data-field="${field.key}"]`
        );


      if (!element) {
        return;
      }


      if (field.type === "checkbox") {

        payload[field.key] =
          element.checked;

        return;

      }


      let value =
        element.value.trim();


      if (field.type === "tags") {

        payload[field.key] =
          value
            ? value
                .split(",")
                .map(v => v.trim())
                .filter(Boolean)
            : [];

      } else if (
        field.type === "number"
      ) {

        payload[field.key] =
          value === ""
            ? 0
            : Number(value);

      } else {

        payload[field.key] =
          value;

      }

    });


    /* =====================================================
       FILE UPLOADS
       ===================================================== */

    for (
      const field
      of config.fields
    ) {

      if (field.type !== "file") {
        continue;
      }


      const input =
        form.querySelector(
          `[data-file-field="${field.key}"]`
        );


      if (
        !input ||
        !input.files ||
        !input.files[0]
      ) {

        /*
          If editing and no new file was
          selected, keep existing image.
        */

        if (
          editingRecord &&
          editingRecord[field.key]
        ) {

          payload[field.key] =
            editingRecord[field.key];

        }

        continue;

      }


      const status =
        form.querySelector(
          `[data-upload-status="${field.key}"]`
        );


      if (status) {

        status.textContent =
          "Uploading image…";

      }


      let folder =
        config.apiBase
          .replace("/", "");


      if (
        field.uploadType === "profile"
      ) {

        folder += "/profiles";

      } else if (
        field.uploadType === "cover"
      ) {

        folder += "/covers";

      } else {

        folder += "/images";

      }


      const uploadedUrl =
        await uploadImage(
          input.files[0],
          folder
        );


      payload[field.key] =
        uploadedUrl;


      if (status) {

        status.textContent =
          "Image uploaded ✓";

      }

    }


    /*
      NEVER add:
      payload.id = ...
    */


    /* =====================================================
       UPDATE
       ===================================================== */

    if (editingRecord) {

      await Api.put(
        `${config.apiBase}/${encodeURIComponent(
          editingRecord.id
        )}`,
        payload
      );


      successBox.textContent =
        `${config.title} updated successfully.`;

    }


    /* =====================================================
       CREATE
       ===================================================== */

    else {

      await Api.post(
        config.apiBase,
        payload
      );


      successBox.textContent =
        `${config.title} created successfully.`;

    }


    successBox.classList.remove(
      "hidden"
    );


    /*
      Reload current section.
    */

    setTimeout(
      function () {

        goToSection(
          activeSection
        );

      },
      500
    );


  } catch (error) {

    console.error(
      "Save entity error:",
      error
    );


    errorBox.textContent =
      error?.message ||
      "Something went wrong while saving.";


    errorBox.classList.remove(
      "hidden"
    );


    saveButton.disabled = false;

    saveButton.textContent =
      editingRecord
        ? "Update"
        : "Create";

  }

}


/* =========================================================
   CHALLENGES
   ========================================================= */

async function renderChallengesPanel(
  element
) {

  element.innerHTML = `

    <div class="entity-form-card">

      <h3>
        CTF Challenges
      </h3>

      <p>
        Use the existing CTF management system.
      </p>

      <button
        class="btn btn-primary"
        id="load-challenges-btn"
      >
        Load Challenges
      </button>

    </div>

    <div id="challenges-list"></div>

  `;


  document
    .getElementById(
      "load-challenges-btn"
    )
    .addEventListener(
      "click",
      async function () {

        const list =
          document.getElementById(
            "challenges-list"
          );

        list.innerHTML =
          `<div class="empty-state">
            Loading…
          </div>`;


        try {

          const data =
            await Api.get(
              "/challenges/admin/all"
            );


          if (!Array.isArray(data)) {

            list.innerHTML =
              `<div class="empty-state">
                No challenges found.
              </div>`;

            return;

          }


          list.innerHTML = `

            <div class="entity-table-wrap">

              <table class="entity-table">

                <thead>

                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Difficulty</th>
                    <th>Points</th>
                  </tr>

                </thead>

                <tbody>

                  ${data
                    .map(challenge => {

                      return `
                        <tr>

                          <td>
                            ${esc(
                              challenge.title
                            )}
                          </td>

                          <td>
                            ${esc(
                              challenge.category
                            )}
                          </td>

                          <td>
                            ${esc(
                              challenge.difficulty
                            )}
                          </td>

                          <td>
                            ${esc(
                              challenge.points
                            )}
                          </td>

                        </tr>
                      `;

                    })
                    .join("")}

                </tbody>

              </table>

            </div>

          `;

        } catch (error) {

          list.innerHTML = `
            <div class="form-error">
              ${esc(
                error?.message ||
                "Failed to load challenges."
              )}
            </div>
          `;

        }

      }
    );

}


/* =========================================================
   JOIN REQUESTS
   ========================================================= */

async function renderJoinRequestsPanel(
  element
) {

  element.innerHTML = `
    <div class="entity-form-card">
      <h3>Join Requests</h3>
      <p>
        Review community membership applications.
      </p>
    </div>

    <div id="join-requests-list">
      <div class="empty-state">
        Loading…
      </div>
    </div>
  `;


  const list =
    document.getElementById(
      "join-requests-list"
    );


  try {

    const requests =
      await Api.get(
        "/join-requests/admin/all"
      );


    if (
      !Array.isArray(requests) ||
      requests.length === 0
    ) {

      list.innerHTML = `
        <div class="empty-state">
          No join requests found.
        </div>
      `;

      return;

    }


    list.innerHTML = `

      <div class="entity-table-wrap">

        <table class="entity-table">

          <thead>

            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            ${requests
              .map(request => {

                return `

                  <tr>

                    <td>
                      ${esc(
                        request.name
                      )}
                    </td>

                    <td>
                      ${esc(
                        request.email
                      )}
                    </td>

                    <td>
                      ${esc(
                        request.status
                      )}
                    </td>

                    <td>

                      ${
                        request.status ===
                        "pending"
                          ? `
                            <div class="entity-actions">

                              <button
                                class="btn btn-success"
                                data-approve-request="${esc(
                                  request.id
                                )}"
                              >
                                Approve
                              </button>

                              <button
                                class="btn btn-danger"
                                data-reject-request="${esc(
                                  request.id
                                )}"
                              >
                                Reject
                              </button>

                            </div>
                          `
                          : "-"
                      }

                    </td>

                  </tr>

                `;

              })
              .join("")}

          </tbody>

        </table>

      </div>

    `;


    list
      .querySelectorAll(
        "[data-approve-request]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async function () {

            const id =
              button.dataset
                .approveRequest;


            try {

              await Api.put(
                `/join-requests/${encodeURIComponent(id)}`,
                {
                  status: "approved"
                }
              );


              renderJoinRequestsPanel(
                element
              );

            } catch (error) {

              alert(
                error?.message ||
                "Approval failed."
              );

            }

          }
        );

      });


    list
      .querySelectorAll(
        "[data-reject-request]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async function () {

            const id =
              button.dataset
                .rejectRequest;


            try {

              await Api.put(
                `/join-requests/${encodeURIComponent(id)}`,
                {
                  status: "rejected"
                }
              );


              renderJoinRequestsPanel(
                element
              );

            } catch (error) {

              alert(
                error?.message ||
                "Rejection failed."
              );

            }

          }
        );

      });


  } catch (error) {

    list.innerHTML = `
      <div class="form-error">
        ${esc(
          error?.message ||
          "Failed to load join requests."
        )}
      </div>
    `;

  }

}


/* =========================================================
   MESSAGES
   ========================================================= */

async function renderMessagesPanel(
  element
) {

  element.innerHTML = `

    <div class="entity-form-card">

      <h3>
        Contact Messages
      </h3>

      <p>
        Messages submitted through the website.
      </p>

    </div>

    <div id="messages-list">

      <div class="empty-state">
        Loading…
      </div>

    </div>

  `;


  const list =
    document.getElementById(
      "messages-list"
    );


  try {

    const messages =
      await Api.get(
        "/messages/admin/all"
      );


    if (
      !Array.isArray(messages) ||
      !messages.length
    ) {

      list.innerHTML = `
        <div class="empty-state">
          No messages found.
        </div>
      `;

      return;

    }


    list.innerHTML = `

      <div class="entity-table-wrap">

        <table class="entity-table">

          <thead>

            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            ${messages
              .map(message => {

                return `

                  <tr>

                    <td>
                      ${esc(
                        message.name
                      )}
                    </td>

                    <td>
                      ${esc(
                        message.email
                      )}
                    </td>

                    <td>
                      ${esc(
                        message.subject
                      )}
                    </td>

                    <td>
                      ${esc(
                        message.message
                      )}
                    </td>

                    <td>
                      ${
                        message.read
                          ? "Read"
                          : "Unread"
                      }
                    </td>

                  </tr>

                `;

              })
              .join("")}

          </tbody>

        </table>

      </div>

    `;

  } catch (error) {

    list.innerHTML = `
      <div class="form-error">
        ${esc(
          error?.message ||
          "Failed to load messages."
        )}
      </div>
    `;

  }

}


/* =========================================================
   SETTINGS
   ========================================================= */

async function renderSettingsPanel(
  element
) {

  element.innerHTML = `

    <div class="entity-form-card">

      <h3>
        Admin Settings
      </h3>

      <p>
        Your admin authentication is handled
        through Supabase authentication.
      </p>

      <button
        class="btn btn-primary"
        id="refresh-session-btn"
      >
        Check Session
      </button>

      <div
        id="session-result"
        style="margin-top:15px;"
      ></div>

    </div>

  `;


  document
    .getElementById(
      "refresh-session-btn"
    )
    .addEventListener(
      "click",
      async function () {

        const result =
          document.getElementById(
            "session-result"
          );


        try {

          const supabase =
            getSupabaseClient();


          const {
            data,
            error
          } =
            await supabase.auth.getSession();


          if (error) {
            throw error;
          }


          if (
            data?.session
          ) {

            result.innerHTML = `
              <div class="form-success">
                Admin session is active.
              </div>
            `;

          } else {

            result.innerHTML = `
              <div class="form-error">
                No active admin session.
              </div>
            `;

          }

        } catch (error) {

          result.innerHTML = `
            <div class="form-error">
              ${esc(
                error?.message ||
                "Session check failed."
              )}
            </div>
          `;

        }

      }
    );

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

(async function initAdmin() {

  try {

    if (
      typeof Api !== "undefined" &&
      typeof Api.init === "function"
    ) {

      await Api.init();

    }


    if (
      typeof Api !== "undefined" &&
      typeof Api.isAuthed === "function" &&
      Api.isAuthed()
    ) {

      showAdminShell();

    } else {

      showLoginScreen();

    }

  } catch (error) {

    console.error(
      "DragonByte admin initialization:",
      error
    );

    showLoginScreen();

  }

})();