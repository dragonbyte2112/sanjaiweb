# Deploying DragonByte — Netlify + Supabase + your GoDaddy domain

This site is now fully static (`public-site/`) and talks directly to Supabase from the browser — there's no Node server to host. This guide covers: hosting the static files on Netlify (free), and pointing your existing domain `dragonbyte.co.in` (managed on GoDaddy) at it.

**Do this in order:** Supabase first (steps 1), then Netlify (steps 2–4), then GoDaddy DNS (step 5). Total time: ~20 minutes, plus DNS propagation (can take up to a few hours, usually much faster).

---

## 1. Set up Supabase (if you haven't already)

Follow `SUPABASE_SETUP.md` in this project first — run the schema, create your admin account, and get your Project URL + anon key. Then fill them into:

```
public-site/assets/js/supabase-config.js
```

```js
window.SUPABASE_URL = "https://your-project-ref.supabase.co";
window.SUPABASE_ANON_KEY = "your-actual-anon-key";
```

Every page in `public-site/` is already wired to load `supabase-client.js` instead of the old `api.js` — no further code changes needed.

## 2. Create a Netlify account

Go to [netlify.com](https://netlify.com) → **Sign up** (GitHub, GitLab, email — any works) → verify your email.

## 3. Deploy the site

**Easiest way — drag and drop, no git required:**

1. In the Netlify dashboard, go to **Sites** → you'll see a box that says *"Drag and drop your site output folder here"*.
2. Open your project on your computer, and drag the **`public-site` folder** (the folder itself, not its contents individually) onto that box.
3. Netlify uploads it and gives you a live URL immediately, like `https://random-name-123.netlify.app`. Open it and confirm the site loads and pages work.

**Alternative — connect a GitHub repo (better if you'll keep editing):**

1. Push this project to a GitHub repository.
2. In Netlify: **Add new site** → **Import an existing project** → connect GitHub → pick your repo.
3. Set **Base directory** to `public-site` and **Publish directory** to `public-site` (or just `.` if your repo root *is* `public-site`).
4. Leave the build command empty — there's nothing to build.
5. Click **Deploy**. Every future `git push` auto-redeploys.

Either way, once deployed, click around the live Netlify URL and confirm:
- Home page loads and shows the hero graphic
- `/ctf.html` loads challenges (once you've added some in `/admin.html`)
- `/admin.html` lets you log in with the Supabase admin account you created

## 4. Rename the site (optional but recommended)

In Netlify: **Site configuration** → **Change site name** → set something like `dragonbyte` so your temporary URL becomes `https://dragonbyte.netlify.app`. Not required, but makes the next step easier to follow.

## 5. Connect your GoDaddy domain

### 5a. Add the domain in Netlify

1. In your Netlify site → **Domain management** → **Add a domain**.
2. Enter `dragonbyte.co.in` → **Verify** → **Add domain**.
3. Netlify will show you DNS records to add. It usually offers two options — **use these exact values** (Netlify will display your specific ones; the pattern is):
   - An **A record** for the root domain (`@`) pointing to Netlify's load balancer IP: `75.2.60.5`
   - A **CNAME record** for `www` pointing to your Netlify site: `dragonbyte.netlify.app`

   (Netlify's dashboard shows the current, authoritative values for your account — always copy them from there rather than this guide, in case they change.)

### 5b. Add those records in GoDaddy

1. Log into [godaddy.com](https://godaddy.com) → **My Products** → find `dragonbyte.co.in` → **DNS** (or **Manage DNS**).
2. You'll see a records table. **Edit or add**:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | A | @ | `75.2.60.5` (or whatever Netlify showed you) | 1 hour |
   | CNAME | www | `dragonbyte.netlify.app` (or whatever Netlify showed you) | 1 hour |

3. If GoDaddy already has an **A record** or **CNAME** for `@` or `www` (often pointing to GoDaddy's default parking page), **edit the existing one** rather than adding a duplicate — most DNS providers reject duplicate records for the same name.
4. Save changes.

### 5c. Wait for DNS + enable HTTPS

1. DNS changes can take anywhere from a few minutes to a few hours to propagate. You can check progress at [dnschecker.org](https://dnschecker.org) by entering `dragonbyte.co.in`.
2. Back in Netlify → **Domain management**, once it detects the DNS records are correct, it automatically provisions a free HTTPS certificate (via Let's Encrypt) — this can take up to an hour after DNS resolves.
3. Once done, `https://dragonbyte.co.in` serves your site directly, with a padlock.

### 5d. (Optional) Redirect the old site

If `dragonbyte.co.in` currently points at your old hosting (the Express/PHP/whatever ran the original site), replacing its DNS records as above **replaces that site entirely** with this new one — there's no way to run both at the same domain simultaneously. Make sure you're ready to fully cut over before changing the DNS records, and keep a backup/export of the old site's data if you need it.

---

## Troubleshooting

- **Site loads but shows no events/challenges** → you haven't added any yet — log into `/admin.html` and create some, or double check `supabase-config.js` has your real project URL/key (not the placeholder values).
- **"Failed to fetch" errors in the browser console** → usually means `supabase-config.js` still has placeholder values, or you haven't run `supabase/schema.sql` yet.
- **Domain shows Netlify's "DNS verification" pending for a long time** → double-check you edited (not duplicated) any existing `@`/`www` records in GoDaddy, and that you copied the exact values Netlify's dashboard shows you (they're specific to your account).
- **HTTPS padlock missing after DNS resolves** → give Netlify's automatic certificate provisioning up to an hour; if it's still missing after that, go to Domain management → HTTPS → **Verify DNS configuration** to retrigger it.
