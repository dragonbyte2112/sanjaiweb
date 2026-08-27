const NAV_LINKS = [
  { label: "Home", href: "/index.html" },
  { label: "Community", href: "/community.html" },
  { label: "Learn", href: "/learn.html" },
  { label: "Events", href: "/events.html" },
  { label: "Projects", href: "/projects.html" },
  { label: "CTF Arena 🚩", href: "https://dragonbyte-ctf-web.vercel.app/", external: true },
];

const SOCIAL_LINKS = [
  {
    label: "WhatsApp Community",
    href: "https://chat.whatsapp.com/EiRtdSZBETOK2dJIN6Oqwt",
    color: "#25D366",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.26-8.25 2.2 0 4.28.86 5.84 2.42a8.2 8.2 0 0 1 2.41 5.84c0 4.55-3.7 8.25-8.26 8.25Zm4.53-6.18c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.17-.29.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.15-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.2 3.7.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z"/></svg>`,
  },
  {
    label: "LinkedIn Group",
    href: "https://www.linkedin.com/groups/29880013/",
    color: "#0A66C2",
    svg: `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.11 20.45H3.56V9h3.55v11.45Z"/></svg>`,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/team_dragon_byte/",
    color: "#E1306C",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>`,
  },
];

function renderSocialIcons() {
  return SOCIAL_LINKS.map(
    (s) => `
      <a href="${s.href}" target="_blank" rel="noopener noreferrer" class="social-icon" title="${s.label}" aria-label="${s.label}" style="--icon-color:${s.color};">
        ${s.svg}
      </a>`,
  ).join("");
}

function currentPage() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  return path;
}

function renderNavbar() {
  const active = currentPage();
  const links = NAV_LINKS.map(
    (l) => `<a href="${l.href}" ${l.external ? 'target="_blank" rel="noopener noreferrer"' : ""} class="${!l.external && l.href.endsWith(active) ? "active" : ""}">${l.label}</a>`,
  ).join("");

  return `
    <nav class="navbar" id="site-navbar">
      <div class="navbar-inner">
        <a href="/index.html" class="logo-link">
          <img src="/assets/img/logo-icon.png" alt="DragonByte" />
          <span class="logo-word">DragonByte</span>
        </a>
        <div class="nav-links" id="nav-links">${links}
          <a href="/join.html" class="btn btn-primary btn-sm">Join Us</a>
        </div>
        <button class="nav-toggle" id="nav-toggle" aria-label="Menu">☰</button>
      </div>
    </nav>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <img src="/assets/img/logo-full.png" alt="DragonByte" style="height:80px; margin-bottom:16px;" />
            <p class="text-sm" style="font-weight:600; color:#e2e8f0; margin-bottom:4px;">Learn. Build. Hack. Defend.</p>
            <p class="text-sm mb-3">Building the next generation of cybersecurity learners through DragonByte.</p>
            <div class="social-icons-row">${renderSocialIcons()}</div>
          </div>
          <div>
            <div class="footer-heading">Explore</div>
            <ul style="display:flex; flex-direction:column; gap:8px;">
              <li><a href="/events.html">Events</a></li>
              <li><a href="/projects.html">Projects</a></li>
              <li><a href="https://dragonbyte-ctf-web.vercel.app/" target="_blank" rel="noopener noreferrer">CTF Challenges</a></li>
              <li><a href="/learn.html">Learn</a></li>
            </ul>
          </div>
          <div>
            <div class="footer-heading">Community</div>
            <ul style="display:flex; flex-direction:column; gap:8px;">
              <li><a href="/community.html">Community Hub</a></li>
              <li><a href="/join.html">Join Us</a></li>
              <li><a href="/about.html">About</a></li>
            </ul>
          </div>
          <div>
            <div class="footer-heading">Get in touch</div>
            <ul style="display:flex; flex-direction:column; gap:8px;">
              <li><a href="/contact.html">Contact</a></li>
              <li><a href="/admin.html">Admin</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>// LEARN · HACK · DEFEND · GROW //</span>
          <span>&copy; ${new Date().getFullYear()} DragonByte</span>
        </div>
      </div>
    </footer>
  `;
}

// Local, offline FAQ knowledge base — no external API, no key, no cost.
// Each entry is checked against the visitor's message; the first match wins.
const ASSISTANT_FAQ = [
  {
    keywords: ["join", "sign up", "signup", "become a member", "membership", "how do i join"],
    reply: "You can join DragonByte a few ways: fill out the form on our Join page, hop into our WhatsApp group, or join the LinkedIn group — links are in the footer. Head to /join.html to get started!",
  },
  {
    keywords: ["ctf", "capture the flag", "arena", "flag", "leaderboard"],
    reply: "Our CTF Arena is a separate live platform with hands-on challenges and a leaderboard. Find it at dragonbyte-ctf-web.vercel.app, or click \"CTF Arena\" in the nav bar!",
  },
  {
    keywords: ["event", "events", "workshop", "meetup", "webinar", "schedule"],
    reply: "Check out the Events page for upcoming workshops, meetups, and CTF nights — /events.html. New ones are added regularly, so it's worth checking back.",
  },
  {
    keywords: ["project", "projects", "github", "open source", "opensource", "build"],
    reply: "The Projects page (/projects.html) showcases open-source security tools built by our members. Want to contribute? Join the community first via /join.html.",
  },
  {
    keywords: ["contact", "email", "reach", "support", "help me", "question"],
    reply: "You can reach us anytime through the Contact page — /contact.html. Someone from the team will get back to you.",
  },
  {
    keywords: ["about", "founder", "who created", "who made", "who is sanjai", "history", "story"],
    reply: "DragonByte was founded by Sanjai Rathinam. Read the full story, our core values, and timeline on the About page — /about.html.",
  },
  {
    keywords: ["learn", "resource", "resources", "course", "path", "tutorial", "beginner"],
    reply: "The Learn page (/learn.html) has resources, workshops, and structured learning paths for every skill level — beginner to advanced.",
  },
  {
    keywords: ["community", "whatsapp", "linkedin", "instagram", "social", "group", "members", "team"],
    reply: "You can connect with the community on WhatsApp, LinkedIn, and Instagram — the icons are in the footer and on the homepage. Or browse /community.html to see members and teams.",
  },
  {
    keywords: ["hi", "hello", "hey", "yo", "sup"],
    reply: "Hey there! 👋 Ask me about joining, events, projects, the CTF Arena, or how to get in touch.",
  },
  {
    keywords: ["thank", "thanks", "thx"],
    reply: "You're welcome! Let me know if there's anything else you'd like to know about DragonByte. 🐉",
  },
];

const ASSISTANT_FALLBACK =
  "I'm just a simple FAQ helper, so I might not have that answer! Try asking about joining, events, projects, the CTF Arena, or check the Contact page (/contact.html) for anything specific.";

function matchAssistantReply(text) {
  const lower = text.toLowerCase();
  for (const item of ASSISTANT_FAQ) {
    if (item.keywords.some((k) => lower.includes(k))) return item.reply;
  }
  return ASSISTANT_FALLBACK;
}

function renderAssistantWidget() {
  return `
    <div id="ai-widget-root">
      <button id="ai-widget-toggle" aria-label="Open DragonByte Help Assistant" title="Ask DragonByte Help">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="24" height="24">
          <path d="M12 3c-4.97 0-9 3.5-9 7.8 0 2.4 1.24 4.56 3.2 6.02-.14.9-.5 2.1-1.35 3.18a.5.5 0 0 0 .5.79c1.86-.4 3.3-1.18 4.2-1.78.79.2 1.62.3 2.45.3 4.97 0 9-3.5 9-7.8S16.97 3 12 3Z"/>
          <circle cx="8.5" cy="10.8" r="1"/><circle cx="12" cy="10.8" r="1"/><circle cx="15.5" cy="10.8" r="1"/>
        </svg>
      </button>

      <div id="ai-widget-panel" class="hidden">
        <div id="ai-widget-header">
          <div>
            <div id="ai-widget-title">DragonByte Help</div>
            <div id="ai-widget-subtitle">Quick answers — events, projects, joining</div>
          </div>
          <button id="ai-widget-close" aria-label="Close chat">✕</button>
        </div>
        <div id="ai-widget-messages">
          <div class="ai-msg ai-msg-bot">Hey! 👋 I'm a quick-help bot for DragonByte. Ask me about events, projects, joining the community, or the CTF Arena.</div>
        </div>
        <form id="ai-widget-form">
          <input id="ai-widget-input" type="text" placeholder="Type a message…" autocomplete="off" />
          <button type="submit" id="ai-widget-send" aria-label="Send">➤</button>
        </form>
      </div>
    </div>
  `;
}

function initAssistantWidget() {
  if (document.getElementById("ai-widget-root")) return;
  document.body.insertAdjacentHTML("beforeend", renderAssistantWidget());

  const toggle = document.getElementById("ai-widget-toggle");
  const panel = document.getElementById("ai-widget-panel");
  const closeBtn = document.getElementById("ai-widget-close");
  const form = document.getElementById("ai-widget-form");
  const input = document.getElementById("ai-widget-input");
  const messagesEl = document.getElementById("ai-widget-messages");

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `ai-msg ai-msg-${role === "user" ? "user" : "bot"}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) input.focus();
  });
  closeBtn.addEventListener("click", () => panel.classList.add("hidden"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMessage("user", text);

    const typingEl = document.createElement("div");
    typingEl.className = "ai-msg ai-msg-bot ai-msg-typing";
    typingEl.textContent = "Typing…";
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Small delay just so it doesn't feel instant/robotic — everything here
    // runs locally in the browser, no server or API call involved.
    setTimeout(() => {
      typingEl.remove();
      addMessage("bot", matchAssistantReply(text));
    }, 450);
  });
}

function initLayout() {
  const headerEl = document.getElementById("site-header");
  const footerEl = document.getElementById("site-footer");
  if (headerEl) headerEl.innerHTML = renderNavbar();
  if (footerEl) footerEl.innerHTML = renderFooter();

  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("mobile-open"));
  }

  const nav = document.getElementById("site-navbar");
  if (nav) {
    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 12);
    });
  }

  const homeSocial = document.getElementById("social-icons-home");
  if (homeSocial) homeSocial.innerHTML = renderSocialIcons();
}

document.addEventListener("DOMContentLoaded", () => {
  initLayout();
  initAssistantWidget();
});
