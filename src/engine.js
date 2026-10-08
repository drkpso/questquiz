/* ============================================================
   QuestQuiz — question engine
   Deterministic generation, subject mixing, error-repetition.
   ============================================================ */
(function () {
  const C = window.QQ_CONTENT;

  /* Fix one template that needs a sentence frame */
  if (C.BANKS['ela.e35.pos']) C.BANKS['ela.e35.pos'].q = 'What part of speech is the word "{a}"?';

  /* ---------- deterministic PRNG ---------- */
  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function mulberry(seed) {
    let t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  const lower = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const fill = (tpl, a, b) => tpl.replace(/\{a\}/g, a).replace(/\{b_l\}/g, lower(b)).replace(/\{b\}/g, b).replace(/\{a_ctx\}/g, a);

  /* ---------- source registry per band+subject ---------- */
  const BAND_ORDER = ['k2', 'e35', 'm68', 'h912'];
  const sourceCache = {};
  function sourcesFor(band, subject) {
    const key = band + '|' + subject;
    if (sourceCache[key]) return sourceCache[key];
    const sk = C.SUBJECT_KEY[subject];
    const bandIdx = BAND_ORDER.indexOf(band);
    let out = [];
    // walk from this band downward until we have enough variety
    for (let i = bandIdx; i >= 0 && out.length < 3; i--) {
      const b = BAND_ORDER[i];
      // AP banks and families are course content, reached only through an AP set —
      // a grade-9 general assessment should not serve a Calculus AB derivative.
      Object.keys(C.BANKS).forEach(id => { if (id.startsWith(sk + '.' + b + '.') && !id.startsWith('ap.')) out.push({ t: 'bank', id }); });
      C.FAMS.forEach(f => { if (f.band === b && f.subject === subject && !f.ap) out.push({ t: 'fam', id: f.id }); });
    }
    sourceCache[key] = out;
    return out;
  }
  /* Modules that load after this one (the AP pack) append to C.FAMS, so the lookup
     has to stay in step with the list rather than being frozen at load time. */
  const famById = {};
  let famCount = -1;
  function famLookup(id) {
    if (famCount !== C.FAMS.length) {
      C.FAMS.forEach(f => { famById[f.id] = f; });
      famCount = C.FAMS.length;
    }
    return famById[id];
  }

  /* ---------- build a single question ---------- */
  function fromBank(bankId, seed, form, unitFilter) {
    const bank = C.BANKS[bankId];
    const r = mulberry(seed);
    let items = bank.items;
    if (unitFilter) {
      const scoped = items.filter(x => x.u === unitFilter);
      // Even a single tagged item is enough: distractors are drawn from the whole
      // bank below, so a one-item unit still yields four plausible options.
      if (scoped.length >= 1) items = scoped;
    }
    const it = items[Math.floor(r() * items.length)];
    // The question comes from the scoped set, but distractors always draw on the
    // whole bank so a narrow unit still gets four plausible options.
    const all = bank.items;
    const others = all.filter(x => x.b !== it.b && x.a !== it.a);

    // A bank with only two possible answers (living/non-living, el/la) would give a
    // coin flip in the forward form. Send it to the true-statement form instead —
    // not the reverse form, so forms 0 and 1 stay visibly different and a re-ask
    // never reads as a verbatim repeat of the question just missed.
    const distinctAnswers = new Set(all.map(x => x.b)).size;
    if (form === 0 && distinctAnswers < 3) form = bank.tf ? 2 : (bank.rv ? 1 : 0);

    if (form === 1 && bank.rv) {
      // Every distractor subject must have a DIFFERENT answer, or several options
      // would be correct for "Which of these is living?".
      const subjectPool = all.filter(x => x.b !== it.b).map(x => x.a);
      const pool = C._shuf(r, Array.from(new Set(subjectPool))).slice(0, 3);
      return { prompt: fill(bank.rv, it.a, it.b), options: C._shuf(r, [it.a, ...pool]), answer: it.a, explain: fill(bank.tf, it.a, it.b), unit: it.u };
    }
    if (form === 2 && bank.tf && others.length >= 2) {
      // Every distractor pairs a DIFFERENT subject with THIS answer, so each one is
      // guaranteed false (others already excludes items sharing this answer).
      const right = fill(bank.tf, it.a, it.b);
      const wrong = C._shuf(r, others).slice(0, 3).map(x => fill(bank.tf, x.a, it.b)).filter(w => w !== right);
      // A template that never mentions the subject makes every statement identical.
      // Rather than ship a one-option question, ask it the forward way instead.
      if (wrong.length >= 2) {
        return { prompt: 'Which statement is correct?', options: C._shuf(r, [right, ...wrong]), answer: right, explain: right, unit: it.u };
      }
      form = 0;
    }
    // Distractors come from every distinct answer in the bank, not only from items
    // that also differ by subject — otherwise small banks run out of options.
    const answerPool = Array.from(new Set(all.map(x => x.b))).filter(b => b !== it.b);
    const pool = C._shuf(r, answerPool).slice(0, 3);
    return { prompt: fill(bank.q, it.a, it.b), options: C._shuf(r, [it.b, ...pool]), answer: it.b, explain: fill(bank.tf, it.a, it.b), unit: it.u };
  }

  function makeQuestion(band, subject, seed, form, difficulty) {
    const srcs = sourcesFor(band, subject);
    if (!srcs.length) return null;
    const pickR = mulberry(seed ^ 0x9E3779B9);
    const first = Math.floor(pickR() * srcs.length);
    // If a source fails, move to the next one in the SAME band and subject rather
    // than substituting an unrelated question — an off-topic fallback hides the
    // fault and puts the wrong grade of question in front of the learner.
    let src = null, body = null;
    for (let k = 0; k < srcs.length && !body; k++) {
      const cand = srcs[(first + k) % srcs.length];
      const fam = cand.t === 'fam' ? famLookup(cand.id) : null;
      if (cand.t === 'fam' && !fam) continue;
      try {
        const made = cand.t === 'bank' ? fromBank(cand.id, seed, form) : fam.make(mulberry(seed), difficulty, form);
        if (made && made.options && made.options.length) { src = cand; body = made; }
      } catch (e) { /* try the next source */ }
    }
    if (!body) return null;
    // de-duplicate; keep the correct answer, never pad with look-alikes
    let opts = Array.from(new Set(body.options.map(String).filter(o => o.trim() !== '')));
    const ans = String(body.answer);
    if (!opts.includes(ans)) opts.unshift(ans);
    if (opts.length > 4) opts = [ans, ...opts.filter(o => o !== ans).slice(0, 3)];
    return {
      qid: src.t + ':' + src.id + ':' + seed,
      src: src.id, srcType: src.t, seed, form,
      subject, band,
      prompt: body.prompt,
      options: C._shuf(mulberry(seed ^ 0x51ED2701), opts),
      answer: ans,
      explain: body.explain || ''
    };
  }

  /* ---------- assessment assembly ---------- */
  const LEVELS = 10, ASSESS_PER_LEVEL = 25, QUESTIONS = 50;

  function buildAssessment(band, level, index, carryOver) {
    const base = hash(`${band}|L${level}|A${index}`);
    const difficulty = (level - 1) / (LEVELS - 1);
    const plan = [];
    let n = 0;
    // Each band has its own subject weighting — a K-2 sitting is not a grade-11 one.
    const mix = (C.MIX_BY_BAND && C.MIX_BY_BAND[band]) || C.MIX;
    mix.forEach(([subject, count]) => {
      for (let i = 0; i < count; i++) {
        // Re-seed rather than drop: the assessment must still be 50 questions.
        let q = null;
        for (let attempt = 0; attempt < 5 && !q; attempt++) {
          q = makeQuestion(band, subject, hash(`${base}|${subject}|${i}|${attempt}`), 0, difficulty);
        }
        if (q) plan.push(q);
        n++;
      }
    });

    // Backfill: if any subject came up short (a band with a thin bank), top up from
    // the subjects that do have depth here, so an assessment is never short-changed.
    if (plan.length < QUESTIONS) {
      const fallback = mix.map(m => m[0]).filter(s => sourcesFor(band, s).length);
      const seen = new Set(plan.map(q => q.qid));
      for (let i = 0; plan.length < QUESTIONS && i < QUESTIONS * 6 && fallback.length; i++) {
        const subject = fallback[i % fallback.length];
        const q = makeQuestion(band, subject, hash(`${base}|fill|${i}`), 0, difficulty);
        if (q && !seen.has(q.qid)) { seen.add(q.qid); plan.push(q); }
      }
    }

    // deterministic interleave so subjects alternate rather than clump
    const r = mulberry(base ^ 0xABCDEF);
    const mixed = C._shuf(r, plan).slice(0, QUESTIONS);

    // splice in carry-over recovery questions from previous assessments
    (carryOver || []).slice(0, 5).forEach((rec, i) => {
      const slot = Math.min(mixed.length - 1, 3 + i * 8);
      const q = regenerate(rec, nextForm(rec.formsSeen), difficulty);
      if (q) { q.carryOver = true; mixed.splice(slot, 0, q); }
    });
    return { band, level, index, questions: mixed, difficulty };
  }

  function buildQuiz(quizId) {
    const def = C.QUIZZES.find(q => q.id === quizId);
    if (!def) return null;
    const band = def.tier === 'Middle School' ? 'm68' : 'h912';
    const base = hash('quiz|' + quizId);
    const out = [];
    const sources = [];
    (def.banks || []).forEach(b => sources.push({ t: 'bank', id: b }));
    (def.fams || []).forEach(f => sources.push({ t: 'fam', id: f }));
    for (let i = 0; i < 100; i++) {
      const src = sources[i % sources.length];
      const seed = hash(`${base}|${i}`);
      const form = i < 60 ? 0 : (i < 85 ? 1 : 2);
      let body;
      try {
        body = src.t === 'bank' ? fromBank(src.id, seed, form) : famLookup(src.id).make(mulberry(seed), Math.min(1, i / 100 + 0.3), form);
      } catch (e) { continue; }
      let opts = Array.from(new Set(body.options.map(String).filter(o => o.trim() !== '')));
      const ans = String(body.answer);
      if (!opts.includes(ans)) opts.unshift(ans);
      if (opts.length > 4) opts = [ans, ...opts.filter(o => o !== ans).slice(0, 3)];
      out.push({
        qid: src.t + ':' + src.id + ':' + seed, src: src.id, srcType: src.t, seed, form,
        subject: def.subject, band, prompt: body.prompt,
        options: C._shuf(mulberry(seed ^ 0x51ED2701), opts), answer: ans, explain: body.explain || ''
      });
    }
    return { quiz: def, questions: out };
  }

  /* ---------- AP practice sets ---------- */
  /* How many question items are actually tagged to a given unit of a course.
     Zero means that unit has no content yet — the caller must not pretend it
     can be practised, because the answers would be filed against other units
     and the mastery picture would be wrong. */
  function apUnitItemCount(course, unit) {
    if (!unit) return Infinity;
    let n = 0;
    (course.banks || []).forEach(b => {
      const bank = C.BANKS[b];
      if (bank) n += bank.items.filter(i => i.u === unit).length;
    });
    (course.fams || []).forEach(f => {
      const fam = famLookup(f);
      if (fam && fam.unit === unit) n += 1;
    });
    return n;
  }

  function buildApSet(course, opts) {
    opts = opts || {};
    const count = opts.count || 25;
    const unit = opts.unit || 0;
    let label = opts.label || 'Practice set';
    const base = hash(`ap|${course.id}|${unit}|${label}|${opts.nonce || 0}`);
    const srcs = [];
    (course.banks || []).forEach(b => { if (C.BANKS[b]) srcs.push({ t: 'bank', id: b }); });
    (course.fams || []).forEach(f => { if (famLookup(f)) srcs.push({ t: 'fam', id: f }); });
    if (!srcs.length) return null;

    // A unit is only practisable if sources genuinely carry items tagged to it.
    // If none do we still build a set, but we say so rather than passing other
    // units off as the one that was asked for.
    let pool = srcs, scopedToUnit = false;
    if (unit) {
      const scoped = srcs.filter(s => s.t === 'bank'
        ? C.BANKS[s.id].items.some(i => i.u === unit)
        : (famLookup(s.id).unit === unit));
      if (scoped.length) { pool = scoped; scopedToUnit = true; }
    }

    const out = [];
    for (let i = 0; i < count; i++) {
      const src = pool[i % pool.length];
      const seed = hash(`${base}|${i}`);
      const form = i % 3;
      let body;
      try {
        body = src.t === 'bank'
          ? fromBank(src.id, seed, form, unit)
          : famLookup(src.id).make(mulberry(seed), 0.75, form);
      } catch (e) { continue; }
      let o = Array.from(new Set(body.options.map(String).filter(v => v.trim() !== '')));
      const ans = String(body.answer);
      if (!o.includes(ans)) o.unshift(ans);
      if (o.length > 4) o = [ans, ...o.filter(v => v !== ans).slice(0, 3)];
      out.push({
        qid: src.t + ':' + src.id + ':' + seed, src: src.id, srcType: src.t, seed, form,
        subject: course.abbr, band: 'h912', apCourse: course.id,
        unit: body.unit || (src.t === 'fam' ? famLookup(src.id).unit : 0) || 0,
        prompt: body.prompt, options: C._shuf(mulberry(seed ^ 0x51ED2701), o),
        answer: ans, explain: body.explain || ''
      });
    }
    // Report honestly how much of the set actually came from the requested unit,
    // so the interface can label a widened set as mixed instead of claiming it
    // was unit practice.
    const matched = unit ? out.filter(q => q.unit === unit).length : out.length;
    const coverage = {
      requested: unit,
      scopedToUnit,
      matched,
      total: out.length,
      complete: !unit || (out.length > 0 && matched === out.length)
    };
    if (unit && !coverage.complete) label = label + ' (mixed — this unit has no practice items yet)';
    return { ap: true, course, unit, label, questions: out, difficulty: 0.75, coverage };
  }

  /* Pick the next framing for a re-ask: an unseen one if any remain, otherwise the
     oldest one — never the form the learner just saw, so a re-ask never looks like
     a straight repeat of the question they got wrong a moment ago. */
  function nextForm(seen) {
    const s = seen || [];
    for (let f = 0; f < 3; f++) if (!s.includes(f)) return f;
    const last = s[s.length - 1];
    for (let f = 0; f < 3; f++) if (f !== last) return f;
    return (last + 1) % 3;
  }

  /* Rebuild a question from the source that produced it, in a different form.
     This is how a re-ask stays the SAME question while looking different.
     It works off src/srcType rather than the subject name, so it covers AP sets
     (whose subject is a course code, not one of the five core subjects). */
  function regenerate(q, form, difficulty) {
    const src = { t: q.srcType, id: q.src };
    if (!src.id || (src.t === 'fam' && !famLookup(src.id)) || (src.t === 'bank' && !C.BANKS[src.id])) {
      return makeQuestion(q.band, q.subject, q.seed, form, difficulty);
    }
    let body;
    try {
      body = src.t === 'bank'
        ? fromBank(src.id, q.seed, form, q.unit || 0)
        : famLookup(src.id).make(mulberry(q.seed), difficulty == null ? 0.5 : difficulty, form);
    } catch (e) { return null; }
    let opts = Array.from(new Set(body.options.map(String).filter(v => v.trim() !== '')));
    const ans = String(body.answer);
    if (!opts.includes(ans)) opts.unshift(ans);
    if (opts.length > 4) opts = [ans, ...opts.filter(v => v !== ans).slice(0, 3)];
    return {
      qid: q.qid, src: src.id, srcType: src.t, seed: q.seed, form,
      subject: q.subject, band: q.band, apCourse: q.apCourse,
      unit: body.unit || q.unit || 0,
      prompt: body.prompt,
      options: C._shuf(mulberry(q.seed ^ 0x51ED2701 ^ (form + 1)), opts),
      answer: ans, explain: body.explain || ''
    };
  }

  /* ---------- live session with error repetition ---------- */
  function createSession(plan, opts) {
    opts = opts || {};
    return {
      plan: plan.questions.slice(),
      meta: plan,
      cursor: 0,
      answers: {},          // index -> {choice, correct, reask}
      firstPass: {},        // qid -> correct on first sight
      misses: {},           // qid -> {count, formsSeen, subject, band, seed}
      reasksScheduled: {},  // qid -> count
      startedAt: Date.now(),
      passMark: opts.passMark || 80,
      mode: opts.mode || 'assessment'
    };
  }

  /* Record an answer; returns {correct, injected} */
  function answer(sess, choice) {
    const i = sess.cursor;
    const q = sess.plan[i];
    const correct = choice === q.answer;
    sess.answers[i] = { choice, correct, reask: !!q.reask, qid: q.qid };

    if (!(q.qid in sess.firstPass)) sess.firstPass[q.qid] = correct;

    let injected = null;
    if (!correct) {
      const m = sess.misses[q.qid] || {
        count: 0, formsSeen: [], subject: q.subject, band: q.band, seed: q.seed,
        prompt: q.prompt, src: q.src, srcType: q.srcType, unit: q.unit, qid: q.qid
      };
      m.count++;
      if (!m.formsSeen.includes(q.form)) m.formsSeen.push(q.form);
      sess.misses[q.qid] = m;

      const already = sess.reasksScheduled[q.qid] || 0;
      if (already < 2) {
        const nq = regenerate(q, nextForm(m.formsSeen), sess.meta.difficulty || 0.5);
        if (nq) {
          nq.reask = true;
          nq.reaskOf = q.qid;
          nq.reaskRound = already + 1;
          const gap = already === 0 ? 8 : 14;
          const at = Math.min(sess.plan.length, i + gap + 1);
          sess.plan.splice(at, 0, nq);
          sess.reasksScheduled[q.qid] = already + 1;
          injected = { at, round: already + 1 };
        }
      }
    } else if (q.reask) {
      const m = sess.misses[q.reaskOf];
      if (m) m.cleared = true;
    }
    return { correct, injected, q };
  }

  function sessionScore(sess) {
    const qids = Object.keys(sess.firstPass);
    const firstCorrect = qids.filter(k => sess.firstPass[k]).length;
    const total = qids.length || 1;
    const pct = Math.round(firstCorrect / total * 100);
    const recovered = Object.values(sess.misses).filter(m => m.cleared).length;
    const unresolved = Object.entries(sess.misses).filter(([k, m]) => !m.cleared)
      .map(([qid, m]) => ({ qid, band: m.band, subject: m.subject, seed: m.seed, formsSeen: m.formsSeen, prompt: m.prompt, src: m.src, srcType: m.srcType, unit: m.unit }));
    const xp = firstCorrect * 10 + recovered * 4;
    return { firstCorrect, total, pct, recovered, unresolved, xp, passed: pct >= sess.passMark };
  }

  function subjectBreakdown(sess) {
    const by = {};
    sess.plan.forEach((q, i) => {
      const a = sess.answers[i];
      if (!a || q.reask) return;
      by[q.subject] = by[q.subject] || { right: 0, total: 0 };
      by[q.subject].total++;
      if (a.correct) by[q.subject].right++;
    });
    return by;
  }

  /* ---------- badge art ---------- */
  const BADGE_SHAPES = ['hex', 'shield', 'star', 'bloom', 'gem'];
  function badgeArt(bandId, level, size) {
    size = size || 160;
    const band = C.BANDS.find(b => b.id === bandId) || C.BANDS[0];
    const hue = (band.hue + level * 17) % 360;
    const hue2 = (hue + 42) % 360;
    const shape = BADGE_SHAPES[level % BADGE_SHAPES.length];
    const rays = 6 + (level % 7);
    const uid = `${bandId}${level}`;
    const cx = 100, cy = 100;
    let path;
    if (shape === 'hex') path = poly(6, 78, -90);
    else if (shape === 'shield') path = 'M100 20 L172 48 L172 104 Q172 158 100 182 Q28 158 28 104 L28 48 Z';
    else if (shape === 'star') path = starPath(5 + (level % 4), 80, 40);
    else if (shape === 'bloom') path = poly(8 + (level % 3), 78, -90);
    else path = poly(5, 80, -90);

    let spokes = '';
    for (let i = 0; i < rays; i++) {
      const ang = (i / rays) * Math.PI * 2;
      const x1 = cx + Math.cos(ang) * 34, y1 = cy + Math.sin(ang) * 34;
      const x2 = cx + Math.cos(ang) * 58, y2 = cy + Math.sin(ang) * 58;
      spokes += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="hsl(${hue2} 92% 88%)" stroke-width="4" stroke-linecap="round" opacity="0.75"/>`;
    }
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Level ${level} badge">
  <defs>
    <linearGradient id="g${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 85% 62%)"/>
      <stop offset="1" stop-color="hsl(${hue2} 80% 44%)"/>
    </linearGradient>
    <radialGradient id="s${uid}" cx="0.35" cy="0.28" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <path d="${path}" fill="url(#g${uid})" stroke="hsl(${hue} 60% 28%)" stroke-width="5" stroke-linejoin="round"/>
  <path d="${path}" fill="url(#s${uid})"/>
  ${spokes}
  <circle cx="100" cy="100" r="33" fill="hsl(${hue} 30% 99%)" stroke="hsl(${hue} 60% 30%)" stroke-width="4"/>
  <text x="100" y="113" text-anchor="middle" font-family="'Baloo 2', Verdana, sans-serif" font-weight="800" font-size="34" fill="hsl(${hue} 65% 26%)">${level}</text>
</svg>`;
  }
  function poly(n, r, startDeg) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (startDeg + i * 360 / n) * Math.PI / 180;
      d += (i ? 'L' : 'M') + (100 + Math.cos(a) * r).toFixed(1) + ' ' + (100 + Math.sin(a) * r).toFixed(1) + ' ';
    }
    return d + 'Z';
  }
  function starPath(points, outer, inner) {
    let d = '';
    for (let i = 0; i < points * 2; i++) {
      const rr = i % 2 ? inner : outer;
      const a = (-90 + i * 180 / points) * Math.PI / 180;
      d += (i ? 'L' : 'M') + (100 + Math.cos(a) * rr).toFixed(1) + ' ' + (100 + Math.sin(a) * rr).toFixed(1) + ' ';
    }
    return d + 'Z';
  }

  window.QQ_ENGINE = {
    hash, mulberry, makeQuestion, buildAssessment, buildQuiz, buildApSet, apUnitItemCount, createSession, answer,
    sessionScore, subjectBreakdown, badgeArt, nextForm,
    LEVELS, ASSESS_PER_LEVEL, QUESTIONS
  };
})();
