# Namecheap go-live — www.learnassessment.com

QuestQuiz is a **static** site. No Node, PHP, or database is required on the host.
The recommended path is **Namecheap shared hosting (Stellar / cPanel)**: upload the
built files into `public_html`, point DNS at the hosting account, enable SSL.

---

## What you need from Namecheap (user supplies)

These credentials are not in this repo and are required only for the live cutover:

| Item | Where |
|---|---|
| Namecheap account login | [namecheap.com](https://www.namecheap.com/) → Domain List |
| Hosting / cPanel login | Hosting List → Manage → Go to cPanel (or FTP username/password) |
| FTP or File Manager access | cPanel → Files → File Manager / FTP Accounts |
| Confirmation hosting is active for `learnassessment.com` | Same hosting product attached to the domain |

No API keys, env vars, or third-party secrets are required for this static deploy.

---

## 1. Build the upload package (on any machine with Node 18+)

```bash
npm run pack:namecheap
```

Produces:

- `deploy/namecheap/upload/` — contents of `public_html`
- `deploy/namecheap/questquiz-public_html.zip` — same files, zipped

Or build only:

```bash
npm run build
# then upload the contents of public/ (includes .htaccess)
```

---

## 2. DNS (Namecheap Advanced DNS)

In **Domain List → learnassessment.com → Advanced DNS**:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | *your shared hosting IP* (cPanel → Shared IP Address) | Automatic |
| CNAME Record | `www` | `learnassessment.com.` | Automatic |

Remove conflicting parking / old A / URL Redirect records for `@` and `www`.

If you use Namecheap **PremiumDNS** or external DNS, set the same records there.
Propagation is often minutes; allow up to 24 hours.

---

## 3. Upload files (cPanel File Manager)

1. Open **cPanel → File Manager → `public_html`**
2. Delete or move default placeholder files (`index.html`, `cgi-bin` can stay)
3. Upload **`questquiz-public_html.zip`**, then Extract — **or** upload the
   contents of `deploy/namecheap/upload/` so that `public_html/index.html` and
   `public_html/assets/` exist at the top level
4. Confirm `public_html/.htaccess` is present (hidden files: enable “Show Hidden Files”)

Do **not** upload the whole git repo, `src/`, `node_modules/`, or nested folders
that leave `index.html` one level too deep.

---

## 4. SSL

1. cPanel → **SSL/TLS Status** (or AutoSSL)
2. Run AutoSSL / issue Let’s Encrypt for `learnassessment.com` and `www.learnassessment.com`
3. Wait until both names show a valid certificate
4. Visit `https://www.learnassessment.com` — the `.htaccess` redirects HTTP → HTTPS
   and apex → `www`

---

## 5. Optional: Git deploy on VPS

Only if you bought a **VPS** (not typical Stellar shared):

```bash
git clone <this-repo>
cd <repo>
npm run build
# serve public/ with nginx/caddy, or sync public/ to the web root
```

Shared cPanel does not need Node in production.

---

## 6. Verify features after go-live

- Homepage loads; **Try 3 questions** generates an item
- Sign in: `kabir@example.com` / `student123` — student + AP UI
- Theme toggle (light/dark)
- Mobile: no horizontal scroll
- Bad URL shows styled 404
- `http://learnassessment.com` → `https://www.learnassessment.com`

Demo accounts (browser `localStorage` only — see README):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@questquiz.app` | `admin123` |
| Parent | `parent@questquiz.app` | `parent123` |
| School | `office@mapleridge.edu` | `school123` |
| Student | `kabir@example.com` | `student123` |

Child PINs: Aarav `2468`, Kabir `9021`.

---

## Known product limits (not hosting bugs)

Accounts, OTP display-on-screen, and print orders are client-side demo behaviour.
See `docs/PRODUCTION.md`. Hosting on Namecheap does not change that.
