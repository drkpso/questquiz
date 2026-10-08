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
  ok('verification explained', (await page.content()).includes('Parents and students 13+ verify by email'));
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

  console.log('LIVE MODE — no demo accounts / no on-page codes');
  await page.click('button[data-v="signin"]');
  await page.waitForTimeout(300);
  const signinHtml = await page.content();
  ok('sign-in has no demo account card', !/Demo accounts|parent@questquiz\.app|kabir@example\.com|admin123/.test(signinHtml));
  ok('child login ID entry is available', !!(await page.$('button[data-v="kidlogin"]')));
  await page.click('button[data-v="kidlogin"]');
  await page.waitForTimeout(300);
  ok('child login asks for login ID (no profile list)', !!(await page.$('#kid-login')) && !(await page.$('.learner-pick, .kid-directory')));
  await page.click('button[data-act="pub"][data-v="landing"]');
  await page.waitForTimeout(200);
  ok('footer no longer says demo / browser-only', !(await page.content()).includes('Demo build') && !(await page.content()).includes('browser only'));

  console.log('SIGNUP FORMS (server-backed; file:// cannot complete email)');
  await page.click('button[data-v="signup-role"]');
  await page.waitForTimeout(200);
  await page.click('button[data-v="signup-parent"]');
  await page.waitForTimeout(200);
  ok('parent signup form renders', !!(await page.$('#pa-email')) && !!(await page.$('form[data-act="doparent"]')));
  await page.click('button[data-act="pub"][data-v="landing"]');
  await page.waitForTimeout(200);
  await page.click('button[data-v="signup-role"]');
  await page.waitForTimeout(200);
  await page.click('button[data-v="signup-school"]');
  await page.waitForTimeout(200);
  ok('school signup form renders', !!(await page.$('#sc-email')));
  await page.click('button[data-act="pub"][data-v="landing"]');
  await page.waitForTimeout(200);

  console.log('THEME');
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await page.waitForTimeout(150);
  await page.click('.future-home button[data-act="theme"]');
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
