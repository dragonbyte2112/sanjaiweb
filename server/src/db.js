import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbFile = path.join(__dirname, "..", "data", "db.json");

const defaultData = {
  admin: null,
  events: [],
  projects: [],
  contributors: [],
  testimonials: [],
  members: [],
  joinRequests: [],
  messages: [],
  challenges: [],
  solves: [],
};

const adapter = new JSONFile(dbFile);
export const db = new Low(adapter, defaultData);

export async function initDb() {
  await db.read();
  db.data ||= structuredClone(defaultData);

  // Seed the admin account once, on first run only.
  let isFirstRun = false;
  if (!db.data.admin) {
    isFirstRun = true;
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const passwordHash = await bcrypt.hash(password, 10);
    db.data.admin = { username, passwordHash };
    console.log(`Seeded admin account -> username: "${username}" (password from .env)`);
  }

  // Seed a bit of starter content on first run only, so the site isn't
  // blank before you've added anything through the admin panel. Edit or
  // delete any of this from /admin.html at any time.
  if (isFirstRun) {
    const now = new Date().toISOString();

    db.data.events.push(
      {
        id: makeId(), createdAt: now, updatedAt: now, published: true, featured: true,
        title: "Intro to Web Security", category: "Workshop",
        description: "A beginner-friendly walkthrough of the OWASP Top 10, with hands-on examples.",
        date: "2026-09-15", time: "6:00 PM", location: "Online",
      },
      {
        id: makeId(), createdAt: now, updatedAt: now, published: true, featured: false,
        title: "Monthly CTF Night", category: "CTF",
        description: "A casual, community CTF session — all skill levels welcome.",
        date: "2026-09-28", time: "7:00 PM", location: "Discord",
      },
    );

    db.data.projects.push(
      {
        id: makeId(), createdAt: now, updatedAt: now, published: true, featured: true,
        name: "PacketSniff", category: "Tool",
        description: "An open-source network traffic analyzer built by the community.",
        technologies: ["Python", "Scapy"],
      },
      {
        id: makeId(), createdAt: now, updatedAt: now, published: true, featured: false,
        name: "SecureNotes", category: "App",
        description: "An end-to-end encrypted notes app, built as a learning project.",
        technologies: ["JavaScript", "WebCrypto"],
      },
    );

    db.data.contributors.push(
      {
        id: makeId(), createdAt: now, updatedAt: now, featured: true,
        name: "Alex Rivera", role: "Community Lead",
        bio: "Organizes events and keeps the community running.",
        skills: ["Leadership", "Web Security"],
      },
      {
        id: makeId(), createdAt: now, updatedAt: now, featured: true,
        name: "Sam Okafor", role: "CTF Author",
        bio: "Writes most of the CTF challenges you'll see in the Arena.",
        skills: ["Cryptography", "Reverse Engineering"],
      },
    );

    db.data.testimonials.push(
      {
        id: makeId(), createdAt: now, updatedAt: now, approved: true,
        quote: "This community is where I actually learned how to think like an attacker — and a defender.",
        name: "Jordan T.", role: "Member since 2025",
      },
      {
        id: makeId(), createdAt: now, updatedAt: now, approved: true,
        quote: "The CTF nights are genuinely fun, even when I get completely stuck.",
        name: "Priya S.", role: "Member",
      },
    );

    console.log("Seeded starter content (2 events, 2 projects, 2 members, 2 testimonials) — edit/delete anytime from /admin.html");
  }

  if (isFirstRun) await db.write();
}

// Small id helper so we don't need an extra dependency.
export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
