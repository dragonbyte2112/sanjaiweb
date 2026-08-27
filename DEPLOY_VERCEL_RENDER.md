# Deploying DragonByte: GitHub → Render (backend) → Vercel (frontend) → your domain

This guide takes your site from "running on my laptop" to a real, live website on
the internet with your own domain. It's in order — do the steps in order.

**Total time:** ~25-30 minutes. All three services (GitHub, Render, Vercel) are free
for this project.

---

## Step 1 — Push the code to GitHub

1. Go to [github.com/new](https://github.com/new) and create a new repository.
   - Name it `dragonbyte-website` (or anything you like)
   - Leave it **Public** or **Private** — either works
   - Do NOT check "Add a README" — we already have one
   - Click **Create repository**

2. GitHub will show you a page with a URL like `https://github.com/YOUR_USERNAME/dragonbyte-website.git`.
   Copy that URL.

3. Open PowerShell, go to the **project folder** (the one you unzipped — it already
   has a git repository set up inside it), and run:

```powershell
cd path\to\project
git remote add origin https://github.com/YOUR_USERNAME/dragonbyte-website.git
git branch -M main
git push -u origin main
```

   Replace the URL with your real repo URL. GitHub will open a browser window asking
   you to sign in the first time — approve it.

✅ **Checkpoint:** refresh your GitHub repo page in the browser — you should see all
your project files there.

> ⚠️ Your `server/.env` file (which will have your Gemini API key once you add one) is deliberately
> **excluded** from git and will NOT be uploaded to GitHub. That's correct and safe —
> you'll re-enter your key directly into Render in Step 2 instead.

---

## Step 2 — Deploy the backend to Render

1. Go to [render.com](https://render.com) and sign up (free — you can sign in with
   your GitHub account, which makes the next step easier).

2. Click **New +** → **Web Service**.

3. Connect your GitHub account if asked, then select your `dragonbyte-website` repo.

4. Fill in the settings:
   | Setting | Value |
   |---|---|
   | **Name** | `dragonbyte-api` (or anything — this becomes part of your URL) |
   | **Root Directory** | `server` |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |

5. Scroll to **Environment Variables** and add these one by one (click "Add
   Environment Variable" for each):

   | Key | Value |
   |---|---|
   | `PORT` | `4000` |
   | `JWT_SECRET` | any long random string, e.g. `dragonbyte-super-secret-2026-change-me` |
   | `ADMIN_USERNAME` | `admin` (or your own choice) |
   | `ADMIN_PASSWORD` | your own admin password — don't leave this as `admin123` in production |
   | `CORS_ORIGIN` | `http://localhost:4000` — **you'll update this in Step 4** once you have your Vercel URL |
   | `GEMINI_API_KEY` | your free Gemini API key from aistudio.google.com/apikey (leave blank to skip the AI widget) |

6. Click **Create Web Service**. Render will build and start your backend — this
   takes a couple of minutes. When it's done, you'll see a green "Live" status and a
   URL like:

   `https://dragonbyte-api.onrender.com`

   **Copy this URL — you need it in the next step.**

> 📝 **Free tier note:** Render's free web services "sleep" after 15 minutes of no
> traffic and take ~30-50 seconds to wake up on the next request. That's fine for a
> community site — visitors just see a short delay on the very first request after
> it's been idle. If that matters to you later, Render's paid tier ($7/mo) keeps it
> always-on.

---

## Step 3 — Point the frontend at your Render backend

1. Open `public-site/assets/js/config.js` in a text editor.
2. Find this line:
   ```js
   const RENDER_API_URL = "https://dragonbyte-api.onrender.com";
   ```
3. Replace it with **your actual Render URL** from Step 2.
4. Save the file, then push the change to GitHub:

```powershell
cd path\to\project
git add public-site/assets/js/config.js
git commit -m "Point frontend at real Render backend URL"
git push
```

---

## Step 4 — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (again, GitHub sign-in is
   easiest).

2. Click **Add New...** → **Project**.

3. Select your `dragonbyte-website` GitHub repo → **Import**.

4. On the configuration screen:
   - **Root Directory** → click Edit, choose `public-site`
   - **Framework Preset** → "Other" (it's a plain static site, no framework needed)
   - Leave Build Command and Output Directory blank/default

5. Click **Deploy**. In about a minute you'll get a live URL like:

   `https://dragonbyte-website.vercel.app`

✅ **Checkpoint:** open that URL — your site should load fully, including the CTF
Arena link, social icons, and the AI assistant widget.

---

## Step 5 — Connect the two: update CORS on Render

Now that your frontend has a real Vercel URL, the backend needs to trust it (or the
browser will block API requests — this is the same "Internal server error" style
issue we fixed earlier, just for a new domain).

1. Go back to your Render dashboard → your `dragonbyte-api` service → **Environment**.
2. Edit the `CORS_ORIGIN` variable to:
   ```
   https://dragonbyte-website.vercel.app
   ```
   (use your actual Vercel URL from Step 4)
3. Save — Render will automatically redeploy with the new setting.

✅ **Checkpoint:** on your live Vercel site, try logging into `/admin` and check that
Events/Projects load on the homepage. If you see errors, double check this value
matches your Vercel URL **exactly** (no trailing slash).

---

## Step 6 — Add your custom domain (dragonbyte.co.in)

You'll point your domain at Vercel (the frontend). The API stays on its Render URL
behind the scenes — visitors never see it directly.

1. In Vercel, open your project → **Settings** → **Domains**.
2. Type `dragonbyte.co.in` and click **Add**. Also add `www.dragonbyte.co.in` if you
   want both to work.
3. Vercel will show you DNS records to add — usually:
   - An **A record** for the root domain pointing to `76.76.21.21`
   - A **CNAME record** for `www` pointing to `cname.vercel-dns.com`
4. Log into wherever you bought `dragonbyte.co.in` (e.g. GoDaddy) → DNS settings →
   add those exact records Vercel showed you.
5. DNS changes can take anywhere from a few minutes to a few hours to go live.
   Vercel's Domains page will show a green checkmark once it detects the change.

6. **One more CORS update:** once your domain is live, go back to Render →
   Environment → update `CORS_ORIGIN` to include your real domain too:
   ```
   https://dragonbyte.co.in,https://www.dragonbyte.co.in,https://dragonbyte-website.vercel.app
   ```
   (comma-separated, no spaces)

---

## Recap: what talks to what

```
Visitor's browser
      │
      ▼
dragonbyte.co.in  ──(Vercel, static frontend)
      │
      │  fetch() calls to /api/...
      ▼
dragonbyte-api.onrender.com  ──(Render, Express backend + your data)
```

## Quick troubleshooting

- **"Failed to fetch" / blank data on the live site** → check `config.js` has your
  real Render URL, and `CORS_ORIGIN` on Render matches your live frontend URL exactly.
- **Admin login "Internal server error"** → same CORS mismatch — double-check Step 5.
- **Site works but AI assistant says "not configured"** → the `GEMINI_API_KEY`
  environment variable is missing or empty on Render (Step 2) — re-check it there,
  not in the old `.env` file (Render doesn't use that file).
- **Changes not showing up live** → both Render and Vercel auto-redeploy on every
  `git push` to `main` — give it a minute, then check the "Deployments" tab on each
  dashboard to see it in progress.
