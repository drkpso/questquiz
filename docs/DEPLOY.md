# Hosting

`npm run build` writes `public/`. That folder is a plain static site — no server,
no runtime, no environment variables. Any static host serves it.

---

## Fastest: drag and drop (about two minutes)

1. `npm run build`
2. Open [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag the **`public` folder** onto the page — not the repo, not a zip
4. You get a live HTTPS URL immediately

Make a free account if you want to keep the URL or attach a domain.

---

## Connected to the repo (deploys on every push)

### Netlify
New site → import from Git. `netlify.toml` already sets build `npm run build`
and publish `public`.

### Vercel
Import the repo. `vercel.json` already sets the same.

### Cloudflare Pages
Create a project → connect the repo. Build command `npm run build`, output
directory `public`. Good latency in both India and the US.

### GitHub Pages
Push to `main`. `.github/workflows/deploy.yml` runs the content tests, builds and
publishes. Enable it once: **Settings → Pages → Source: GitHub Actions**.

---

## Traditional hosting (cPanel, FTP, shared hosting)

```bash
npm run build
```

Upload the **contents** of `public/` into `public_html` — `index.html`, the
`assets/` folder, `404.html`. Keep the folder structure; `index.html` looks for
`assets/styles.css` at exactly that path.

---

## Amazon S3 + CloudFront

Upload `public/`, enable static website hosting, set `index.html` as the index
document and `404.html` as the error document. Put CloudFront in front for HTTPS
and a custom domain.

---

## One file, no folder

`public/standalone.html` is the entire site — CSS and JavaScript inlined. Rename
it to `index.html` and upload that single file. Useful for a quick demo, email, or
a USB stick. It is about 370 KB, so first load is slightly slower and nothing can
be cached separately; prefer the multi-file build for a real site.

---

## Custom domain

Every host above supports one free. Add the domain in the host's dashboard, then
point your DNS at it — usually a `CNAME` for `www` and either an `A` record or the
host's apex alias for the root. The host's dashboard gives exact values and
provisions the TLS certificate automatically.

---

## Things that commonly go wrong

**Uploading the zip or the repo instead of `public/`.** The host serves a download
or a directory listing instead of the site.

**Renaming or flattening `assets/`.** `index.html` references
`assets/styles.css`, `assets/app.js` and so on by exact path.

**Uploading `node_modules/`, `test/` or `scripts/`.** Development only. Nothing
there should be on a public server. `.gitignore` already excludes `node_modules`
and `public`.

**Serving over plain HTTP.** Use HTTPS. All the hosts above provide it free.

---

## After it is live

Check these in a real browser, not just locally:

- The homepage loads and the **Try 3 questions** taster generates a question
- Sign in works (`kabir@example.com` / `student123`) and the AP page renders
- The Theme button switches light and dark
- Nothing scrolls sideways on a phone
- A deliberately wrong URL shows the styled 404

If fonts look wrong, the Google Fonts request is being blocked somewhere on the
network — the site falls back to system fonts and still works, which
`npm run test:nofonts` verifies.

---

## Remember what you are hosting

This runs perfectly as a static site, but every account lives in the visitor's own
browser. Two visitors get two separate copies, and a parent who signs up on their
phone will not find that account on their laptop.

It is a complete, working demo — good for showing schools, testing flows and
gathering reactions — but not yet a service people can rely on. See
`docs/PRODUCTION.md`.
