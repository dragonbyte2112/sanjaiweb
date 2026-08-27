const ADMIN_SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "members", label: "Members", icon: "👥" },
  { id: "contributors", label: "Contributors", icon: "⭐" },
  { id: "events", label: "Events", icon: "📅" },
  { id: "projects", label: "Projects", icon: "🔧" },
  { id: "challenges", label: "CTF Challenges", icon: "🚩" },
  { id: "join-requests", label: "Join Requests", icon: "📨" },
  { id: "messages", label: "Messages", icon: "✉️" },
  { id: "testimonials", label: "Testimonials", icon: "💬" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

let activeSection = "dashboard";

// ── Auth ──

function showAdminShell() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("admin-shell").classList.remove("hidden");
  renderSidebar();
  goToSection("dashboard");
}

function showLoginScreen() {
  document.getElementById("admin-shell").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("login-submit");
  const errEl = document.getElementById("login-error");
  errEl.classList.add("hidden");
  btn.disabled = true;
  btn.textContent = "Signing in…";

  try {
    await Api.login(document.getElementById("login-username").value, document.getElementById("login-password").value);
    showAdminShell();
  } catch (err) {
    errEl.textContent = err.message || "Invalid credentials";
    errEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  Api.logout();
  showLoginScreen();
});

// ── Sidebar ──

function renderSidebar() {
  const nav = document.getElementById("admin-nav");
  nav.innerHTML = ADMIN_SECTIONS.map(
    (s) => `<button class="admin-nav-item ${s.id === activeSection ? "active" : ""}" data-section="${s.id}">
      <span>${s.icon}</span> ${s.label}
    </button>`,
  ).join("");
  nav.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => goToSection(btn.dataset.section));
  });
}

function goToSection(id) {
  activeSection = id;
  renderSidebar();
  document.getElementById("section-title").textContent = ADMIN_SECTIONS.find((s) => s.id === id).label;
  renderSection(id);
}

function renderSection(id) {
  const el = document.getElementById("section-content");
  el.innerHTML = "";
  if (id === "dashboard") return renderDashboard(el);
  if (id === "members") return renderEntityManager(el, entityConfigs.members);
  if (id === "contributors") return renderEntityManager(el, entityConfigs.contributors);
  if (id === "events") return renderEntityManager(el, entityConfigs.events);
  if (id === "projects") return renderEntityManager(el, entityConfigs.projects);
  if (id === "testimonials") return renderEntityManager(el, entityConfigs.testimonials);
  if (id === "challenges") return renderChallengesPanel(el);
  if (id === "join-requests") return renderJoinRequestsPanel(el);
  if (id === "messages") return renderMessagesPanel(el);
  if (id === "settings") return renderSettingsPanel(el);
}

// ── Dashboard ──

const STAT_META = [
  { key: "members", label: "Members", icon: "👥" },
  { key: "events", label: "Events", icon: "📅" },
  { key: "projects", label: "Projects", icon: "🔧" },
  { key: "joinRequests", label: "Pending Join Requests", icon: "📨" },
  { key: "messages", label: "Unread Messages", icon: "✉️" },
  { key: "testimonials", label: "Testimonials", icon: "💬" },
  { key: "challenges", label: "CTF Challenges", icon: "🚩" },
  { key: "ctfSolves", label: "Total CTF Solves", icon: "✅" },
];

async function renderDashboard(el) {
  el.innerHTML = `<div class="grid grid-3" id="stat-grid">${STAT_META.map(
    (s) => `<div class="stat-card"><div class="top"><span>${s.icon}</span><span class="value" id="stat-${s.key}">…</span></div><div class="text-sm" style="font-weight:500; color:#475569;">${s.label}</div></div>`,
  ).join("")}</div>`;
  try {
    const stats = await Api.get("/admin/stats");
    STAT_META.forEach((s) => {
      const node = document.getElementById(`stat-${s.key}`);
      if (node) node.textContent = stats[s.key] ?? 0;
    });
  } catch (err) {
    el.insertAdjacentHTML("afterbegin", `<div class="form-error mb-4">${esc(err.message)}</div>`);
  }
}

// ── Generic entity manager (events, projects, contributors, testimonials, members) ──

const entityConfigs = {
  members: {
    title: "Member",
    apiBase: "/members",
    columns: ["name", "email", "username"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "username", label: "Username", type: "text" },
      { key: "skills", label: "Skills", type: "text" },
    ],
  },
  contributors: {
    title: "Contributor",
    apiBase: "/contributors",
    columns: ["name", "role", "featured"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "photo", label: "Photo URL", type: "text" },
      { key: "skills", label: "Skills", type: "tags" },
      { key: "github", label: "GitHub URL", type: "text" },
      { key: "linkedin", label: "LinkedIn URL", type: "text" },
      { key: "featured", label: "Featured on homepage", type: "checkbox" },
    ],
  },
  events: {
    title: "Event",
    apiBase: "/events",
    columns: ["title", "date", "location", "published"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "date", label: "Date", type: "text", placeholder: "2026-12-01" },
      { key: "time", label: "Time", type: "text", placeholder: "10:00 AM" },
      { key: "location", label: "Location", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "image", label: "Image URL", type: "text" },
      { key: "registrationUrl", label: "Registration URL", type: "text" },
      { key: "featured", label: "Featured on homepage", type: "checkbox" },
      { key: "published", label: "Published (visible to visitors)", type: "checkbox" },
    ],
  },
  projects: {
    title: "Project",
    apiBase: "/projects",
    columns: ["name", "category", "published"],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image", label: "Image URL", type: "text" },
      { key: "githubUrl", label: "GitHub URL", type: "text" },
      { key: "demoUrl", label: "Demo URL", type: "text" },
      { key: "resourceUrl", label: "Resource Link (docs, article, external site)", type: "text" },
      { key: "technologies", label: "Technologies", type: "tags" },
      { key: "contributors", label: "Contributors", type: "tags" },
      { key: "category", label: "Category", type: "text" },
      { key: "featured", label: "Featured on homepage", type: "checkbox" },
      { key: "published", label: "Published (visible to visitors)", type: "checkbox" },
    ],
  },
  testimonials: {
    title: "Testimonial",
    apiBase: "/testimonials",
    columns: ["name", "role", "approved"],
    fields: [
      { key: "quote", label: "Quote", type: "textarea" },
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "photo", label: "Photo URL", type: "text" },
      { key: "approved", label: "Approved (visible to visitors)", type: "checkbox" },
    ],
  },
};

function fieldInputHtml(f, value) {
  const v = value ?? (f.type === "checkbox" ? false : "");
  if (f.type === "checkbox") {
    return `<label class="field-check mt-2"><input type="checkbox" data-field="${f.key}" ${v ? "checked" : ""} /> <span class="text-sm">Yes</span></label>`;
  }
  if (f.type === "textarea") {
    return `<textarea data-field="${f.key}" rows="3" placeholder="${esc(f.placeholder || "")}">${esc(v)}</textarea>`;
  }
  const displayVal = f.type === "tags" && Array.isArray(v) ? v.join(", ") : v;
  return `<input data-field="${f.key}" value="${esc(displayVal)}" placeholder="${esc(f.placeholder || (f.type === "tags" ? "comma, separated, values" : ""))}" />`;
}

function renderEntityManager(container, config) {
  let rows = [];
  let showForm = false;
  let editingId = null;

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <div class="text-sm text-muted" id="em-count">Loading…</div>
      <button id="em-toggle" class="btn btn-primary btn-sm">+ Add ${config.title}</button>
    </div>
    <div id="em-error"></div>
    <div id="em-form"></div>
    <div id="em-table"></div>
  `;

  const countEl = container.querySelector("#em-count");
  const toggleBtn = container.querySelector("#em-toggle");
  const errorEl = container.querySelector("#em-error");
  const formEl = container.querySelector("#em-form");
  const tableEl = container.querySelector("#em-table");

  function showError(msg) {
    errorEl.innerHTML = msg ? `<div class="form-error mb-3" style="background:#fef2f2; padding:12px 16px; border-radius:10px;">${esc(msg)}</div>` : "";
  }

  function renderForm() {
    if (!showForm) {
      formEl.innerHTML = "";
      toggleBtn.textContent = `+ Add ${config.title}`;
      return;
    }
    toggleBtn.textContent = "Cancel";
    const editingRow = editingId ? rows.find((r) => r.id === editingId) : null;
    formEl.innerHTML = `
      <form id="em-entity-form" class="admin-panel-box">
        <h3 class="h3 mb-3">${editingId ? "Edit" : "New"} ${config.title}</h3>
        <div class="grid grid-2">
          ${config.fields
            .map(
              (f) => `
            <div class="field" style="${f.type === "textarea" ? "grid-column:1/-1;" : ""}">
              <label>${f.label}</label>
              ${fieldInputHtml(f, editingRow ? editingRow[f.key] : undefined)}
            </div>`,
            )
            .join("")}
        </div>
        <button type="submit" class="btn btn-primary mt-2">${editingId ? "Save Changes" : "Create"}</button>
      </form>
    `;

    formEl.querySelector("#em-entity-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {};
      config.fields.forEach((f) => {
        const input = formEl.querySelector(`[data-field="${f.key}"]`);
        if (f.type === "checkbox") payload[f.key] = input.checked;
        else if (f.type === "tags") payload[f.key] = input.value.split(",").map((s) => s.trim()).filter(Boolean);
        else payload[f.key] = input.value;
      });
      try {
        if (editingId) await Api.put(`${config.apiBase}/${editingId}`, payload);
        else await Api.post(config.apiBase, payload);
        showForm = false;
        editingId = null;
        showError(null);
        await load();
      } catch (err) {
        showError(err.message);
      }
    });
  }

  function renderTable() {
    if (!rows.length) {
      tableEl.innerHTML = `<div class="empty-state"><p class="text-sm text-muted">No ${config.title.toLowerCase()}s yet.</p></div>`;
      return;
    }
    tableEl.innerHTML = `
      <div class="admin-panel-box" style="padding:0; overflow-x:auto;">
        <table class="admin-table">
          <thead><tr>${config.columns.map((c) => `<th>${c}</th>`).join("")}<th style="text-align:right;">Actions</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                ${config.columns
                  .map((c) => {
                    const v = row[c];
                    const display = Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "✓" : "—") : esc(v);
                    return `<td>${display}</td>`;
                  })
                  .join("")}
                <td style="text-align:right; white-space:nowrap;">
                  <button class="link-btn link-blue mr-2" data-edit="${row.id}" style="margin-right:12px;">Edit</button>
                  <button class="link-btn link-red" data-delete="${row.id}">Delete</button>
                </td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    tableEl.querySelectorAll("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () => {
        editingId = btn.dataset.edit;
        showForm = true;
        renderForm();
      }),
    );
    tableEl.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this item? This can't be undone.")) return;
        try {
          await Api.del(`${config.apiBase}/${btn.dataset.delete}`);
          await load();
        } catch (err) {
          showError(err.message);
        }
      }),
    );
  }

  async function load() {
    countEl.textContent = "Loading…";
    try {
      rows = await Api.get(`${config.apiBase}/admin/all`);
      countEl.textContent = `${rows.length} item${rows.length === 1 ? "" : "s"}`;
      renderTable();
    } catch (err) {
      showError(err.message);
    }
  }

  toggleBtn.addEventListener("click", () => {
    showForm = !showForm;
    editingId = null;
    renderForm();
  });

  load();
}

// ── Join Requests ──

const JOIN_STATUS_BADGE = { pending: "badge-yellow", approved: "badge-green", rejected: "badge-red" };

function renderJoinRequestsPanel(container) {
  container.innerHTML = `<div id="jr-error"></div><div id="jr-list"><div class="loading-text">Loading…</div></div>`;
  const errorEl = container.querySelector("#jr-error");
  const listEl = container.querySelector("#jr-list");

  function showError(msg) {
    errorEl.innerHTML = msg ? `<div class="form-error mb-3" style="background:#fef2f2; padding:12px 16px; border-radius:10px;">${esc(msg)}</div>` : "";
  }

  async function load() {
    try {
      const rows = await Api.get("/join");
      if (!rows.length) {
        listEl.innerHTML = `<div class="empty-state"><p class="text-sm text-muted">No applications yet.</p></div>`;
        return;
      }
      listEl.innerHTML = rows
        .map(
          (r) => `
        <div class="admin-panel-box">
          <div class="flex justify-between items-start" style="gap:16px;">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h4 class="h3">${esc(r.name)}</h4>
                <span class="badge ${JOIN_STATUS_BADGE[r.status] || "badge-slate"}">${esc(r.status)}</span>
              </div>
              <p class="text-sm text-muted">${esc(r.email)} · @${esc(r.username)}</p>
              ${r.skills ? `<p class="text-xs text-muted mt-1">Skills: ${esc(r.skills)}</p>` : ""}
              ${r.message ? `<p class="text-sm mt-2">${esc(r.message)}</p>` : ""}
            </div>
            <div class="flex flex-col gap-2" style="flex-shrink:0; align-items:flex-end;">
              ${r.status !== "approved" ? `<button class="btn btn-sm" style="background:#16a34a; color:#fff;" data-approve="${r.id}">Approve</button>` : ""}
              ${r.status !== "rejected" ? `<button class="btn btn-sm" style="background:#fef2f2; color:#dc2626;" data-reject="${r.id}">Reject</button>` : ""}
              <button class="link-btn" style="color:#94a3b8;" data-delete="${r.id}">Delete</button>
            </div>
          </div>
        </div>`,
        )
        .join("");

      listEl.querySelectorAll("[data-approve]").forEach((btn) => btn.addEventListener("click", () => updateStatus(btn.dataset.approve, "approved")));
      listEl.querySelectorAll("[data-reject]").forEach((btn) => btn.addEventListener("click", () => updateStatus(btn.dataset.reject, "rejected")));
      listEl.querySelectorAll("[data-delete]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this application?")) return;
          try {
            await Api.del(`/join/${btn.dataset.delete}`);
            await load();
          } catch (err) {
            showError(err.message);
          }
        }),
      );
    } catch (err) {
      showError(err.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await Api.put(`/join/${id}`, { status });
      await load();
    } catch (err) {
      showError(err.message);
    }
  }

  load();
}

// ── Messages ──

function renderMessagesPanel(container) {
  container.innerHTML = `<div id="msg-error"></div><div id="msg-list"><div class="loading-text">Loading…</div></div>`;
  const errorEl = container.querySelector("#msg-error");
  const listEl = container.querySelector("#msg-list");

  function showError(msg) {
    errorEl.innerHTML = msg ? `<div class="form-error mb-3" style="background:#fef2f2; padding:12px 16px; border-radius:10px;">${esc(msg)}</div>` : "";
  }

  async function load() {
    try {
      const rows = await Api.get("/contact");
      if (!rows.length) {
        listEl.innerHTML = `<div class="empty-state"><p class="text-sm text-muted">No messages yet.</p></div>`;
        return;
      }
      listEl.innerHTML = rows
        .map(
          (m) => `
        <div class="admin-panel-box" style="${m.read ? "" : "background:#eff6ff; border-color:#bfdbfe;"}">
          <div class="flex justify-between items-start" style="gap:16px;">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h4 class="h3">${esc(m.subject)}</h4>
                ${!m.read ? `<span class="badge" style="background:#1d4ed8; color:#fff;">New</span>` : ""}
              </div>
              <p class="text-sm text-muted">${esc(m.name)} · ${esc(m.email)}</p>
              <p class="text-sm mt-2">${esc(m.message)}</p>
            </div>
            <div class="flex flex-col gap-2" style="flex-shrink:0; align-items:flex-end;">
              <button class="btn btn-sm" style="background:#f1f5f9; color:#475569;" data-toggle-read="${m.id}" data-read="${m.read}">${m.read ? "Mark unread" : "Mark read"}</button>
              <button class="link-btn" style="color:#94a3b8;" data-delete="${m.id}">Delete</button>
            </div>
          </div>
        </div>`,
        )
        .join("");

      listEl.querySelectorAll("[data-toggle-read]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          try {
            await Api.put(`/contact/${btn.dataset.toggleRead}`, { read: btn.dataset.read !== "true" });
            await load();
          } catch (err) {
            showError(err.message);
          }
        }),
      );
      listEl.querySelectorAll("[data-delete]").forEach((btn) =>
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this message?")) return;
          try {
            await Api.del(`/contact/${btn.dataset.delete}`);
            await load();
          } catch (err) {
            showError(err.message);
          }
        }),
      );
    } catch (err) {
      showError(err.message);
    }
  }

  load();
}

// ── CTF Challenges (flag is write-only) ──

function renderChallengesPanel(container) {
  let rows = [];
  let showForm = false;
  let editingId = null;

  container.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <div class="text-sm text-muted" id="ch-count">Loading…</div>
      <button id="ch-toggle" class="btn btn-primary btn-sm">+ Add Challenge</button>
    </div>
    <div id="ch-error"></div>
    <div id="ch-form"></div>
    <div id="ch-table"></div>
  `;

  const countEl = container.querySelector("#ch-count");
  const toggleBtn = container.querySelector("#ch-toggle");
  const errorEl = container.querySelector("#ch-error");
  const formEl = container.querySelector("#ch-form");
  const tableEl = container.querySelector("#ch-table");

  function showError(msg) {
    errorEl.innerHTML = msg ? `<div class="form-error mb-3" style="background:#fef2f2; padding:12px 16px; border-radius:10px;">${esc(msg)}</div>` : "";
  }

  function renderForm() {
    if (!showForm) {
      formEl.innerHTML = "";
      toggleBtn.textContent = "+ Add Challenge";
      return;
    }
    toggleBtn.textContent = "Cancel";
    const row = editingId ? rows.find((r) => r.id === editingId) : null;
    formEl.innerHTML = `
      <form id="ch-entity-form" class="admin-panel-box">
        <h3 class="h3 mb-3">${editingId ? "Edit" : "New"} Challenge</h3>
        <div class="grid grid-2">
          <div class="field"><label>Title</label><input data-f="title" value="${esc(row?.title || "")}" /></div>
          <div class="field"><label>Category</label><input data-f="category" value="${esc(row?.category || "")}" placeholder="Crypto, Web, Forensics, Pwn…" /></div>
          <div class="field" style="grid-column:1/-1;"><label>Description</label><textarea data-f="description" rows="3">${esc(row?.description || "")}</textarea></div>
          <div class="field">
            <label>Difficulty</label>
            <select data-f="difficulty">
              ${["Easy", "Medium", "Hard", "Insane"].map((d) => `<option value="${d}" ${row?.difficulty === d ? "selected" : ""}>${d}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>Points</label><input data-f="points" type="number" value="${row?.points ?? 50}" /></div>
          <div class="field" style="grid-column:1/-1;">
            <label>Flag ${editingId ? '<span style="color:#94a3b8; font-weight:400;">(leave blank to keep the current flag)</span>' : ""}</label>
            <input data-f="flag" class="mono" placeholder="flag{...}" />
            <p class="text-xs text-muted mt-1">Stored hashed — never shown again after saving.</p>
          </div>
          <div class="field-check mt-2"><input type="checkbox" data-f="published" ${row?.published !== false ? "checked" : ""} /> <span class="text-sm">Published (visible to visitors)</span></div>
        </div>
        <button type="submit" class="btn btn-primary mt-2">${editingId ? "Save Changes" : "Create"}</button>
      </form>
    `;

    formEl.querySelector("#ch-entity-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const get = (k) => formEl.querySelector(`[data-f="${k}"]`);
      const payload = {
        title: get("title").value,
        category: get("category").value,
        description: get("description").value,
        difficulty: get("difficulty").value,
        points: Number(get("points").value),
        published: get("published").checked,
      };
      const flag = get("flag").value.trim();
      if (flag) payload.flag = flag;

      try {
        if (editingId) {
          await Api.put(`/ctf/challenges/${editingId}`, payload);
        } else {
          if (!flag) return showError("A flag is required when creating a new challenge");
          await Api.post("/ctf/challenges", payload);
        }
        showForm = false;
        editingId = null;
        showError(null);
        await load();
      } catch (err) {
        showError(err.message);
      }
    });
  }

  function renderTable() {
    if (!rows.length) {
      tableEl.innerHTML = `<div class="empty-state"><p class="text-sm text-muted">No challenges yet.</p></div>`;
      return;
    }
    tableEl.innerHTML = `
      <div class="admin-panel-box" style="padding:0; overflow-x:auto;">
        <table class="admin-table">
          <thead><tr><th>title</th><th>category</th><th>difficulty</th><th>points</th><th>published</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                <td>${esc(row.title)}</td>
                <td>${esc(row.category)}</td>
                <td>${esc(row.difficulty)}</td>
                <td>${row.points}</td>
                <td>${row.published !== false ? "✓" : "—"}</td>
                <td style="text-align:right; white-space:nowrap;">
                  <button class="link-btn link-blue" data-edit="${row.id}" style="margin-right:12px;">Edit</button>
                  <button class="link-btn link-red" data-delete="${row.id}">Delete</button>
                </td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    tableEl.querySelectorAll("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () => {
        editingId = btn.dataset.edit;
        showForm = true;
        renderForm();
      }),
    );
    tableEl.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this challenge? Its solves and leaderboard points will also be removed.")) return;
        try {
          await Api.del(`/ctf/challenges/${btn.dataset.delete}`);
          await load();
        } catch (err) {
          showError(err.message);
        }
      }),
    );
  }

  async function load() {
    countEl.textContent = "Loading…";
    try {
      rows = await Api.get("/ctf/challenges/admin/all");
      countEl.textContent = `${rows.length} challenge${rows.length === 1 ? "" : "s"}`;
      renderTable();
    } catch (err) {
      showError(err.message);
    }
  }

  toggleBtn.addEventListener("click", () => {
    showForm = !showForm;
    editingId = null;
    renderForm();
  });

  load();
}

// ── Settings ──

function renderSettingsPanel(container) {
  container.innerHTML = `
    <div class="admin-panel-box" style="max-width:420px;">
      <h3 class="h3 mb-3">Change Admin Password</h3>
      <form id="settings-form">
        <div class="field"><label>Current Password</label><input type="password" id="s-current" required /></div>
        <div class="field"><label>New Password</label><input type="password" id="s-new" required /></div>
        <div class="field"><label>Confirm New Password</label><input type="password" id="s-confirm" required /></div>
        <p id="settings-error" class="form-error hidden"></p>
        <p id="settings-success" class="form-success hidden">Password updated.</p>
        <button type="submit" id="settings-submit" class="btn btn-primary mt-1">Update Password</button>
      </form>
    </div>
  `;

  document.getElementById("settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("settings-error");
    const okEl = document.getElementById("settings-success");
    const btn = document.getElementById("settings-submit");
    errEl.classList.add("hidden");
    okEl.classList.add("hidden");

    const currentPassword = document.getElementById("s-current").value;
    const newPassword = document.getElementById("s-new").value;
    const confirm = document.getElementById("s-confirm").value;

    if (newPassword !== confirm) {
      errEl.textContent = "New password and confirmation don't match";
      errEl.classList.remove("hidden");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Saving…";
    try {
      await Api.post("/auth/change-password", { currentPassword, newPassword });
      okEl.classList.remove("hidden");
      document.getElementById("settings-form").reset();
    } catch (err) {
      errEl.textContent = err.message || "Failed to change password";
      errEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "Update Password";
    }
  });
}

// ── Init ──

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof Api.init === "function") await Api.init();
  if (Api.isAuthed()) showAdminShell();
  else showLoginScreen();
});
