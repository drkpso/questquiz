# QuestQuiz

A K–12 assessment platform. Grade-matched, mixed-subject assessments across eight
subjects that turn into levels, badges and rewards, with unit-level practice for
20 Advanced Placement courses.

No framework, no bundler, no build dependencies. Plain HTML, CSS and JavaScript.
Node is used only to stitch the files together and to run the tests.

**Production domain:** [www.learnassessment.com](https://www.learnassessment.com)  
**Recommended host:** GitHub → [Railway](https://railway.app) (Namecheap stays the DNS registrar)

**Stack:** static HTML/CSS/JS front end. Railway runs a tiny Node server from the
`Dockerfile` that serves `public/` and a JSON account API under `/api/*`.
Accounts and progress are **server-backed** (file DB under `DATA_DIR`, ideally a
Railway Volume at `/data`). Email verification uses **Resend**.

---

## Quick start

```bash
npm install          # only needed if you want to run the browser tests
npm run preview      # production build at http://127.0.0.1:43123
npm run dev          # builds, serves on http://127.0.0.1:5173, rebuilds on save
npm start            # same server Railway uses (HOST=0.0.0.0, rebuilds public/)
```

To build without serving:

```bash
npm run build           # writes public/
```

To check you haven't broken anything:

```bash
npm run test:content # ~10 seconds, no browser needed — run this constantly
npm test             # adds the full browser suite (needs: npm install)
```

Production env (see `.env.example`):

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Yes (for signup) | Send verification codes by email |
| `EMAIL_FROM` | Yes in prod | e.g. `QuestQuiz <noreply@learnassessment.com>` |
| `DATA_DIR` | Recommended | Persist DB (Docker default `/data` + Railway Volume) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Recommended | Bootstrap platform admin for school approvals |

---

## Try it

The site opens on a public landing page. Click **Try 3 questions** with no account,
or **Create free account** (parent / student 13+ / school). Verification codes are
emailed via Resend — they are never shown on screen.

Children sign in with a **login ID + 4-digit code** set by a parent. Other kids’
profiles are never listed on the child login page.

---

## What is in here

```
src/                  the whole application — edit these
  content.js          maths, English, science, world languages, general knowledge
  subjects.js         computer science, history & civics, creative & arts
  engine.js           question generation, error repetition, scoring, badge art
  ap.js               20 AP courses, units, exam weightings, AP question banks
  store.js            accounts, verification, consent, rewards, progress
  app.js              the interface — landing page, signup, all four roles
  styles.css          the whole visual system, light and dark

scripts/
  build.js            stitches src/ into public/    (no dependencies)
  serve.js            static server + /api router   (no dependencies)
  db.js               JSON file database under DATA_DIR
  api.js              auth, sessions, scoped sync
  email.js            Resend verification mailer

Dockerfile            production image for Railway (includes API + DATA_DIR=/data)
railway.toml          Railway build/deploy settings

test/
  content.test.js     generates ~22,000 questions and checks every one
  browser.test.js     drives the real site in Chromium end to end
  nofonts.test.js     proves the page still works when Google Fonts is blocked

public/               build output — deploy this, do not edit it
docs/                 architecture, content authoring, production checklist
```

**Load order matters.** `content.js` creates the question-bank registry;
`subjects.js` and `ap.js` append to it; `engine.js` reads it lazily; `store.js`
and `app.js` sit on top. `scripts/build.js` encodes that order — if you add a
file, add it there too.

---

## Hosting it

### GitHub → Railway (recommended for www.learnassessment.com)

1. Push this repo to **GitHub**
2. On [railway.app](https://railway.app): **New Project → Deploy from GitHub repo**
3. Railway builds the included `Dockerfile` / `railway.toml` and serves `public/`
4. **Generate Domain** → test `https://….up.railway.app`
5. Add custom domain **`www.learnassessment.com`** → copy Railway’s **CNAME + TXT**
6. In **Namecheap Advanced DNS**: set those records; URL-redirect `@` → `https://www.learnassessment.com`
7. Wait for verification — SSL is automatic

Full steps + checklist: **[docs/RAILWAY.md](docs/RAILWAY.md)** ·
**[docs/RAILWAY-CHECKLIST.md](docs/RAILWAY-CHECKLIST.md)**

You need: GitHub access, a Railway account, Namecheap DNS, Resend (API key +
verified domain), and a Railway Volume mounted at `/data` so accounts survive
redeploys. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` to approve school registrations.

### Other hosts

**Netlify** — connect the repo (build `npm run build`, publish `public`), or just
drag the `public` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
`netlify.toml` is already configured.

**Vercel** — import the repo. `vercel.json` is already configured.

**Cloudflare Pages** — build command `npm run build`, output directory `public`.

**GitHub Pages** — push to `main`; `.github/workflows/deploy.yml` builds and
publishes automatically. Enable it once under Settings → Pages → Source:
GitHub Actions.

**Namecheap cPanel (optional / legacy)** — `npm run pack:namecheap`, upload into
`public_html`. See `docs/NAMECHEAP.md`. Prefer Railway for this domain.

`public/standalone.html` is the entire site as a single file, for when you want to
email it or run it from a USB stick. Rename it to `index.html` if you want to
upload exactly one file.

Serve over HTTPS. Railway and the hosts above provide certificates automatically.

---

## What works, and what does not

**Works today, entirely in the browser, with no server:**

- The public site, the no-signup taster, and all four role interfaces
- Every signup path with its verification step
- Eight subjects, 12,500 question slots per grade band, 20 AP courses, 153 units
- Error repetition — missed questions return reworded until they stick
- Levels, badges, three reward streams, badge wallpaper downloads, print-order queue

**Not wired up, because each needs a third party:**

- **Accounts live in the visitor's own browser** (`localStorage`). Two visitors get
  two unconnected copies; nothing syncs across devices; clearing site data resets
  everything. A real backend is the first thing to add.
- **OTP and email codes** are generated, expired and rate-limited correctly, but
  displayed on screen instead of sent. Needs an SMS gateway and an email provider.
- **COPPA parental consent** is recorded, versioned and auditable — but a checkbox
  is not *verifiable* consent under the rule. Needs a certified provider.
- **Print orders** record but cannot charge. Needs a payment processor and a
  print-on-demand supplier.

`docs/PRODUCTION.md` has the full list with a suggested order.

---

## Two things to keep honest

**18 of the 153 AP units have no questions written yet.** The product does not
pretend otherwise: those units are marked "no items yet", their Practise button is
withdrawn, they are excluded from the "weakest unit" recommendation, and asking for
one returns clearly-labelled mixed practice. The admin console has an **AP unit
coverage** table that is effectively the authoring backlog. Filling those gaps is
content work, not code.

**No question in this repo has been reviewed by a teacher.** Everything is
machine-verified for *form* — correct answer present, no duplicate options, no
broken templates, right grade band — which is not the same as being pedagogically
right or aligned to a state standard. A subject specialist reviewing a sample per
band, and per AP course group, is the highest-value next step.

---

AP is a registered trademark of the College Board, which was not involved in and
does not endorse this product. Unit titles and exam weightings follow the published
course frameworks. The AP exam countdown defaults to 3 May 2027 and is provisional —
confirm the real window with the College Board and change it under
**Admin → Levels & rules**.
