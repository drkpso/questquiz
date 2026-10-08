# Deploy QuestQuiz on Railway (from GitHub)

**Domain:** https://www.learnassessment.com  
**Stack:** static HTML/CSS/JS served by a tiny Node static server (no database).

Railway builds the `Dockerfile`, which runs `npm run build` → `public/`, then
serves it on `0.0.0.0:$PORT`. SSL is automatic once DNS verifies.

---

## What you must supply

| Item | Why |
|---|---|
| GitHub account + repo with this code | Railway deploys from GitHub |
| Railway account | Hosting + free `*.up.railway.app` URL |
| Namecheap login for `learnassessment.com` | Point DNS at Railway (CNAME + TXT) |

No app env vars or API tokens are required for the static site itself.
A Railway API token is optional (CLI only); the dashboard flow is enough.

---

## 1. Put the code on GitHub

1. Create a GitHub repository (public or private).
2. Push this project (or merge the hosting branch), for example:

```bash
git remote add github https://github.com/<you>/<repo>.git   # if needed
git push -u github main
```

If you are still on the Cursor agent temporary remote, **Create repo** in the
agent UI (or push to your own GitHub remote), then connect that GitHub repo in
Railway.

---

## 2. Create the Railway service from GitHub

1. Sign in at [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → authorize Railway → select this repository
3. Railway reads `railway.toml` + `Dockerfile` automatically
4. Open the service → **Settings → Networking → Generate Domain**  
   You get something like `https://questquiz-production-xxxx.up.railway.app`
5. Confirm a successful deploy (Build logs show `Built public/`, deploy is Live)

Optional CLI (needs `RAILWAY_TOKEN` or `railway login`):

```bash
npm i -g @railway/cli
railway login
railway init
railway up
railway domain
```

---

## 3. Custom domain + SSL (www.learnassessment.com)

1. In the Railway service → **Settings → Networking → Custom Domain**
2. Add **`www.learnassessment.com`**
3. Railway shows two records — **both are required**:
   - **CNAME** — host `www` → value like `xxxx.up.railway.app` (use the exact target Railway shows)
   - **TXT** — verification host/value exactly as shown (domain stays pending without this)

4. In **Namecheap → Domain List → learnassessment.com → Advanced DNS**, add those
   records. Remove old A/CNAME/URL-redirect conflicts for `www`.

5. Wait for Railway to show the domain as verified. SSL (Let’s Encrypt) is issued
   automatically — no separate SSL panel.

### Apex `learnassessment.com` (recommended redirect)

Railway does **not** publish a static IP for A records. For the bare domain:

**Option A — Namecheap URL Redirect (simplest for most Namecheap accounts)**

| Type | Host | Value |
|---|---|---|
| URL Redirect (Permanent 301) | `@` | `https://www.learnassessment.com` |

Keep the live site on `www` only.

**Option B — ALIAS / CNAME flattening** (if your DNS product supports it, e.g. some
PremiumDNS setups): add `learnassessment.com` as a second custom domain in Railway
and create the ALIAS/ANAME + TXT records Railway displays. Standard Namecheap
BasicDNS often cannot CNAME the apex — use Option A.

---

## 4. Exact DNS checklist (Namecheap registrar → Railway)

After Railway shows targets (replace with your dashboard values):

| Type | Host | Value | Notes |
|---|---|---|---|
| CNAME | `www` | `<your-service>.up.railway.app` | From Railway custom domain panel |
| TXT | *(as Railway shows)* | *(verification token)* | Required for ownership check |
| URL Redirect | `@` | `https://www.learnassessment.com` | Apex → www (Option A) |

Propagation: often minutes; up to 24–72 hours.

```bash
dig www.learnassessment.com CNAME +short
dig learnassessment.com +short   # redirect/ALIAS behaviour varies
```

---

## 5. Railway Variables + Volume

| Variable | Notes |
|---|---|
| `RESEND_API_KEY` | Required for parent/student email verification |
| `EMAIL_FROM` | e.g. `QuestQuiz <noreply@learnassessment.com>` |
| `DATA_DIR` | Default `/data` in the image — mount a Volume there |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin for school approvals |

Create a Railway Volume, mount path `/data`, redeploy.

## 6. Verify go-live

- `https://www.learnassessment.com` — homepage, **Try 3 questions**, theme
- `GET /api/status` → `serverBacked: true`, `emailConfigured: true`
- Create a real parent account → code arrives by email only (not on screen)
- Child login requires login ID + code (no profile listing)
- Bad path → styled 404
- Apex redirect (if configured) → `https://www.learnassessment.com`

---

## Local parity with production

```bash
npm run build
SKIP_BUILD=1 HOST=0.0.0.0 PORT=43123 npm start
# or:
npm run preview
```

Docker (same as Railway):

```bash
docker build -t questquiz .
docker run --rm -p 43123:8080 questquiz
```

---

## Reminder

Accounts stay in browser `localStorage`. Railway hosting does not add a shared
backend — see `docs/PRODUCTION.md`.
