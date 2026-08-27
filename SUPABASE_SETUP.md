# Connecting DragonByte to Supabase

This replaces the built-in JSON-file database (and the Express server entirely, if you want) with a hosted Supabase Postgres database. The frontend (`public-site/`) talks to Supabase directly from the browser using `supabase-js` — no Node server required at all, if you deploy the static files anywhere (Netlify, Vercel, GitHub Pages, S3, etc.).

Everything below is copy-paste. Total time: ~15 minutes.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign in → **New project**.
2. Pick an organization, name it (e.g. `dragonbyte`), set a database password (save it somewhere), pick a region close to your users, and click **Create new project**. Wait ~2 minutes for it to spin up.

## 2. Run the database schema

1. In your Supabase project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/schema.sql` from this project, copy the **entire file**, paste it into the SQL editor, and click **Run**.
3. You should see "Success. No rows returned." This created:
   - All 9 tables (`events`, `projects`, `contributors`, `testimonials`, `members`, `join_requests`, `messages`, `challenges`, `solves`)
   - Row Level Security policies (public can read published content and submit join/contact/CTF-flag requests; only a signed-in admin can write)
   - 3 views (`public_challenges`, `admin_challenges`, `leaderboard`) that hide the CTF flag hash from every client, including the admin panel
   - 5 functions (`admin_create_challenge`, `admin_update_challenge`, `submit_flag`, `admin_approve_join_request`, `admin_stats`) that run flag-hashing and flag-checking safely on the server, so the plaintext flag never needs to reach the browser bundle

You can double check by going to **Table Editor** in the sidebar — you should see all 9 tables, empty.

## 3. Create your admin account

Supabase Auth manages the admin login (replacing the old `server/.env` username/password).

1. Go to **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter an email (this becomes your admin "username" — the login form asks for this) and a password. Leave "Auto Confirm User" checked.
3. Click **Create user**.

That's your only admin account. The RLS policies in `schema.sql` treat **any signed-in user as an admin** — don't enable public sign-ups (Authentication → Providers → make sure email sign-ups aren't exposed anywhere in the frontend, which they aren't by default here since there's no public registration page).

## 4. Get your API keys

Go to **Project Settings** (gear icon) → **API**. You need two values:
- **Project URL** (looks like `https://abcdefgh.supabase.co`)
- **anon public** key (a long string under "Project API keys")

## 5. Configure the frontend

```bash
cd public-site/assets/js
cp supabase-config.example.js supabase-config.js
```

Open `supabase-config.js` and paste in your values:

```js
window.SUPABASE_URL = "https://abcdefgh.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGexcamplekey...";
```

This file is safe to ship in a static site — the anon key only grants what your RLS policies allow (read published content, submit forms, and nothing else, until you're signed in as admin).

## 6. Switch every page to the Supabase client

Each `.html` file currently loads:
```html
<script src="/assets/js/api.js"></script>
```

Replace that one line with these three, **in this order**, in every `.html` file (`index.html`, `about.html`, `community.html`, `learn.html`, `events.html`, `projects.html`, `join.html`, `contact.html`, `ctf.html`, `ctf-leaderboard.html`, `admin.html`):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="/assets/js/supabase-config.js"></script>
<script src="/assets/js/supabase-client.js"></script>
```

Everything else — `layout.js`, `home.js`, `ctf.js`, `admin.js`, and the inline scripts in `events.html`/`projects.html`/`join.html`/`contact.html`/`ctf-leaderboard.html` — needs **no changes**. They all call `Api.get(...)`, `Api.post(...)`, etc., and `supabase-client.js` implements those same method names against Supabase instead of the old Express API.

**One small required edit** — `admin.js`'s login check needs to `await` the Supabase session instead of checking it synchronously. Open `public-site/assets/js/admin.js`, find this block at the very bottom:

```js
// ── Init ──

document.addEventListener("DOMContentLoaded", () => {
  if (Api.isAuthed()) showAdminShell();
  else showLoginScreen();
});
```

Replace it with:

```js
// ── Init ──

document.addEventListener("DOMContentLoaded", async () => {
  await Api.init();
  if (Api.isAuthed()) showAdminShell();
  else showLoginScreen();
});
```

(`Api.init()` is a no-op if you're still using the old `api.js`, so this edit is also safe to make even before switching — but it's only *required* once you switch to `supabase-client.js`.)

## 7. Log in

Open `admin.html`. In the **Username** field, enter the **email** you created in step 3 (Supabase Auth logs in with email, not a separate username). Enter the password. You're in.

## 8. You're done — do you still need the Express server?

No, if you don't want it. With Supabase, the frontend talks directly to your Postgres database from the browser. You can now:
- Deploy just the `public-site/` folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 + CloudFront) — drag-and-drop the folder or connect a git repo.
- Delete or ignore the `server/` folder entirely, or keep it around if you'd rather stay on the JSON-file backend for local development and use Supabase only in production (in that case, keep two versions of your `.html` files' script tags, or use a small build step to swap them — not covered here, since the whole point of this stack is no build step).

## How the CTF flag security works

The trickiest part of a client-only (no backend) CTF system is: **how do you check a flag without ever sending the correct answer to the browser?**

- The `challenges` table has no `SELECT` policy at all — nobody, not even a signed-in admin, can query it directly.
- Public and admin challenge lists go through the `public_challenges` / `admin_challenges` **views**, which simply don't include the `flag_hash` column — it's not filtered out at the app layer, it's structurally absent from what's queryable.
- Checking a submitted flag happens inside the `submit_flag()` Postgres function, which runs `SECURITY DEFINER` (with elevated rights) entirely inside the database — it compares the flag using `crypt()` server-side and only ever returns a point total, never the correct flag or its hash.
- Creating/editing a challenge's flag also happens inside a function (`admin_create_challenge` / `admin_update_challenge`), which hashes the plaintext flag with `crypt(flag, gen_salt('bf'))` before it's stored — the raw flag is never written to any table.

This is the same security property the original Express + bcrypt backend had — it just now lives in Postgres functions instead of Node route handlers.

## Troubleshooting

- **"Not authorized" errors on admin actions** → you're not signed in, or your session expired (Supabase JWT sessions last 1 hour by default, auto-refreshed while the tab is open — if you left it open overnight, just log in again).
- **Empty lists everywhere, even after adding content** → check the browser console for RLS errors; double-check you ran the *entire* `schema.sql` file including the `grant` statements at the bottom of each view/function block.
- **Login fails with "Invalid login credentials"** → the "Username" field must be the exact email you created in Authentication → Users, not a made-up username.
- **CORS errors** → shouldn't happen; Supabase's API allows browser requests from any origin by default. If you see this, double check `SUPABASE_URL` doesn't have a trailing slash or typo.
