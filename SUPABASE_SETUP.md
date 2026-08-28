# Setting up Supabase (free database for DragonByte)

Your backend needs somewhere to permanently save data — events, projects,
members, join requests, contact messages, and CTF challenges/solves.
Supabase gives you a free Postgres database with an instant REST API, which
is what makes it possible to run the whole DragonByte backend as serverless
functions on Vercel (Vercel itself can't save files to disk).

This takes about 5 minutes.

---

## 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (GitHub sign-in is
   easiest).
2. Click **New Project**.
3. Pick any name (e.g. `dragonbyte`), set a database password (save it
   somewhere — you likely won't need it again, but just in case), choose the
   region closest to you, and click **Create new project**.
4. Wait about a minute while Supabase provisions it.

## 2. Run the schema

1. In your new project, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase/schema-vercel.sql` from this project in a text editor,
   copy the **entire file**, and paste it into the SQL Editor.
4. Click **Run** (or press Ctrl/Cmd+Enter).
5. You should see a success message and, in the **Table Editor** (left
   sidebar), 10 new tables: `admin`, `events`, `projects`, `contributors`,
   `testimonials`, `members`, `joinRequests`, `messages`, `challenges`,
   `solves`.

## 3. Get your API credentials

1. Go to **Project Settings** (gear icon) → **API**.
2. You need two values:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **service_role secret** — under "Project API keys", click to reveal it.
     This is a powerful key that bypasses all database security rules, which
     is exactly what your backend needs since it manages everything
     (including the CTF flag hashes) directly.

> ⚠️ **Never put the service_role key in any frontend code or commit it to
> GitHub.** It only ever goes into `server/.env` (local) or your Vercel
> project's Environment Variables (deployed) — both of which stay private.
> The schema deliberately has no Row Level Security rules, because only
> your trusted backend (using this key) ever talks to Supabase directly;
> visitors' browsers only ever talk to your own `/api/...` endpoints.

## 4. Add them to your project

**For local development**, open `server/.env` (copy from `server/.env.example`
if you don't have one yet) and fill in:
```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

**For your live Vercel deployment**, add the same two variables in your
Vercel project → **Settings** → **Environment Variables** (covered in
`DEPLOY_VERCEL.md`).

## 5. Verify it worked

Start your server locally:
```powershell
cd server
npm install
npm run dev
```

You should see in the terminal:
```
Seeded admin account -> username: "admin" (password from .env)
Seeded starter content (2 events, 2 projects, 2 members, 2 testimonials) — edit/delete anytime from /admin.html
DragonByte API running at http://localhost:4000
```

Open `http://localhost:4000` — the homepage should show the 2 sample events.
Check the **Table Editor** in Supabase — you should see that data sitting in
the `events` and `projects` tables. That confirms the connection works.

## Troubleshooting

- **"Could not reach Supabase to check the admin account"** in the server
  terminal → double-check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
  both filled in correctly in `.env`, with no extra spaces or quotes.
- **"Database error. Please try again."** on any page → same as above, or
  the schema hasn't been run yet (Step 2).
- **Data doesn't show up** → check the Supabase **Table Editor** directly to
  see if rows are actually there; if yes but the site doesn't show them,
  check the server terminal for errors on that specific request.
