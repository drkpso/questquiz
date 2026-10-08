#!/usr/bin/env node
/* ============================================================
   QuestQuiz build
   Reads  src/
   Writes public/            a normal multi-file site (deploy this)
          public/standalone.html  the whole site as one file

   No bundler, no transpiler, no dependencies. The source files are
   already browser-ready; this script only wires them into a page and
   writes the HTML shell around them.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'public');

/* Load order matters and is the one thing you must keep right:
   content  -> defines the bank registry and the core subjects
   subjects -> appends CS / History / Arts to that registry
   engine   -> question generation (reads the registry lazily)
   ap       -> appends AP banks and families, defines the courses
   store    -> accounts, consent, progress (needs engine + ap)
   app      -> the interface (needs everything above)            */
const JS = ['content.js', 'subjects.js', 'engine.js', 'ap.js', 'store.js', 'app.js'];

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const CSS = read('styles.css');

const FONTS = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;600&display=swap';

/* Favicon as an inline SVG so the site needs no extra request or file. */
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a3d"/><stop offset="1" stop-color="#6b4fe0"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#g)"/><text x="32" y="45" text-anchor="middle" font-family="Verdana,sans-serif" font-weight="bold" font-size="36" fill="#fff">Q</text></svg>`
);

/* Base reset. Keep the :root safe-area padding — it is what lets the page run
   edge to edge on a phone while clearing the notch and the home indicator. */
const RESET = `
    :root { color-scheme: light dark; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
    body { margin: 0; }
    img { max-width: 100%; }
    [hidden] { display: none !important; }
`;

const TITLE = 'QuestQuiz — learning that feels like a quest';
const DESC = 'Grade-matched assessments for Kindergarten through Grade 12 across eight subjects, with levels, badges, partner-funded rewards and unit-level practice for 20 AP courses. No advertising.';

function page(styleTag, scriptTag) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLE}</title>
<meta name="description" content="${DESC}">
<meta name="theme-color" content="#eef3ff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d1524" media="(prefers-color-scheme: dark)">
<meta property="og:title" content="QuestQuiz">
<meta property="og:description" content="Learning that feels more like a quest. K-12 assessments across eight subjects, levels and badges, plus 20 AP courses with unit-level practice. No ads.">
<meta property="og:type" content="website">
<link rel="icon" href="${FAVICON}">
<link rel="apple-touch-icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
${styleTag}
</head>
<body>

<div id="app"></div>
<div class="toast-host" id="toasts" aria-live="polite"></div>

<noscript>
  <div style="max-width:40rem;margin:3rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.6">
    <h1>QuestQuiz needs JavaScript</h1>
    <p>The assessments, the level map and the AP practice all run in your browser, so JavaScript has to be switched on. Enable it and reload this page.</p>
  </div>
</noscript>

${scriptTag}
</body>
</html>
`;
}

/* ---------- clean ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

/* ---------- multi-file build (the one you deploy) ---------- */
fs.writeFileSync(
  path.join(OUT, 'index.html'),
  page(`<link rel="stylesheet" href="assets/styles.css">`,
    JS.map(f => `<script src="assets/${f}"></script>`).join('\n'))
);
fs.writeFileSync(path.join(OUT, 'assets', 'styles.css'), RESET + '\n' + CSS);
JS.forEach(f => fs.writeFileSync(path.join(OUT, 'assets', f), read(f)));

/* ---------- single-file build (handy for email, USB, a quick demo) ---------- */
fs.writeFileSync(
  path.join(OUT, 'standalone.html'),
  page(`<style>${RESET}\n${CSS}</style>`,
    `<script>\n${JS.map(f => `/* ===== ${f} ===== */\n${read(f)}`).join('\n')}\n</script>`)
);

/* ---------- 404 ---------- */
fs.writeFileSync(path.join(OUT, '404.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found — QuestQuiz</title>
<link rel="icon" href="${FAVICON}">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#eef3ff;color:#15223c;
font-family:system-ui,sans-serif;text-align:center;padding:1rem}
@media(prefers-color-scheme:dark){body{background:#0d1524;color:#e8eeff}}
a{color:#d9481f;font-weight:700}</style></head>
<body><div><h1 style="font-size:3rem;margin:0">404</h1>
<p>That page is not here. <a href="/">Back to QuestQuiz</a></p></div></body></html>
`);

/* GitHub Pages otherwise runs the output through Jekyll, which skips files
   beginning with an underscore. Harmless here, but cheap insurance. */
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

/* Cache headers for hosts that read them (Netlify, Cloudflare Pages).
   The HTML must never be cached hard or visitors get a stale app shell. */
fs.writeFileSync(path.join(OUT, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN

/assets/*
  Cache-Control: public, max-age=86400

/index.html
  Cache-Control: public, max-age=0, must-revalidate
`);

/* Apache / Namecheap cPanel: HTTPS, www canonical host, 404, cache headers. */
const HTACCESS_SRC = path.join(ROOT, 'deploy', 'namecheap', '.htaccess');
if (fs.existsSync(HTACCESS_SRC)) {
  fs.copyFileSync(HTACCESS_SRC, path.join(OUT, '.htaccess'));
}

const kb = n => (n / 1024).toFixed(1) + ' KB';
const size = p => kb(fs.statSync(p).size);
console.log('Built public/');
console.log('  index.html        ' + size(path.join(OUT, 'index.html')));
fs.readdirSync(path.join(OUT, 'assets')).sort().forEach(f =>
  console.log('  assets/' + f.padEnd(12) + ' ' + size(path.join(OUT, 'assets', f))));
console.log('  standalone.html   ' + size(path.join(OUT, 'standalone.html')) + '  (whole site in one file)');
console.log('  404.html, _headers, .nojekyll' + (fs.existsSync(path.join(OUT, '.htaccess')) ? ', .htaccess' : ''));
