# DragonByte — Website + Backend

A cybersecurity community website. **Plain HTML, CSS, and JavaScript frontend** (no build tools, no framework, no npm install needed for the frontend) served directly by an Express + JWT backend with its own JSON database. No mock data — events, projects, contributors, testimonials, members, join applications, contact messages, and CTF challenges are all stored and managed through a working Admin panel.

## Project structure

```
.
├── public-site/           ← Frontend — PLAIN HTML/CSS/JS, open and edit directly
│   ├── index.html           Home
│   ├── about.html, community.html, learn.html
│   ├── events.html, projects.html
│   ├── join.html, contact.html
│   ├── ctf.html, ctf-leaderboard.html
│   ├── admin.html
│   └── assets/
│       ├── css/style.css     ← all styling lives here
│       ├── js/api.js          ← fetch wrapper talking to the backend
│       ├── js/layout.js       ← shared navbar/footer injection
│       ├── js/home.js, ctf.js, admin.js
│       └── img/logo-icon.png, logo-full.png
├── server/                ← Backend (Express + JWT + JSON database)
│   ├── src/
│   │   ├── index.js          ← server entry point — serves the API AND public-site/
│   │   ├── db.js              ← lowdb (JSON file) database setup
│   │   ├── auth.js            ← JWT sign/verify middleware
│   │   └── routes/            ← one file per resource
│   └── data/db.json           ← the actual database file (auto-created, gitignored)
├── supabase/schema.sql    ← SQL schema if you migrate to Supabase (see SUPABASE_SETUP.md)
└── SUPABASE_SETUP.md      ← guide to swap the JSON database for Supabase (Postgres)
```

## 1. Install

You only need Node.js for the **backend**. The frontend is plain files — nothing to install or build.

```bash
cd server
npm install
```

## 2. Configure

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set your own admin login and a random `JWT_SECRET`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-real-password
JWT_SECRET=some-long-random-string
```

This account is created **once**, the first time the server starts. If you change these values later, delete `server/data/db.json` to reseed (this wipes all data).

## 3. Run

```bash
cd server
npm run dev
```

That's it — **one server does everything**. Open **http://localhost:4000** and you'll see the site. The API lives at `http://localhost:4000/api/...`. No separate frontend process, no CORS setup needed, since everything is same-origin.

## 4. Edit the frontend

Every page is a plain `.html` file in `public-site/`. Open any of them in VS Code and edit directly:
- Text/layout → edit the `.html` file
- Colors/spacing/fonts → edit `public-site/assets/css/style.css` (uses CSS variables at the top: `--primary`, `--background`, `--font-heading`, etc.)
- Page behavior (fetching data, forms) → edit the matching file in `public-site/assets/js/`

Just save and refresh your browser — no build step, no compiling.

## 5. Use the Admin panel

Go to **http://localhost:4000/admin.html** and sign in with the username/password from `server/.env`.

From there you can:
- Create/edit/delete **Events** and **Projects** (with a "Published" toggle — unpublished items are hidden from the public site)
- Manage **Contributors** shown on the homepage
- Create and manage **CTF Challenges** (flag stored hashed, never shown again after saving)
- Review, **approve or reject Join applications** (approving auto-creates a Member)
- Read and manage **Contact messages**
- Approve **Testimonials** for the homepage
- Change the admin password under **Settings**

## CTF system

- Public **`/ctf.html`** — challenges by category, point value, difficulty badge. Visitors enter a handle and a flag to submit; correct flags are recorded once per handle per challenge.
- Public **`/ctf-leaderboard.html`** — ranked by points.
- Flags are bcrypt-hashed server-side and never returned in any API response.

## Deploying

Deploy the whole `server/` folder (which also serves `public-site/`) to any Node host (Railway, Render, a VPS, etc.) — one process serves both the site and the API. Point your domain at it and you're done; no separate static hosting needed.

## Using Supabase instead of the built-in JSON database

See **`SUPABASE_SETUP.md`** for a full step-by-step guide to move the database (and optionally auth) to Supabase.

## Notes

- The database is a single JSON file (`server/data/db.json`) via [lowdb](https://github.com/typicode/lowdb) by default — no external database server required.
- Passwords are hashed with bcrypt; admin sessions use JWTs (12h expiry).
