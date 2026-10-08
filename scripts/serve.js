#!/usr/bin/env node
/* Static file server for local preview and Railway production. No dependencies.
   Rebuilds once on start (unless SKIP_BUILD=1), then serves public/.
   Pass --watch to rebuild automatically when anything in src/ changes.
   Railway: set HOST=0.0.0.0 and use the injected PORT (Dockerfile sets both). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || '0.0.0.0';
const WATCH = process.argv.includes('--watch');
const SKIP_BUILD = process.env.SKIP_BUILD === '1' || process.env.SKIP_BUILD === 'true';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function build() {
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
    return true;
  } catch (e) {
    console.error('Build failed — fix the error above and save again.');
    return false;
  }
}

if (SKIP_BUILD) {
  if (!fs.existsSync(path.join(DIR, 'index.html'))) {
    console.error('SKIP_BUILD set but public/index.html is missing.');
    process.exit(1);
  }
} else {
  build();
}

if (WATCH) {
  let timer = null;
  fs.watch(path.join(ROOT, 'src'), { recursive: true }, (_, file) => {
    clearTimeout(timer);
    timer = setTimeout(() => { console.log('\nchanged: ' + file); build(); }, 120);
  });
  console.log('Watching src/ for changes.');
}

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  // Resolve inside public/ only — never serve a path that escapes it.
  const file = path.join(DIR, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(DIR)) { res.writeHead(403).end('Forbidden'); return; }

  fs.readFile(file, (err, buf) => {
    if (err) {
      fs.readFile(path.join(DIR, '404.html'), (e2, nf) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(e2 ? 'Not found' : nf);
      });
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}).listen(PORT, HOST, () => {
  console.log(`\n  QuestQuiz running at  http://${HOST}:${PORT}\n`);
});
