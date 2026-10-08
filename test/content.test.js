#!/usr/bin/env node
/* ============================================================
   Content checks — no browser needed, runs in about ten seconds.
   Run this after ANY change to src/content.js, src/subjects.js,
   src/ap.js or src/engine.js. It is the fastest way to catch the
   kind of bug that silently degrades question quality.
   ============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const FILES = ['content.js', 'subjects.js', 'engine.js', 'ap.js'];

let fails = 0;
const ok = (name, cond, detail) => {
  console.log((cond ? '  PASS  ' : '  FAIL  ') + name + (detail ? '  — ' + detail : ''));
  if (!cond) fails++;
};

/* Load the browser modules into a sandbox with a fake `window`. */
for (const f of FILES) {
  try { new vm.Script(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f }); }
  catch (e) { console.error('SYNTAX ERROR in src/' + f + ': ' + e.message); process.exit(1); }
}
const ctx = { window: {}, console, Math, Date, JSON, Set, Array, Object, String, Number };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f });

const C = ctx.window.QQ_CONTENT, E = ctx.window.QQ_ENGINE, AP = ctx.window.QQ_AP;
const BANDS = ['k2', 'e35', 'm68', 'h912'];

console.log('\nINVENTORY');
console.log('  fact banks ' + Object.keys(C.BANKS).length +
  ' · generated families ' + C.FAMS.length +
  ' · subjects ' + C.SUBJECTS.length +
  ' · AP courses ' + AP.AP_COURSES.length +
  ' · AP units ' + AP.AP_COURSES.reduce((s, c) => s + c.units.length, 0));

/* ---------- 1. every generated question is well formed ---------- */
console.log('\nQUESTION QUALITY');
const problems = {};
let checked = 0;
const flag = (k, m) => { (problems[k] = problems[k] || []).push(m); };
const inspect = q => {
  checked++;
  if (/\{[a-z_]+\}/.test(q.prompt)) flag('unfilled template placeholder', q.prompt);
  if (!q.options.includes(q.answer)) flag('correct answer missing from options', q.prompt);
  if (q.options.length < 3) flag('fewer than three options', q.prompt + ' | ' + q.options.join(' / '));
  if (new Set(q.options).size !== q.options.length) flag('duplicate options', q.options.join(' / '));
  // Only a bare "undefined"/"NaN" value is a bug. The WORD undefined is
  // legitimate inside calculus and programming text.
  if (q.options.some(o => o === 'undefined' || o === 'NaN' || /\bNaN\b/.test(o)))
    flag('NaN or undefined as an option value', q.prompt);
};

const lengths = new Set();
for (const band of BANDS) {
  for (const level of [1, 5, 10]) {
    for (let i = 0; i < 25; i++) {
      const a = E.buildAssessment(band, level, i, []);
      lengths.add(a.questions.length);
      a.questions.forEach(inspect);
    }
  }
}
AP.AP_COURSES.forEach(c => {
  [{ unit: 0, count: 60 }].concat(c.units.map(u => ({ unit: u.n, count: 25 })))
    .forEach(r => E.buildApSet(c, Object.assign({ nonce: 1, label: 'test' }, r)).questions.forEach(inspect));
});
C.QUIZZES.forEach(q => E.buildQuiz(q.id).questions.forEach(inspect));

ok('every question is well formed', Object.keys(problems).length === 0, checked + ' checked');
Object.entries(problems).forEach(([k, v]) => console.log('        ' + v.length + '× ' + k + '  e.g. ' + v[0].slice(0, 90)));

/* ---------- 2. an assessment is always exactly 50 questions ----------
   This caught a real regression: adding a subject with no banks below
   grade 6 made K-2 and 3-5 assessments 34 questions long. */
ok('every assessment is exactly 50 questions', lengths.size === 1 && lengths.has(50),
  'lengths seen: ' + [...lengths].join(', '));

/* ---------- 3. no content from the wrong band or from AP ---------- */
let bandLeak = 0, apLeak = 0;
for (const band of BANDS) {
  for (let i = 0; i < 25; i++) {
    E.buildAssessment(band, 5, i, []).questions.forEach(q => {
      if (String(q.src).startsWith('ap.')) apLeak++;
      const m = String(q.src).match(/\.(k2|e35|m68|h912)\./);
      if (m && BANDS.indexOf(m[1]) > BANDS.indexOf(band)) bandLeak++;
    });
  }
}
ok('no AP course content in a general assessment', apLeak === 0, apLeak + ' leaks');
ok('no question from above the learner band', bandLeak === 0, bandLeak + ' leaks');

/* ---------- 4. every subject in the mix can actually be generated ---------- */
console.log('\nSUBJECT COVERAGE');
let missing = 0;
BANDS.forEach(band => {
  const mix = (C.MIX_BY_BAND && C.MIX_BY_BAND[band]) || C.MIX;
  const delivered = {};
  for (let i = 0; i < 25; i++)
    E.buildAssessment(band, 5, i, []).questions.forEach(q => delivered[q.subject] = (delivered[q.subject] || 0) + 1);
  const absent = mix.map(m => m[0]).filter(s => !delivered[s]);
  if (absent.length) { missing++; console.log('        ' + band + ' never delivers: ' + absent.join(', ')); }
  const total = Object.values(delivered).reduce((a, c) => a + c, 0);
  console.log('  ' + band.padEnd(5) + Object.entries(delivered).sort((a, b) => b[1] - a[1])
    .map(([s, c]) => s.replace(' Language Arts', ' LA').replace(' & Civics', '').replace(' & Arts', '') + ' ' + Math.round(c / total * 100) + '%').join(' · '));
});
ok('every subject in each band mix is reachable', missing === 0);

/* ---------- 5. error repetition ---------- */
console.log('\nERROR REPETITION');
let pairs = 0, repeats = 0, grew = 0, runs = 0;
for (const band of BANDS) {
  for (let i = 0; i < 25; i++) {
    const plan = E.buildAssessment(band, 1 + (i % 10), i, []);
    const s = E.createSession(plan, { passMark: 80 });
    const before = s.plan.length;
    while (s.cursor < s.plan.length) {
      const q = s.plan[s.cursor];
      E.answer(s, q.options.find(o => o !== q.answer)); // miss everything
      s.cursor++;
    }
    runs++;
    if (s.plan.length > before) grew++;
    const seen = {};
    s.plan.forEach(q => (seen[q.qid] = seen[q.qid] || []).push(q.prompt));
    Object.values(seen).forEach(list => {
      for (let k = 1; k < list.length; k++) { pairs++; if (list[k] === list[k - 1]) repeats++; }
    });
  }
}
ok('missed questions are re-asked', grew === runs, grew + '/' + runs + ' runs grew');
ok('a re-ask never repeats the previous wording', repeats === 0, pairs + ' consecutive pairs checked');

/* carry-over into the next assessment */
const plan = E.buildAssessment('e35', 3, 0, []);
const sess = E.createSession(plan, { passMark: 80 });
const doomed = new Set();
while (sess.cursor < sess.plan.length) {
  const q = sess.plan[sess.cursor];
  const miss = q.reask ? doomed.has(q.reaskOf) : sess.cursor % 4 === 0;
  if (miss && !q.reask) doomed.add(q.qid);
  E.answer(sess, miss ? q.options.find(o => o !== q.answer) : q.answer);
  sess.cursor++;
}
const score = E.sessionScore(sess);
const next = E.buildAssessment('e35', 3, 1, score.unresolved);
const carried = next.questions.filter(q => q.carryOver);
ok('unresolved misses carry into the next assessment', carried.length > 0, carried.length + ' carried');
ok('carry-overs change form', carried.every(q => {
  const m = score.unresolved.find(u => u.qid === q.qid);
  return m && q.form !== m.formsSeen[m.formsSeen.length - 1];
}));

/* ---------- 6. determinism ---------- */
console.log('\nDETERMINISM');
const a1 = E.buildAssessment('m68', 4, 7, []).questions.map(q => q.qid).join('|');
const a2 = E.buildAssessment('m68', 4, 7, []).questions.map(q => q.qid).join('|');
ok('the same assessment is always the same questions', a1 === a2);

/* ---------- 7. AP structure ---------- */
console.log('\nAP STRUCTURE');
const noSources = AP.AP_COURSES.filter(c => !(c.banks || []).length && !(c.fams || []).length);
ok('every AP course has question sources', noSources.length === 0, noSources.map(c => c.id).join(', '));
/* A unit either has questions — in which case practising it must return ONLY
   that unit — or it has none, in which case the set must declare itself mixed
   rather than passing other units off as the one that was asked for. */
let mislabelled = 0, emptyUnits = 0, strictOk = 0;
AP.AP_COURSES.forEach(c => c.units.forEach(u => {
  const items = E.apUnitItemCount(c, u.n);
  const set = E.buildApSet(c, { unit: u.n, count: 12, nonce: 1, label: 'test' });
  if (!set || !set.questions.length) return;
  if (items > 0) {
    if (set.questions.every(q => q.unit === u.n) && set.coverage.complete) strictOk++;
    else mislabelled++;
  } else {
    emptyUnits++;
    if (set.coverage.complete) mislabelled++;   // claimed unit-scoped but is not
  }
}));
ok('a unit with questions returns only that unit', mislabelled === 0,
  strictOk + ' units strictly scoped, ' + mislabelled + ' mislabelled');
ok('units with no questions are declared mixed, not passed off as the unit', true,
  emptyUnits + ' units have no questions yet — see the admin AP coverage table');

console.log('\n' + (fails ? fails + ' FAILURE(S)' : 'All content checks passed.') + '\n');
process.exit(fails ? 1 : 0);
