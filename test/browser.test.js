const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.join(__dirname, '..', 'public', 'index.html');
let fails = 0;
const ok = (n, c) => { console.log((c ? '  PASS' : '  FAIL') + ' — ' + n); if (!c) fails++; };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(URL);
  await page.waitForTimeout(700);

  console.log('LANDING PAGE');
  ok('hero headline renders', (await page.textContent('h1')).includes('more like a'));
  ok('no horizontal page scroll', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok('all 8 subject tiles render', (await page.$$('.subject-tile')).length === 8);
  ok('4 grade bands shown (K-12, not 6-12)', (await page.$$('.age-tile')).length === 4);
  ok('no ad slots anywhere', (await page.$$('.adslot')).length === 0);
  ok('internal design brief removed', (await page.$('.picture-lab')) === null);
  ok('privacy commitment present', (await page.content()).includes('No advertising on this platform'));
  ok('verification explained', (await page.content()).includes('Parents verify by phone'));
  ok('AP unit proof restored', (await page.content()).includes('Unit 3 is the one to work on'));
  ok('body has an explicit background', await page.evaluate(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    return bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
  }));
  ok('display font loaded (not fallback)', await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('700 1rem "Baloo 2"');
  }));

  console.log('PHONE WIDTH');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  ok('no horizontal scroll at 390px', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.setViewportSize({ width: 1280, height: 900 });

  console.log('TRY BEFORE SIGNUP (no account)');
  await page.click('button[data-act="trystart"]');
  await page.waitForTimeout(400);
  ok('grade picker offered', (await page.$$('[data-act="trypick"]')).length === 4);
  await page.click('[data-act="trypick"][data-band="e35"]');
  await page.waitForTimeout(300);
  ok('a real question is generated', /Question 1 of 3/.test(await page.textContent('.try-run')));
  const beforeY = await page.evaluate(() => window.scrollY);
  for (let k = 0; k < 3; k++) {
    const o = await page.$$('.try-run .opt:not([disabled])');
    if (!o.length) break;
    await o[0].click(); await page.waitForTimeout(150);
    const nx = await page.$('[data-act="trynext"]');
    if (nx) { await nx.click(); await page.waitForTimeout(200); }
  }
  ok('reaches a score with a signup prompt', !!(await page.$('.try-done')));
  ok('page did not jump to top while answering', Math.abs(await page.evaluate(() => window.scrollY) - beforeY) < 400);

  console.log('LANDING DARK MODE');
  const lightBg = await page.evaluate(() => getComputedStyle(document.querySelector('.future-home')).backgroundColor);
  await page.click('.future-home button[data-act="theme"]');
  await page.waitForTimeout(350);
  const darkBg = await page.evaluate(() => getComputedStyle(document.querySelector('.future-home')).backgroundColor);
  ok('landing responds to the theme toggle', lightBg !== darkBg);
  ok('landing text stays legible in dark', await page.evaluate(() => {
    const c = getComputedStyle(document.querySelector('.future-home')).color.match(/\d+/g).map(Number);
    return (c[0] + c[1] + c[2]) / 3 > 120;
  }));
  await page.click('.future-home button[data-act="theme"]');
  await page.waitForTimeout(250);

  console.log('SIGN IN — parent');
  await page.click('button[data-v="signin"]');
  await page.fill('#si-email', 'parent@questquiz.app');
  await page.fill('#si-pass', 'parent123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  ok('lands on the parent overview', (await page.textContent('h1')).includes('Your family'));
  ok('approvals badge shows a pending item', !!(await page.$('.navbadge')));
  await page.click('button[data-route="approvals"]');
  await page.waitForTimeout(300);
  ok('under-13 request is listed', (await page.content()).includes('Nina'));
  await page.click('button[data-act="logout"]');
  await page.waitForTimeout(300);
  ok('logout returns to the landing page', (await page.textContent('h1')).includes('more like a'));

  console.log('SIGN IN — student with AP');
  await page.click('button[data-v="signin"]');
  await page.fill('#si-email', 'kabir@example.com');
  await page.fill('#si-pass', 'student123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  ok('lands on the quest board', (await page.textContent('h1')).includes('Ready for a quest'));
  ok('AP nav item present for a grade-11 learner', !!(await page.$('button[data-route="ap"]')));
  await page.click('button[data-route="ap"]');
  await page.waitForTimeout(300);
  ok('AP hub lists enrolled courses', (await page.$$('.apcard')).length === 4);
  ok('exam countdown renders', !!(await page.$('.countdown')));
  await page.click('.apcard');
  await page.waitForTimeout(300);
  ok('course page shows the unit table', (await page.$$('table tbody tr')).length >= 8);
  ok('projected score shown', !!(await page.$('.scorebig')));

  console.log('AP PRACTICE RUN');
  await page.click('button[data-act="appractice"][data-u="0"]');
  await page.waitForTimeout(300);
  ok('PIN gate appears before the set', (await page.content()).includes('Confirm it is you'));
  for (const d of '9021') await page.click(`button[data-act="epin"][data-n="${d}"]`);
  await page.waitForTimeout(400);
  ok('question 1 renders after the PIN', (await page.textContent('h2')).includes('Question 1 of 25'));

  // answer everything wrong to force the error-repetition scheduler to fire
  let answered = 0, grew = false;
  for (let i = 0; i < 140; i++) {
    const opts = await page.$$('.opt:not([disabled])');
    if (!opts.length) break;
    await opts[0].click();
    await page.waitForTimeout(60);
    const h = await page.textContent('h2');
    if (h && /of (\d+)/.test(h) && Number(h.match(/of (\d+)/)[1]) > 25) grew = true;
    const next = await page.$('button[data-act="nextq"]');
    if (!next) break;
    await next.click();
    await page.waitForTimeout(60);
    answered++;
    if (await page.$('button[data-act="exitexam"]')) break;
  }
  ok('answered ' + answered + ' questions without stalling', answered > 20);
  ok('set grew as missed questions were re-injected', grew);
  ok('result screen reached', !!(await page.$('button[data-act="exitexam"]')));
  ok('per-unit breakdown on the result', (await page.content()).includes('By unit'));

  console.log('SIGNUP — school, then admin approval');
  await page.click('button[data-act="exitexam"]');
  await page.waitForTimeout(200);
  await page.click('button[data-act="logout"]');
  await page.waitForTimeout(300);
  await page.click('button[data-v="signup-role"]');
  await page.waitForTimeout(200);
  await page.click('button[data-v="signup-school"]');
  await page.waitForTimeout(200);
  await page.fill('#sc-name', 'Cypress Charter');
  await page.fill('#sc-district', 'Calcasieu');
  await page.fill('#sc-contact', 'M Reyes');
  await page.fill('#sc-role', 'Principal');
  await page.fill('#sc-email', 'm@cypresscharter.edu');
  await page.fill('#sc-phone', '+1 337 555 0122');
  await page.fill('#sc-students', '410');
  await page.fill('#sc-pass', 'pw12345');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(300);
  ok('school sees the submitted screen', (await page.textContent('h1')).includes('Registration submitted'));

  await page.click('button[data-v="signin"]');
  await page.fill('#si-email', 'admin@questquiz.app');
  await page.fill('#si-pass', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(400);
  await page.click('button[data-route="schools"]');
  await page.waitForTimeout(300);
  ok('new registration is in the admin queue', (await page.content()).includes('Cypress Charter'));
  await page.click('button[data-act="approveschool"]');
  await page.waitForTimeout(400);
  ok('approval moves it out of pending', (await page.content()).includes('approved'));

  console.log('THEME');
  // Reset to the un-stamped state first — the landing check above cycled it.
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.waitForTimeout(150);
  await page.click('button[data-act="theme"]');
  await page.waitForTimeout(250);
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  ok('dark theme repaints the body (' + dark + ')', dark !== 'rgb(238, 243, 255)');
  ok('text stays legible in dark theme', await page.evaluate(() => {
    const c = getComputedStyle(document.body).color;
    const m = c.match(/\d+/g).map(Number);
    return (m[0] + m[1] + m[2]) / 3 > 120;
  }));

  console.log('');
  // Google Fonts cannot be reached from this sandbox; that is the environment,
  // not the page. verify-nofonts.js proves the page degrades correctly without it.
  const envOnly = e => /ERR_TUNNEL_CONNECTION_FAILED|fonts\.googleapis|fonts\.gstatic/.test(e);
  const real = errors.filter(e => !envOnly(e));
  ok('no uncaught JavaScript errors', real.length === 0);
  if (real.length) real.slice(0, 5).forEach(e => console.log('    ' + e.slice(0, 160)));
  if (errors.length !== real.length) console.log('  (ignored ' + (errors.length - real.length) + ' network error(s) for blocked Google Fonts — sandbox only)');

  
  await browser.close();
  console.log(fails ? '\n' + fails + ' FAILURES' : '\nAll checks passed.');
  process.exit(fails ? 1 : 0);
})();
