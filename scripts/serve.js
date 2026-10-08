#!/usr/bin/env node
/* Static file server for local preview and Railway production. No dependencies.
   Rebuilds once on start (unless SKIP_BUILD=1), then serves public/.
   Also exposes /api/email/* for Resend-backed verification (optional env).
   Pass --watch to rebuild automatically when anything in src/ changes.
   Railway: set HOST=0.0.0.0 and use the injected PORT (Dockerfile sets both). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const email = require('./email');

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

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

async function handleApi(req, res, rel) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return true;
  }

  if (rel === '/api/email/status' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      configured: email.configured(),
      from: email.configured() ? email.fromAddress() : null
    });
    return true;
  }

  if (rel === '/api/email/send' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = await email.sendVerificationCode({
        email: body.email,
        code: body.code,
        purpose: body.purpose
      });
      sendJson(res, result.ok ? 200 : 400, result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel.startsWith('/api/')) {
    sendJson(res, 404, { ok: false, error: 'Not found' });
    return true;
  }
  return false;
}

http.createServer(async (req, res) => {
  let rel = decodeURIComponent((req.url || '/').split('?')[0]);
  try {
    if (await handleApi(req, res, rel)) return;
  } catch (e) {
    sendJson(res, 500, { ok: false, error: e.message || 'Server error' });
    return;
  }

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
  const mode = email.configured() ? 'Resend email delivery ON' : 'email demo mode (set RESEND_API_KEY to send)';
  console.log(`\n  QuestQuiz running at  http://${HOST}:${PORT}`);
  console.log(`  ${mode}\n`);
});
