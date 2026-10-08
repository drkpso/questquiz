#!/usr/bin/env node
/* Build public/, then stage a ready-to-FTP folder + zip for Namecheap cPanel. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const STAGE = path.join(ROOT, 'deploy', 'namecheap', 'upload');
const ZIP = path.join(ROOT, 'deploy', 'namecheap', 'questquiz-public_html.zip');

execFileSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'inherit' });

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name === '.nojekyll' || name === '_headers') continue; // Netlify/GH Pages only
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

copyTree(PUBLIC, STAGE);

if (!fs.existsSync(path.join(STAGE, '.htaccess'))) {
  console.error('Missing .htaccess in staged upload — build did not copy it.');
  process.exit(1);
}

fs.rmSync(ZIP, { force: true });
execFileSync('zip', ['-r', '-q', ZIP, '.'], { cwd: STAGE, stdio: 'inherit' });

console.log('\nNamecheap package ready:');
console.log('  Folder: deploy/namecheap/upload/  (upload contents into public_html)');
console.log('  Zip:    deploy/namecheap/questquiz-public_html.zip');
console.log('\nDomain: https://www.learnassessment.com');
