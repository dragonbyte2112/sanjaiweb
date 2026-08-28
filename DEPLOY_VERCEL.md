# Deploying DragonByte: everything on Vercel

This puts your entire site — frontend AND backend — on Vercel, with
Supabase as the database. One place to manage, one URL, your custom domain.

**Total time:** ~20 minutes. Both Vercel and Supabase are free for this
project.

**Do these in order:**
1. Set up Supabase (database) — see `SUPABASE_SETUP.md` first if you haven't
   already.
2. Push to GitHub
3. Deploy to Vercel
4. Add your custom domain

---

## Before you start: Supabase

If you haven't already, follow `SUPABASE_SETUP.md` to create your free
Supabase project and run `supabase/schema-vercel.sql`. Keep your **Project
URL** and **service_role key** handy — you'll paste them into Vercel in
Step 3 below.

---

## Step 1 — Push the code to GitHub

1. Go to [github.com/new](https://github.com/new), sign in as **the account
   you want to own this repo**, name it `dragonbyte-website`, and click
   **Create repository** (don't check "Add a README").

2. Copy the repo URL it shows you (`https://github.com/YOUR_USERNAME/dragonbyte-website.git`).

3. In PowerShell, in the project folder:

```powershell
cd path\to\project
git remote add origin https://github.com/YOUR_USERNAME/dragonbyte-website.git
git branch -M main
git push -u origin main
```

If it says `remote origin already exists`, use this instead:
```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/dragonbyte-website.git
git push -u origin main
```

> ⚠️ **Sign in as the right account.** If `git push` fails with `Permission
> denied to SOME_OTHER_USERNAME`, it means Windows is signed into GitHub as
> a different account than the one that owns the repo. Either create the
> repo under the account Windows is already signed into, or sign out and
> back in as the right one (Windows Credential Manager → search "git" →
> remove the saved GitHub entry, then push again to be prompted fresh).

✅ **Checkpoint:** refresh your GitHub repo page — you should see all your
project files, including `api/`, `public-site/`, `server/`, and `supabase/`.

> Your `server/.env` (with real secrets) is excluded from git — it will NOT
> be uploaded. You'll re-enter those values directly into Vercel in Step 3.

---

## Step 2 — Import the project into Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (GitHub sign-in is
   easiest).
2. Click **Add New...** → **Project**.
3. Select your `dragonbyte-website` repo → **Import**.
4. On the configuration screen:
   - **Root Directory** → leave as `.` (the repo root — do NOT set it to
     `public-site`, unlike an earlier version of this guide. The root needs
     to stay `.` so Vercel can also find the `/api` folder.)
   - **Framework Preset** → "Other"
   - Leave Build Command and Output Directory as default (they're already
     set correctly by `vercel.json` in the repo)

## Step 3 — Add your environment variables

Still on that same configuration screen (or afterwards, in **Settings** →
**Environment Variables**), add:

| Key | Value |
|---|---|
| `JWT_SECRET` | any long random string, e.g. `dragonbyte-super-secret-2026-change-me` |
| `ADMIN_USERNAME` | `admin` (or your own choice) |
| `ADMIN_PASSWORD` | your own admin password — don't leave this as `admin123` in production |
| `SUPABASE_URL` | your Supabase Project URL from `SUPABASE_SETUP.md` |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key from `SUPABASE_SETUP.md` |
| `CORS_ORIGIN` | leave blank for now — you'll set this in Step 5 |

Click **Deploy**. In about a minute you'll get a live URL like:

`https://dragonbyte-website.vercel.app`

✅ **Checkpoint:** open that URL — your homepage should load with the 2
sample events and projects (seeded automatically on first request). Try
logging into `/admin` with the `ADMIN_USERNAME`/`ADMIN_PASSWORD` you set
above.

---

## Step 4 — Verify the API is working

Open `https://YOUR-VERCEL-URL.vercel.app/api/health` directly in your
browser — it should show `{"ok":true}`. If instead you get a 404, the most
likely cause is the **Root Directory** setting from Step 2 — go to your
Vercel project → **Settings** → **General** → **Root Directory** and make
sure it's set to `.` (or empty/blank), then redeploy (**Deployments** tab →
"..." on the latest one → **Redeploy**).

---

## Step 5 — Update CORS to your real domain

1. In Vercel, go to your project → **Settings** → **Environment Variables**.
2. Edit `CORS_ORIGIN` to your real Vercel URL:
   ```
   https://dragonbyte-website.vercel.app
   ```
3. Save, then go to **Deployments** → redeploy the latest one so the new
   value takes effect.

(Since the frontend and API are on the same domain now, this mostly matters
for extra safety — but it's still good practice to set it correctly.)

---

## Step 6 — Add your custom domain (dragonbyte.co.in)

1. In Vercel, open your project → **Settings** → **Domains**.
2. Type `dragonbyte.co.in` and click **Add**. Add `www.dragonbyte.co.in` too
   if you want both to work.
3. Vercel shows you DNS records to add — usually:
   - An **A record** for the root domain → `76.76.21.21`
   - A **CNAME record** for `www` → `cname.vercel-dns.com`
4. Log into wherever you bought `dragonbyte.co.in` (e.g. GoDaddy) → DNS
   settings → add those exact records.
5. DNS changes can take a few minutes to a few hours. Vercel's Domains page
   shows a green checkmark once it's live.
6. **Update CORS again** with your real domain:
   ```
   https://dragonbyte.co.in,https://www.dragonbyte.co.in,https://dragonbyte-website.vercel.app
   ```
   (comma-separated, no spaces) — then redeploy.

---

## Recap: what talks to what

```
Visitor's browser
      │
      ▼
dragonbyte.co.in  ──(Vercel: static frontend + /api serverless functions)
      │
      │  same-domain fetch() calls to /api/...
      ▼
Your Supabase project  ──(persistent Postgres database)
```

One deployment, one dashboard, one domain — no second hosting service
needed.

## Quick troubleshooting

- **Site loads but no data shows / "Database error"** → check `SUPABASE_URL`
  and `SUPABASE_SERVICE_ROLE_KEY` in Vercel's Environment Variables are
  correct, and that you ran `supabase/schema-vercel.sql` (see
  `SUPABASE_SETUP.md`).
- **`/api/health` returns 404** → Root Directory in Vercel isn't set to `.`
  — see Step 4.
- **Admin login "Internal server error"** → check `CORS_ORIGIN` matches
  your live URL exactly (Step 5), and that `JWT_SECRET` is set.
- **Changes not showing up live** → Vercel auto-redeploys on every
  `git push` to `main` — check the **Deployments** tab to watch it happen.
- **Local dev still works the same as before** — `cd server && npm install
  && npm run dev` — just make sure `server/.env` also has your
  `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` filled in (same values as
  Vercel).
