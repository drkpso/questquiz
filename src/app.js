/* ============================================================
   QuestQuiz — interface
   ============================================================ */
(function () {
  const C = window.QQ_CONTENT, E = window.QQ_ENGINE, S = window.QQ_STORE, AP = window.QQ_AP;
  const app = document.getElementById('app');
  const toastHost = document.getElementById('toasts');

  let route = 'home';
  let pub = { view: 'landing', error: '', data: {}, demoCode: '', pin: '', learnerId: null, userId: null, taster: null };
  let exam = null, examView = null;
  let parentFocus = null, apFocus = null, modal = null;
  let downloadsNs = undefined;

  S.load();

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const st = () => S.state;
  const me = () => st().users[S.session.userId];
  const kid = () => st().learners[S.session.learnerId];
  const bandOf = id => C.BANDS.find(b => b.id === id) || C.BANDS[0];
  const courseOf = id => AP.AP_COURSES.find(c => c.id === id);
  const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
  const checked = id => { const e = document.getElementById(id); return !!(e && e.checked); };

  function toast(msg, kind) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    if (kind === 'good') el.style.background = 'var(--good)';
    if (kind === 'bad') el.style.background = 'var(--bad)';
    toastHost.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function daysToExam() {
    const d = new Date(st().settings.apExamWindowOpens + 'T00:00:00');
    return Math.max(0, Math.ceil((d - new Date()) / 86400000));
  }

  /* ============================================================
     PUBLIC — landing page
     ============================================================ */
  function landing() {
    const apCount = AP.AP_COURSES.length;

    /* Every tile maps to a subject the engine actually generates — nothing is
       advertised here that a learner cannot then go and do. */
    const subjectTiles = [
      ['⚡', 'MATHEMATICS', 'Logic Lab', 'Number sense to calculus.'],
      ['✍️', 'ENGLISH', 'Word Forge', 'Read closer. Write sharper.'],
      ['🧬', 'SCIENCE', 'Discovery Zone', 'How the world actually works.'],
      ['💻', 'COMPUTER SCIENCE', 'Code Arena', 'Algorithms, data, the internet.'],
      ['🌎', 'HISTORY & CIVICS', 'Time Machine', 'People, power and place.'],
      ['🎨', 'CREATIVE & ARTS', 'Idea Studio', 'Colour, music, story, design.'],
      ['🌐', 'WORLD LANGUAGES', 'Polyglot', 'Spanish and French, built up.'],
      ['🃏', 'GENERAL KNOWLEDGE', 'Wild Card', 'Everything else worth knowing.']
    ];

    const bandTiles = C.BANDS.map(b => [b.grades.replace('Grades ', ''), b.name, b.ages]);

    return `<div class="pub future-home">
      <header class="pubnav future-nav">
        <div class="brand"><div class="brand-mark">Q</div><div class="brand-name">QuestQuiz</div></div>
        <nav class="future-links" aria-label="Main navigation">
          <a href="#subjects">Subjects</a><a href="#loop">How it works</a><a href="#ap">AP Prep</a><a href="#families">For families</a><a href="#trust">Privacy</a>
        </nav>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost" data-act="theme">◐ Theme</button>
        <button class="btn btn-sm btn-ghost" data-act="pub" data-v="signin">Sign in</button>
        <button class="btn btn-sm btn-primary" data-act="pub" data-v="signup-role">Join free</button>
      </header>

      <section class="future-hero" id="top">
        <div class="future-hero-copy">
          <div class="eyebrow future-eyebrow">KINDERGARTEN TO GRADE 12 · ${apCount} AP COURSES</div>
          <h1>Learning that feels more like a <span>quest.</span></h1>
          <p class="future-lede">Short, smart challenges matched to your child's grade. Questions they miss come back until they stick. Levels, badges and rewards worth working for — from first counting to AP Calculus.</p>
          <div class="future-actions">
            <button class="btn btn-primary btn-lg pulse-btn" data-act="trystart">Try 3 questions — no account</button>
            <button class="btn btn-ghost btn-lg" data-act="pub" data-v="signup-role">Create a free account</button>
          </div>
          <div class="trust-row">
            <span>✓ Free to start</span><span>✓ No ads, ever</span><span>✓ Parent-held accounts under 13</span>
          </div>
        </div>
        <div class="future-hero-visual" aria-hidden="true">
          <div class="orbit orb1"></div><div class="orbit orb2"></div>
          <div class="float-card fc1">⚡ <b>+240 XP</b><small>Daily streak</small></div>
          <div class="float-card fc2">🏆 <b>Level 7</b><small>Badge unlocked</small></div>
          <div class="future-dashboard">
            <div class="dash-top"><span class="live-dot"></span><b>YOUR QUEST MAP</b><span class="pill pill-teal">STREAK 12 🔥</span></div>
            <div class="dash-avatar">Q</div>
            <div class="dash-title">Ready for today's challenge?</div>
            <div class="xp-track"><i style="width:68%"></i></div>
            <div class="dash-stats">
              <span><b>68%</b><small>XP to next level</small></span>
              <span><b>14</b><small>quests cleared</small></span>
              <span><b>3</b><small>to revisit</small></span>
            </div>
            <div class="mini-quest-grid"><div class="mq math">∑<small>Math</small></div><div class="mq science">⚗<small>Science</small></div><div class="mq code">&lt;/&gt;<small>Code</small></div><div class="mq words">Aa<small>English</small></div></div>
            <div class="quest-cta">CONTINUE QUEST →</div>
          </div>
        </div>
      </section>

      <section class="age-strip" aria-label="Grade bands">
        ${bandTiles.map(([g, n, a]) => `<div class="age-tile"><b>${esc(g)}</b><div><strong>${esc(n)}</strong><small>${esc(a)}</small></div></div>`).join('')}
      </section>

      <!-- Try it: three real questions, generated by the same engine, no account -->
      <section class="future-section trybox" id="try">
        <div class="section-heading">
          <div><div class="eyebrow">SEE IT BEFORE YOU SIGN UP</div><h2>Three real questions. No account, no email.</h2></div>
          <span class="section-note">Straight from the live question engine.</span>
        </div>
        <div class="card try-card" id="try-card">${tryPanel()}</div>
      </section>

      <section class="future-section" id="subjects">
        <div class="section-heading">
          <div><div class="eyebrow">EIGHT SUBJECTS, ONE SITTING</div><h2>Every subject, mixed into every assessment.</h2></div>
          <span class="section-note">Weighted to the grade, not to a timetable.</span>
        </div>
        <div class="subject-grid">${subjectTiles.map(([i, k, t, d], idx) => `<div class="subject-tile tile-${idx % 6}"><span class="subject-icon">${i}</span><span class="subject-kicker">${k}</span><strong>${t}</strong><small>${esc(d)}</small></div>`).join('')}</div>
      </section>

      <section class="feature-band" id="loop">
        <div class="feature-copy">
          <div class="eyebrow">THE QUEST LOOP</div>
          <h2>Wrong answers don't end the game. They power the next move.</h2>
          <p>Miss a question and it returns eight later in the same assessment — reworded, in a different shape. Miss it again and it comes back once more. Anything still unresolved opens the next assessment. Only first attempts count toward the score, so the repetition teaches without inflating the mark.</p>
          <button class="btn btn-violet" data-act="pub" data-v="signup-role">Start the first level →</button>
        </div>
        <div class="level-map"><div class="map-line"></div>${[['01', 'Spark', 'cleared'], ['02', 'Ember', 'cleared'], ['03', 'Beacon', '3 of 5 passed'], ['04', 'Comet', 'locked'], ['05', 'Aurora', 'locked']].map((x, i) => `<div class="level-node ${i < 3 ? 'active' : ''}"><span>${x[0]}</span><div><b>${x[1]}</b><small>${x[2]}</small></div></div>`).join('')}</div>
      </section>

      <section class="future-section ap-future" id="ap">
        <div class="ap-copy">
          <div class="eyebrow">FOR HIGH SCHOOL AND PRE-COLLEGE</div>
          <h2>AP prep that names the unit you're losing marks in.</h2>
          <p>Enrol in any of ${apCount} AP courses. Practise a single unit or sit a full mock. Every answer is filed against the College Board unit it came from, so the weak spot is named rather than guessed.</p>
          <div class="btn-row"><button class="btn btn-primary" data-act="pub" data-v="signup-role">Explore AP prep</button><span class="pill pill-violet">${apCount} AP courses · 153 units</span></div>
        </div>
        <div class="ap-preview ap-proof">
          <div class="between"><b style="font-family:var(--display)">AP Calculus AB</b><span class="scorechip s4">4</span></div>
          ${[['Unit 1 · Limits and Continuity', 88], ['Unit 2 · Differentiation', 73], ['Unit 3 · Composite and Implicit', 50], ['Unit 6 · Integration', 64]]
        .map(([u, v]) => `<div class="row" style="gap:9px;flex-wrap:nowrap;margin-top:8px">
            <span class="tiny" style="flex:1;min-width:0">${u}</span>
            <span class="meter" style="flex:0 0 74px"><i style="width:${v}%;background:${v >= 75 ? 'var(--good)' : v >= 55 ? 'var(--warn)' : 'var(--bad)'}"></i></span>
            <span class="mono tiny" style="flex:0 0 32px;text-align:right;font-weight:800">${v}%</span></div>`).join('')}
          <p class="tiny muted" style="margin-top:12px">Unit 3 is the one to work on. That is a sentence, not a dashboard.</p>
        </div>
      </section>

      <section class="future-section" id="families">
        <div class="section-heading"><div><div class="eyebrow">BUILT FOR THE WHOLE FAMILY</div><h2>Students get the game. Adults get the signal.</h2></div></div>
        <div class="family-grid">
          <div class="family-card student-card"><span>🚀</span><h3>Students</h3><p>Quests, streaks, XP, badges and AP practice. Sign in with a PIN, or your own email from 13.</p><button class="text-btn" data-act="pub" data-v="signup-role">Start playing →</button></div>
          <div class="family-card parent-card"><span>🏡</span><h3>Parents</h3><p>See progress and the topics being missed. Set the level. Add rewards only your family sees — extra screen time, choosing dinner. Your child claims it, you grant it.</p><button class="text-btn" data-act="pub" data-v="signup-role">Create a family account →</button></div>
          <div class="family-card school-card"><span>🏫</span><h3>Schools</h3><p>A class code, a roster, cohort averages and the concepts a class keeps missing. Reviewed before approval.</p><button class="text-btn" data-act="pub" data-v="signup-role">Request school access →</button></div>
        </div>
      </section>

      <section class="future-section steps-section">
        <div class="section-heading"><div><div class="eyebrow">HOW IT WORKS</div><h2>Four steps, then it runs itself.</h2></div></div>
        <div class="steps">
          ${[
        ['Create an account', 'Parents verify by phone. Students 13 and over verify by email. Under 13 goes through a parent, who gives consent and holds the account. Schools are reviewed by hand before a class code is issued.'],
        ['Set the starting level', 'Every learner begins at level 1 of their grade band. A parent can move that up or down at any time, or switch bands entirely, without losing a badge.'],
        ['Take assessments', 'Fifty mixed questions. A PIN check first, every single time, so a result is always tied to the right learner.'],
        ['Clear levels, claim rewards', 'Pass five assessments at 80% to clear a level. The badge lands on the shelf and the rewards behind it open.']
      ].map(([t, d], i) => `<div class="step"><span class="step-n mono">${i + 1}</span><div><b>${t}</b><p class="tiny muted">${d}</p></div></div>`).join('')}
        </div>
      </section>

      <section class="future-section trust-section" id="trust">
        <div class="section-heading"><div><div class="eyebrow">HOW THIS IS PAID FOR</div><h2>Sponsored rewards. Not your child's attention.</h2></div></div>
        <div class="grid g2">
          <div class="trust-card">
            <h3>No advertising on this platform</h3>
            <p class="tiny muted">There are no ad slots, no behavioural advertising and no setting that turns either on. Partners fund the reward catalogue instead — a bookshop, a library, a science museum — and a partner only ever learns a first name and a level, at the moment a reward is redeemed, and only if that optional consent is switched on.</p>
            <div class="chipwrap" style="margin-top:14px">
              <span class="chip">Free for families</span><span class="chip">Free for schools in pilot</span><span class="chip">Partner-funded rewards</span>
            </div>
          </div>
          <div class="trust-card">
            <h3>What we collect, and what we never do</h3>
            <div class="grid g2" style="gap:12px;margin-top:6px">
              <div><b class="tiny">Collected</b><ul class="tiny muted" style="margin:5px 0 0;padding-left:16px;line-height:1.6"><li>First name and avatar</li><li>Grade and year of birth</li><li>Answers, scores, badges</li><li>Parent email, school code</li></ul></div>
              <div><b class="tiny">Never collected</b><ul class="tiny muted" style="margin:5px 0 0;padding-left:16px;line-height:1.6"><li>A child's address or phone</li><li>Photographs or voice</li><li>Precise location</li><li>Tracking identifiers</li></ul></div>
            </div>
            <p class="tiny muted" style="margin-top:12px">Consent is versioned, timestamped and auditable. A parent can export or delete a child's record at any time.</p>
          </div>
        </div>
      </section>

      <section class="cta future-cta">
        <div>
          <div class="eyebrow">YOUR NEXT LEVEL STARTS HERE</div>
          <h2>One quest. Then another. Then suddenly — they're good at it.</h2>
          <p>Free to start, no card, no setup. Try three questions first if you'd rather see it working.</p>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary btn-lg" data-act="pub" data-v="signup-role">Create free account</button>
          <button class="btn btn-ghost btn-lg" data-act="trystart">Try 3 questions</button>
        </div>
      </section>

      <footer class="pubfoot future-footer">
        <div class="row">
          <div class="brand" style="margin:0"><div class="brand-mark" style="width:28px;height:28px;font-size:.85rem;border-radius:9px">Q</div><div class="brand-name">QuestQuiz</div></div>
          <span class="spacer"></span>
          <span class="tiny muted">Privacy Notice · Terms · COPPA disclosure · Accessibility · Contact</span>
        </div>
        <p class="tiny muted" style="margin-top:10px">Demo build. Accounts and progress are stored in this browser only — nothing is transmitted, and clearing site data resets everything. AP is a registered trademark of the College Board, which was not involved in and does not endorse this product.</p>
      </footer>
    </div>`;
  }

  /* ---------- try-before-signup: three real questions, no account ---------- */
  function tryPanel() {
    const t = pub.taster;
    if (!t || !t.started) {
      return `<div class="try-start">
        <p class="tiny muted">Pick a grade and we'll generate three questions from the live bank — the same ones a learner would get.</p>
        <div class="try-grades">
          ${C.BANDS.map(b => `<button class="btn btn-sm btn-ghost" data-act="trypick" data-band="${b.id}">${esc(b.grades)}</button>`).join('')}
        </div>
      </div>`;
    }
    if (t.done) {
      const pct = Math.round(t.right / t.qs.length * 100);
      return `<div class="try-done">
        <div class="try-score"><b>${t.right}/${t.qs.length}</b><span>${pct}%</span></div>
        <div>
          <h3 style="margin-bottom:6px">${t.right === t.qs.length ? 'All three. Ready for a real level.' : t.right === 0 ? 'A tough draw — that is what the levels are for.' : 'Good start.'}</h3>
          <p class="tiny muted">A real assessment is fifty questions across all eight subjects, and anything missed comes back reworded until it sticks. Create a free account to keep the score, earn the badge and unlock rewards.</p>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn btn-primary" data-act="pub" data-v="signup-role">Create a free account</button>
            <button class="btn btn-ghost btn-sm" data-act="tryreset">Try three more</button>
          </div>
        </div>
      </div>`;
    }
    const q = t.qs[t.i];
    const ans = t.answers[t.i];
    return `<div class="try-run">
      <div class="between">
        <span class="pill pill-teal">${esc(q.subject)}</span>
        <span class="tiny muted mono">Question ${t.i + 1} of ${t.qs.length} · ${esc(bandOf(t.band).grades)}</span>
      </div>
      <div class="qprompt wrapanywhere" style="font-size:clamp(1.05rem,2.4vw,1.35rem);margin:12px 0 14px">${esc(q.prompt)}</div>
      <div class="opts">
        ${q.options.map((o, oi) => {
      let cls = '';
      if (ans !== undefined) { if (o === q.answer) cls = 'right'; else if (o === ans) cls = 'wrong'; }
      return `<button class="opt" ${ans !== undefined ? 'disabled' : ''} data-act="tryanswer" data-o="${esc(o)}">
          <span class="key">${'ABCD'[oi]}</span><span class="wrapanywhere">${esc(o)}</span></button>`;
    }).join('')}
      </div>
      ${ans !== undefined ? `<div class="feedback ${ans === q.answer ? 'fb-good' : 'fb-bad'}" style="margin-top:12px">
        <b>${ans === q.answer ? 'Correct.' : 'Not this time.'}</b> ${esc(q.explain)}</div>
        <div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" data-act="trynext">${t.i + 1 >= t.qs.length ? 'See how I did →' : 'Next question →'}</button></div>` : ''}
    </div>`;
  }

  function startTaster(bandId) {
    const band = bandId || 'e35';
    const mix = (C.MIX_BY_BAND && C.MIX_BY_BAND[band]) || C.MIX;
    const pool = mix.map(m => m[0]);
    const nonce = Date.now();
    const qs = [];
    for (let i = 0; qs.length < 3 && i < 40; i++) {
      const subject = pool[(i * 3) % pool.length];
      const q = E.makeQuestion(band, subject, E.hash('taster|' + nonce + '|' + i), 0, 0.35);
      if (q && !qs.some(x => x.qid === q.qid)) qs.push(q);
    }
    pub.taster = { started: true, band, qs, i: 0, answers: {}, right: 0, done: false };
  }

  /* ---------- small wrapper for auth screens ---------- */
  function authShell(title, sub, inner, width) {
    return `<div class="pub"><header class="pubnav">
        <button class="brand" data-act="pub" data-v="landing" style="border:0;background:none;cursor:pointer;padding:0">
          <div class="brand-mark">Q</div><div class="brand-name">QuestQuiz</div></button>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-ghost" data-act="theme">Theme</button>
        <button class="btn btn-sm btn-ghost" data-act="pub" data-v="landing">← Back to the site</button>
      </header>
      <div class="authwrap" style="max-width:${width || 520}px">
        <div class="center stack" style="gap:6px;margin-bottom:6px"><h1>${title}</h1><p class="muted">${sub}</p></div>
        ${pub.error ? `<div class="notice notice-bad">${esc(pub.error)}</div>` : ''}
        ${inner}
      </div></div>`;
  }

  /* ---------- sign in ---------- */
  function signinView() {
    return authShell('Welcome back', 'Sign in and we will take you to the right place.', `
      <form class="card stack" data-act="dosignin">
        <label class="field">Email address<input type="email" id="si-email" required autocomplete="username" placeholder="you@example.com"></label>
        <label class="field">Password<input type="password" id="si-pass" required autocomplete="current-password" placeholder="••••••••"></label>
        <button class="btn btn-primary" type="submit">Sign in</button>
        <hr class="hr">
        <div class="center stack" style="gap:8px">
          <p class="tiny muted">Younger children sign in on the family device with their own PIN.</p>
          <button class="btn btn-ghost" type="button" data-act="pub" data-v="kidpick">🚀 A child is signing in with a PIN</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="pub" data-v="signup-role">No account yet? Create one</button>
        </div>
      </form>
      <div class="card-flat stack" style="gap:6px">
        <div class="eyebrow">Demo accounts</div>
        <div class="tiny mono">admin@questquiz.app · admin123</div>
        <div class="tiny mono">parent@questquiz.app · parent123</div>
        <div class="tiny mono">office@mapleridge.edu · school123</div>
        <div class="tiny mono">kabir@example.com · student123 <span class="muted">(grade 11, AP)</span></div>
      </div>`);
  }

  /* ---------- role picker ---------- */
  function signupRole() {
    const roles = [
      ['school', '🏫', 'School', 'For a school, district or learning centre. Reviewed by our team before your class code is issued.', 'Needs admin approval'],
      ['parent', '🏡', 'Parent or guardian', 'Holds the family account. Add your children under it, set their level and create rewards.', 'Verified by a code sent to your phone'],
      ['student', '🚀', 'Student', 'Taking the assessments yourself, including AP practice if you are in high school.', '13+ verify by email · under 13 needs a parent']
    ];
    return authShell('Create your account', 'Choose the role that fits. It decides how we verify you.', `
      <div class="stack">
        ${roles.map(([id, ico, name, desc, note]) => `<button class="rolecard" data-act="pub" data-v="signup-${id}">
          <span class="ico">${ico}</span>
          <span class="rc-body"><b>${name}</b><small>${desc}</small><span class="pill pill-violet">${note}</span></span>
          <span class="rc-go">→</span></button>`).join('')}
        <div class="center"><button class="btn btn-ghost btn-sm" data-act="pub" data-v="signin">Already have an account? Sign in</button></div>
      </div>`, 620);
  }

  /* ---------- school signup ---------- */
  function signupSchoolView() {
    return authShell('Register your school', 'We review every school registration by hand before issuing a class code.', `
      <form class="card stack" data-act="doschool">
        <div class="grid g2">
          <label class="field">School name<input type="text" id="sc-name" required placeholder="Westlake STEM Academy"></label>
          <label class="field">District or authority<input type="text" id="sc-district" required placeholder="Calcasieu Parish"></label>
          <label class="field">Your name<input type="text" id="sc-contact" required placeholder="Full name"></label>
          <label class="field">Your role at the school<input type="text" id="sc-role" required placeholder="Assistant Principal"></label>
          <label class="field">Official school email<input type="email" id="sc-email" required placeholder="you@school.edu"></label>
          <label class="field">Phone<input type="tel" id="sc-phone" required placeholder="+1 337 555 0100"></label>
          <label class="field">Approximate students<input type="number" id="sc-students" min="1" required placeholder="640"></label>
          <label class="field">Password<input type="password" id="sc-pass" required minlength="6" placeholder="At least 6 characters"></label>
        </div>
        <div class="notice notice-info">We verify that the email domain belongs to the school and that you are authorised to enrol students. Expect a decision within two business days. You cannot sign in until the registration is approved.</div>
        <button class="btn btn-primary" type="submit">Submit for review</button>
        <button class="btn btn-ghost" type="button" data-act="pub" data-v="signup-role">← Choose a different role</button>
      </form>`, 640);
  }

  function schoolSubmitted() {
    return authShell('Registration submitted', 'Nothing more to do right now.', `
      <div class="card stack center">
        <div style="font-size:2.6rem">📨</div>
        <p>We have your registration for <b>${esc(pub.data.schoolName || 'your school')}</b> and it is in the review queue.</p>
        <div class="card-flat stack" style="gap:6px;text-align:left">
          <div class="eyebrow">What happens next</div>
          <ol class="tiny muted" style="margin:0;padding-left:18px;line-height:1.8">
            <li>We confirm the email domain belongs to the school.</li>
            <li>We check you are authorised to enrol students.</li>
            <li>On approval you get a class code and can sign in with the password you set.</li>
          </ol>
        </div>
        <p class="tiny muted">Trying to see the other side of this? Sign in as the admin and approve it from the School approvals queue.</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn btn-primary" data-act="pub" data-v="signin">Go to sign in</button>
          <button class="btn btn-ghost" data-act="pub" data-v="landing">Back to the site</button>
        </div>
      </div>`);
  }

  /* ---------- parent signup + OTP ---------- */
  function signupParentView() {
    const pre = pub.data.prefillEmail || '';
    return authShell('Create a parent account', 'One account holds the whole family. We verify your phone before it becomes active.', `
      <form class="card stack" data-act="doparent">
        ${pre ? `<div class="notice notice-info">You are setting this up so <b>${esc(pub.data.childName || 'your child')}</b> can start. Use the email the request was sent to.</div>` : ''}
        <label class="field">Your name<input type="text" id="pa-name" required placeholder="Full name"></label>
        <label class="field">Email address<input type="email" id="pa-email" required value="${esc(pre)}" placeholder="you@example.com"></label>
        <label class="field">Mobile number<input type="tel" id="pa-phone" required placeholder="+1 337 555 0148"></label>
        <label class="field">Password<input type="password" id="pa-pass" required minlength="6" placeholder="At least 6 characters"></label>
        <p class="tiny muted">We use the number only to verify the account and to send a code if you ever lose your password. It is never shared with partners.</p>
        <button class="btn btn-primary" type="submit">Send me a code</button>
        <button class="btn btn-ghost" type="button" data-act="pub" data-v="signup-role">← Choose a different role</button>
      </form>`);
  }

  function otpView() {
    const u = st().users[pub.userId] || {};
    return authShell('Check your phone', `We sent a six-digit code to ${esc(u.phone || 'your number')}.`, `
      <div class="card stack">
        <div class="codebox">
          ${[0, 1, 2, 3, 4, 5].map(i => `<span class="codecell ${pub.pin.length > i ? 'filled' : ''}">${esc(pub.pin[i] || '')}</span>`).join('')}
        </div>
        <label class="field">Enter the code
          <input type="text" id="otp-input" inputmode="numeric" maxlength="6" autocomplete="one-time-code" value="${esc(pub.pin)}" placeholder="000000" style="font-family:var(--mono);letter-spacing:.4em;text-align:center;font-size:1.2rem"></label>
        <button class="btn btn-primary" data-act="dootp">Verify and continue</button>
        <div class="between">
          <button class="btn btn-ghost btn-sm" data-act="resendotp">Send a new code</button>
          <span class="tiny muted">Codes expire after 10 minutes</span>
        </div>
        ${pub.demoCode ? `<div class="notice notice-info">Demo build — no SMS is sent. Your code is <b class="mono">${esc(pub.demoCode)}</b>.</div>` : ''}
      </div>`);
  }

  /* ---------- student: age gate ---------- */
  function studentAge() {
    const yr = new Date().getFullYear();
    return authShell('How old are you?', 'This decides how we set your account up — the law treats under-13s differently.', `
      <form class="card stack" data-act="doage">
        <label class="field">Year of birth
          <select id="ag-year">${Array.from({ length: 16 }, (_, i) => yr - 4 - i).map(y => `<option value="${y}">${y}</option>`).join('')}</select></label>
        <div class="grid g2">
          <div class="card-flat"><b class="tiny">13 or older</b><p class="tiny muted">You create your own account and verify your email. You can still link a parent and a school afterwards.</p></div>
          <div class="card-flat"><b class="tiny">Under 13</b><p class="tiny muted">A parent has to approve and hold the account. We will ask for their email and send them the request.</p></div>
        </div>
        <button class="btn btn-primary" type="submit">Continue</button>
        <button class="btn btn-ghost" type="button" data-act="pub" data-v="signup-role">← Choose a different role</button>
      </form>`, 600);
  }

  /* ---------- student 13+ ---------- */
  function student13() {
    return authShell('Create your student account', 'You are 13 or older, so you can hold this account yourself.', `
      <form class="card stack" data-act="dostudent13">
        <div class="grid g2">
          <label class="field">First name<input type="text" id="s-name" required placeholder="First name only"></label>
          <label class="field">Grade
            <select id="s-grade">${C.ACTIVE_GRADES.map(g => `<option value="${g}" ${g === '11' ? 'selected' : ''}>Grade ${g}</option>`).join('')}</select></label>
          <label class="field">Email address<input type="email" id="s-email" required placeholder="you@example.com"></label>
          <label class="field">Password<input type="password" id="s-pass" required minlength="6" placeholder="At least 6 characters"></label>
          <label class="field">4-digit exam PIN<input type="text" id="s-pin" required pattern="[0-9]{4}" maxlength="4" inputmode="numeric" placeholder="e.g. 9021"></label>
          <label class="field">Avatar
            <select id="s-av">${['🦉', '🦊', '🐙', '🐢', '🐝', '🦖', '🐼', '🦄', '🐧', '🐳'].map(a => `<option>${a}</option>`).join('')}</select></label>
          <label class="field">School code <span class="muted" style="font-weight:600">(optional)</span><input type="text" id="s-school" placeholder="MAPLE-24"></label>
          <label class="field">Parent email <span class="muted" style="font-weight:600">(optional)</span><input type="email" id="s-parent" placeholder="So they can see your progress"></label>
        </div>
        <p class="tiny muted">The exam PIN is separate from your password. You enter it before every assessment so a result is always tied to you.</p>
        ${consentBlock(false)}
        <button class="btn btn-primary" type="submit">Create account</button>
        <button class="btn btn-ghost" type="button" data-act="pub" data-v="signup-student">← Back</button>
      </form>`, 660);
  }

  function emailVerifyView() {
    const l = st().learners[pub.learnerId] || {};
    return authShell('Verify your email', `We sent a six-digit code to ${esc(l.email || 'your inbox')}.`, `
      <div class="card stack">
        <div class="codebox">
          ${[0, 1, 2, 3, 4, 5].map(i => `<span class="codecell ${pub.pin.length > i ? 'filled' : ''}">${esc(pub.pin[i] || '')}</span>`).join('')}
        </div>
        <label class="field">Enter the code
          <input type="text" id="ev-input" inputmode="numeric" maxlength="6" value="${esc(pub.pin)}" placeholder="000000" style="font-family:var(--mono);letter-spacing:.4em;text-align:center;font-size:1.2rem"></label>
        <button class="btn btn-primary" data-act="doemailcode">Verify and start</button>
        <div class="between">
          <button class="btn btn-ghost btn-sm" data-act="resendemail">Send a new code</button>
          <span class="tiny muted">Codes expire after 30 minutes</span>
        </div>
        ${pub.demoCode ? `<div class="notice notice-info">Demo build — no email is sent. Your code is <b class="mono">${esc(pub.demoCode)}</b>.</div>` : ''}
      </div>`);
  }

  /* ---------- student under 13 ---------- */
  function studentU13() {
    const yr = new Date().getFullYear();
    return authShell('We need a parent first', 'Because you are under 13, a parent has to approve this and hold the account.', `
      <form class="card stack" data-act="dou13">
        <div class="grid g2">
          <label class="field">Your first name<input type="text" id="u-name" required placeholder="First name only"></label>
          <label class="field">Grade
            <select id="u-grade">${[6, 7, 8].map(g => `<option value="${g}">Grade ${g}</option>`).join('')}</select></label>
          <label class="field">Choose a 4-digit PIN<input type="text" id="u-pin" required pattern="[0-9]{4}" maxlength="4" inputmode="numeric" placeholder="e.g. 3344"></label>
          <label class="field">Avatar
            <select id="u-av">${['🐢', '🦊', '🐙', '🦉', '🐝', '🦖', '🐼', '🦄', '🐧', '🐳'].map(a => `<option>${a}</option>`).join('')}</select></label>
          <label class="field">A parent's email<input type="email" id="u-parent" required placeholder="parent@example.com"></label>
          <label class="field">School code <span class="muted" style="font-weight:600">(optional)</span><input type="text" id="u-school" placeholder="MAPLE-24"></label>
        </div>
        <div class="notice notice-warn">We will not create anything until your parent approves. They give consent, choose what is shared, and can delete the profile at any time.</div>
        <button class="btn btn-primary" type="submit">Send the request to my parent</button>
        <button class="btn btn-ghost" type="button" data-act="pub" data-v="signup-student">← Back</button>
      </form>`, 640);
  }

  function u13Submitted() {
    const d = pub.data;
    return authShell('Sent to your parent', 'Almost there — a grown-up has to finish this.', `
      <div class="card stack center">
        <div style="font-size:2.6rem">✉️</div>
        <p>We sent the request for <b>${esc(d.childName || '')}</b> to <b>${esc(d.parentEmail || '')}</b>.</p>
        ${d.parentExists
        ? `<div class="notice notice-good">That parent already has a QuestQuiz account. The request is sitting in their Approvals right now — ask them to sign in and approve it.</div>`
        : `<div class="notice notice-warn">There is no account for that email yet. Your parent needs to create one before they can approve this.</div>
           <button class="btn btn-primary" data-act="parentfromu13">Set up the parent account now</button>`}
        <p class="tiny muted">Once approved, sign in by picking your name and entering your PIN.</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn btn-ghost" data-act="pub" data-v="signin">Go to sign in</button>
          <button class="btn btn-ghost" data-act="pub" data-v="landing">Back to the site</button>
        </div>
      </div>`);
  }

  /* ---------- child PIN sign-in ---------- */
  function kidPick() {
    const kids = Object.values(st().learners).filter(l => l.status === 'active');
    return authShell('Who is learning today?', 'Tap your name, then enter your PIN.', `
      <div class="card"><div class="kid-grid">
        ${kids.map(k => `<button class="kid-card" data-act="pickkid" data-id="${k.id}">
          <span class="kid-av">${k.avatar}</span><b>${esc(k.name)}</b>
          <span class="tiny muted">Grade ${esc(k.grade)}</span></button>`).join('')}
      </div></div>
      <div class="center"><button class="btn btn-ghost" data-act="pub" data-v="signin">← Sign in with an email instead</button></div>`, 600);
  }

  function kidPin() {
    const k = st().learners[pub.learnerId];
    return authShell(`Hi, ${esc(k.name)}`, 'Enter your 4-digit PIN', `
      <div class="card">
        <div class="center" style="font-size:3rem;line-height:1">${k.avatar}</div>
        <div class="pindots">${[0, 1, 2, 3].map(i => `<i class="${pub.pin.length > i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="pinpad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="pin" data-n="${n}">${n}</button>`).join('')}
          <button data-act="pinclear">✕</button><button data-act="pin" data-n="0">0</button><button data-act="pinback">⌫</button>
        </div>
        <p class="tiny muted center" style="margin-top:14px">Demo PIN for ${esc(k.name)}: <span class="demo-key">${k.pin}</span></p>
      </div>
      <div class="center"><button class="btn btn-ghost" data-act="pub" data-v="kidpick">← Someone else</button></div>`, 420);
  }

  function consentBlock(under13) {
    const items = S.CONSENT_ITEMS.filter(c => under13 || !c.under13);
    return `<div>
      <div class="eyebrow">Consents and disclosures</div>
      <p class="tiny muted" style="margin:6px 0">We collect a first name, grade, year of birth and assessment answers. No address, no phone number for a child, no photographs. Behavioural advertising is off platform-wide and cannot be switched on.</p>
      <div class="card-flat">
        ${items.map(ci => `<label class="checkline">
          <input type="checkbox" data-consent="${ci.id}" ${ci.required ? 'data-required="1"' : ''}>
          <span>${esc(ci.label)} ${ci.required ? '<span class="req">required</span>' : '<span class="muted">optional</span>'}</span></label>`).join('')}
      </div></div>`;
  }

  function collectConsents() {
    const out = {};
    document.querySelectorAll('[data-consent]').forEach(c => out[c.dataset.consent] = c.checked);
    return out;
  }

  /* ============================================================
     SHELL
     ============================================================ */
  function navsFor() {
    const role = S.session.role;
    if (role === 'child') {
      const n = [['home', '🏠', 'Quest board'], ['levels', '🗺️', 'Levels']];
      if (kid().band === 'h912') n.push(['ap', '🎓', 'AP courses']);
      n.push(['quizzes', '⚡', 'Power quizzes'], ['badges', '🎖️', 'Badges'], ['rewards', '🎁', 'Rewards'], ['me', '📈', 'My progress']);
      return n;
    }
    if (role === 'parent') return [['home', '🏡', 'Overview'], ['progress', '📈', 'Progress'], ['setlevel', '🎚️', 'Level & pacing'], ['myrewards', '🎁', 'Family rewards'], ['approvals', '✅', 'Approvals'], ['orders', '📦', 'Print orders'], ['privacy', '🔒', 'Consent & data']];
    if (role === 'school') return [['home', '🏫', 'Cohort'], ['roster', '👥', 'Roster'], ['subjects', '📚', 'Subject strength'], ['codes', '🔑', 'Class codes']];
    return [['home', '📊', 'Dashboard'], ['schools', '🏫', 'School approvals'], ['rewards', '🎁', 'Rewards'], ['levels', '🎚️', 'Levels & rules'], ['catalog', '🧩', 'Content bank'], ['orders', '📦', 'Print orders'], ['people', '👥', 'Accounts'], ['ledger', '🔒', 'Consent ledger']];
  }

  function shell(inner) {
    const role = S.session.role;
    const navs = navsFor();
    const who = role === 'child' ? `${kid().avatar} ${kid().name}` : (me() ? me().name : '');
    const pendingCount = role === 'admin' ? st().pendingSchools.filter(p => p.status === 'pending').length
      : role === 'parent' ? S.pendingLinksFor(me().email).length + st().grants.filter(g => g.status === 'awaiting parent' && (me().children || []).includes(g.learnerId)).length : 0;
    return `<div class="shell">
      <nav class="rail" aria-label="Sections">
        <div class="brand"><div class="brand-mark">Q</div><div class="brand-name">QuestQuiz</div></div>
        ${navs.map(([id, ico, label]) => {
      const badge = (role === 'admin' && id === 'schools') || (role === 'parent' && id === 'approvals') ? pendingCount : 0;
      return `<button class="nav-btn" data-act="go" data-route="${id}" aria-current="${route === id}">
            <span class="nav-ico" aria-hidden="true">${ico}</span><span>${label}</span>
            ${badge ? `<span class="navbadge mono">${badge}</span>` : ''}</button>`;
    }).join('')}
        <div class="rail-foot">
          <div class="nav-sep"></div>
          <button class="nav-btn" data-act="theme"><span class="nav-ico">🌗</span><span>Theme</span></button>
          <button class="nav-btn" data-act="logout"><span class="nav-ico">↩︎</span><span>Sign out</span></button>
        </div>
      </nav>
      <div class="main">
        <header class="topbar">
          <span class="pill pill-accent">${esc(role === 'child' ? 'Student' : role.charAt(0).toUpperCase() + role.slice(1))}</span>
          <b>${esc(who)}</b>
          ${role === 'child' ? `<span class="pill pill-teal mono">${kid().xp.toLocaleString()} XP</span><span class="pill pill-warn">🔥 ${kid().streak}-day streak</span>` : ''}
          <span class="spacer"></span>
          <button class="btn btn-sm btn-ghost" data-act="theme">Theme</button>
          <button class="btn btn-sm btn-ghost" data-act="logout">Sign out</button>
        </header>
        <div class="page">${inner}</div>
      </div>
    </div>`;
  }

  /* ============================================================
     AP INTERFACE
     ============================================================ */
  function apHub() {
    const k = kid(), ap = S.ensureAp(k);
    const days = daysToExam();
    const enrolled = ap.enrolled.map(courseOf).filter(Boolean);
    return `<div class="stack">
      <div class="between">
        <div><div class="eyebrow">Advanced Placement</div><h1>AP courses</h1>
        <p class="muted">Practise a single unit or sit a full mock. Every answer is filed against its College Board unit, so you can see exactly where the marks are going.</p></div>
        <div class="countdown"><b class="mono">${days}</b><span>days to the May 2027 exam window</span></div>
      </div>

      ${enrolled.length ? `<div class="stack">
        <div class="section-head"><h2>Your courses</h2><span class="pill">${enrolled.length} enrolled</span></div>
        <div class="grid g2">
          ${enrolled.map(c => {
      const s = S.apCourseSummary(k, c.id);
      return `<button class="apcard" data-act="apopen" data-id="${c.id}">
              <div class="between"><b>${esc(c.name)}</b>
                ${s.projected ? `<span class="scorechip s${s.projected}">${s.projected}</span>` : '<span class="pill">Not started</span>'}</div>
              <p class="tiny muted">${esc(c.blurb)}</p>
              <div class="meter"><i style="width:${s.pct || 0}%"></i></div>
              <div class="between"><span class="tiny muted">${s.total ? s.right + ' of ' + s.total + ' correct across ' + Object.keys(s.rec.units).length + ' units' : 'No practice yet'}</span>
                <span class="tiny" style="font-weight:800">${s.pct === null ? '' : s.pct + '%'}</span></div>
            </button>`;
    }).join('')}
        </div></div>` : `<div class="notice notice-info">You are not enrolled in any AP course yet. Pick one below — you can drop it again at any time.</div>`}

      <div class="stack">
        <div class="section-head"><h2>Course catalogue</h2><span class="pill">${AP.AP_COURSES.length} courses</span></div>
        ${AP.AP_GROUPS.map(g => {
      const list = AP.AP_COURSES.filter(c => c.group === g);
      return `<div class="card stack">
          <div class="section-head"><h3>${esc(g)}</h3><span class="pill">${list.length}</span></div>
          <div class="grid g2">
            ${list.map(c => {
        const on = ap.enrolled.includes(c.id);
        return `<div class="card-flat stack" style="gap:7px">
                <div class="between"><b style="font-family:var(--display);font-size:.98rem">${esc(c.name)}</b>
                  ${on ? '<span class="pill pill-good">Enrolled</span>' : ''}</div>
                <p class="tiny muted">${esc(c.blurb)}</p>
                <div class="tiny muted">${c.units.length} units</div>
                <div class="btn-row">
                  ${on ? `<button class="btn btn-sm btn-teal" data-act="apopen" data-id="${c.id}">Open</button>
                          <button class="btn btn-sm btn-ghost" data-act="apdrop" data-id="${c.id}">Drop</button>`
            : `<button class="btn btn-sm btn-primary" data-act="apenroll" data-id="${c.id}">Enrol</button>`}
                </div></div>`;
      }).join('')}
          </div></div>`;
    }).join('')}
      </div>
      <p class="tiny muted">AP is a registered trademark of the College Board, which was not involved in and does not endorse this product. Unit titles and exam weightings follow the published course frameworks; confirm exam dates on the College Board site.</p>
    </div>`;
  }

  function apCourse() {
    const k = kid(), c = courseOf(apFocus);
    if (!c) return apHub();
    const s = S.apCourseSummary(k, c.id);
    const days = daysToExam();
    // Only recommend a unit the learner can actually go and practise. Pointing
    // someone at a unit with no questions written for it wastes the one piece of
    // advice this page gives.
    const weakest = Object.entries(s.rec.units)
      .map(([u, v]) => ({ u: Number(u), pct: Math.round(v.right / v.total * 100), ...v }))
      .filter(x => E.apUnitItemCount(c, x.u) > 0)
      .sort((a, b) => a.pct - b.pct)[0];
    return `<div class="stack">
      <div class="row"><button class="btn btn-sm btn-ghost" data-act="go" data-route="ap">← All AP courses</button></div>
      <div class="between">
        <div><div class="eyebrow">${esc(c.group)}</div><h1>${esc(c.name)}</h1><p class="muted" style="max-width:54ch">${esc(c.blurb)}</p></div>
        <div class="stack" style="gap:8px;align-items:flex-end">
          <div class="countdown"><b class="mono">${days}</b><span>days to the exam window</span></div>
        </div>
      </div>

      <div class="grid g2">
        <div class="card stack">
          <div class="section-head"><h2>Where you stand</h2><span class="pill">First-attempt answers</span></div>
          ${s.pct === null ? '<p class="tiny muted">No practice recorded yet. Run a set and this fills in.</p>' : `
            <div class="row" style="gap:18px;align-items:center">
              <div class="scorebig s${s.projected}"><b>${s.projected}</b><span>projected</span></div>
              <div class="stack" style="gap:4px;flex:1;min-width:140px">
                <b style="font-family:var(--display);font-size:1.05rem">${esc(AP.SCORE_LABEL[s.projected])}</b>
                <div class="meter"><i style="width:${s.pct}%"></i></div>
                <span class="tiny muted">${s.right} of ${s.total} correct · ${s.pct}%</span>
              </div>
            </div>
            <p class="tiny muted">A directional estimate from your practice only. Real AP composite cut points vary by subject and by year, and free-response sections are not simulated here.</p>`}
        </div>
        <div class="card stack">
          <div class="section-head"><h2>Practise</h2></div>
          ${weakest ? `<div class="notice notice-warn">Your weakest unit is <b>Unit ${weakest.u}</b> at ${weakest.pct}%. That is where the next hour pays best.
            <div style="margin-top:8px"><button class="btn btn-sm btn-primary" data-act="appractice" data-id="${c.id}" data-u="${weakest.u}">Practise unit ${weakest.u}</button></div></div>` : ''}
          <div class="btn-row">
            <button class="btn btn-primary" data-act="appractice" data-id="${c.id}" data-u="0">Mixed practice · 25 questions</button>
            <button class="btn btn-violet" data-act="apmock" data-id="${c.id}">Full mock · 60 questions</button>
          </div>
          <p class="tiny muted">Every set starts with a PIN check, same as any other assessment.</p>
        </div>
      </div>

      <div class="card stack">
        <div class="section-head"><h2>Units</h2><span class="pill">Weighting from the course framework</span></div>
        <div class="tablewrap"><table><thead><tr><th>Unit</th><th>Exam weight</th><th>Your mastery</th><th>Answered</th><th></th></tr></thead><tbody>
          ${c.units.map(u => {
      const v = s.rec.units[u.n];
      const pct = v ? Math.round(v.right / v.total * 100) : null;
      // A unit with no tagged items cannot be practised in isolation. Say so
      // rather than offering a button that quietly serves other units.
      const items = E.apUnitItemCount(c, u.n);
      return `<tr>
              <td><b>${u.n}.</b> ${esc(u.title)}${items ? '' : ' <span class="pill tiny">no items yet</span>'}</td>
              <td class="tiny mono">${esc(u.weight)}</td>
              <td style="min-width:120px">${pct === null ? '<span class="tiny muted">—</span>'
          : `<div class="row" style="gap:8px;flex-wrap:nowrap"><span class="meter" style="flex:1;min-width:60px"><i style="width:${pct}%;background:${pct >= 75 ? 'var(--good)' : pct >= 55 ? 'var(--warn)' : 'var(--bad)'}"></i></span>
                       <span class="mono tiny" style="font-weight:800">${pct}%</span></div>`}</td>
              <td class="num tiny">${v ? v.right + '/' + v.total : '0'}</td>
              <td>${items
          ? `<button class="btn btn-sm btn-ghost" data-act="appractice" data-id="${c.id}" data-u="${u.n}">Practise</button>`
          : `<span class="tiny muted">—</span>`}</td>
            </tr>`;
    }).join('')}
        </tbody></table></div>
        ${c.units.some(u => !E.apUnitItemCount(c, u.n))
        ? `<p class="tiny muted">Units marked “no items yet” have no practice questions written for them. They are listed because they are part of the official course framework, and mixed practice still covers the rest of the course.</p>` : ''}
      </div>

      <div class="card stack">
        <div class="section-head"><h2>Practice history</h2><span class="pill">${s.sets.length} sets</span></div>
        ${s.sets.length ? `<div class="tablewrap"><table><thead><tr><th>Date</th><th>Set</th><th>Questions</th><th>Score</th><th>Projected</th></tr></thead><tbody>
          ${s.sets.map(x => `<tr><td class="num tiny">${x.at}</td><td>${esc(x.label)}</td><td class="num">${x.count}</td>
            <td class="num">${x.pct}%</td><td>${x.projected ? `<span class="scorechip s${x.projected}">${x.projected}</span>` : '—'}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="tiny muted">Nothing yet.</p>'}
      </div>
    </div>`;
  }

  /* ============================================================
     CHILD
     ============================================================ */
  function childHome() {
    const k = kid(), b = bandOf(k.band), p = S.ensureProgress(k, k.band);
    const lvl = p.level, passed = ((p.passedInLevel || {})[lvl] || []).length, need = st().settings.assessmentsToClear;
    const rq = k.recoveryQueue.length;
    const unlocked = S.rewardsFor(k.id).filter(r => r.unlocked && !r.claimed).length;
    const ap = S.ensureAp(k);
    return `<div class="stack">
      <div class="between">
        <div><div class="eyebrow">${esc(b.grades)} · ${esc(b.name)} band</div><h1>Ready for a quest, ${esc(k.name)}?</h1></div>
        <button class="btn btn-primary btn-lg" data-act="startnext">Start the next assessment →</button>
      </div>
      <div class="grid g4">
        <div class="stat"><b class="mono">${lvl}</b><span>Current level</span></div>
        <div class="stat"><b class="mono">${passed}/${need}</b><span>Passed this level</span></div>
        <div class="stat"><b class="mono">${k.badges.length}</b><span>Badges earned</span></div>
        <div class="stat"><b class="mono">${k.xp.toLocaleString()}</b><span>Total XP</span></div>
      </div>

      ${k.band === 'h912' && ap.enrolled.length ? `<div class="card stack">
        <div class="section-head"><h2>AP courses</h2><span class="pill pill-violet">${daysToExam()} days to the exam window</span></div>
        <div class="grid g3">
          ${ap.enrolled.map(courseOf).filter(Boolean).map(c => {
      const s = S.apCourseSummary(k, c.id);
      return `<button class="card-flat" style="text-align:left;cursor:pointer;border:2px solid var(--line)" data-act="apopen" data-id="${c.id}">
              <div class="between"><b class="tiny" style="font-family:var(--display);font-size:.95rem">${esc(c.name)}</b>
                ${s.projected ? `<span class="scorechip s${s.projected}">${s.projected}</span>` : ''}</div>
              <div class="meter" style="margin-top:7px"><i style="width:${s.pct || 0}%"></i></div></button>`;
    }).join('')}
        </div></div>` : ''}

      <div class="grid g2">
        <div class="card stack">
          <div class="section-head"><h2>Level ${lvl} — ${esc(C.LEVEL_NAMES[lvl - 1])}</h2><span class="pill">${need - passed > 0 ? (need - passed) + ' to go' : 'Ready to clear'}</span></div>
          <div class="meter"><i style="width:${Math.min(100, passed / need * 100)}%"></i></div>
          <p class="tiny muted">Pass ${need} assessments at ${st().settings.passMark}% or better to clear the level, earn the ${esc(C.LEVEL_NAMES[lvl - 1])} badge and open the rewards behind it.</p>
          <div class="btn-row"><button class="btn btn-teal" data-act="go" data-route="levels">Open the level map</button></div>
        </div>
        <div class="card stack">
          <div class="section-head"><h2>Second look</h2><span class="pill ${rq ? 'pill-violet' : 'pill-good'}">${rq} waiting</span></div>
          ${rq ? `<p class="tiny muted">Questions you missed come back — reworded, in a different shape — later in the same assessment and at the start of your next one.</p>
            <ul class="tiny" style="margin:0;padding-left:18px">${k.recoveryQueue.slice(0, 5).map(r => `<li><b>${esc(r.subject)}</b> — ${esc(r.prompt || 'a question you missed')}</li>`).join('')}</ul>`
        : '<p class="tiny muted">Nothing waiting. Everything you missed has been answered correctly since.</p>'}
        </div>
      </div>

      ${unlocked ? `<div class="notice notice-good">🎁 You have ${unlocked} reward${unlocked > 1 ? 's' : ''} unlocked and unclaimed. <button class="btn btn-sm btn-teal" data-act="go" data-route="rewards">See them</button></div>` : ''}

      <div class="card">
        <div class="section-head"><h2>Recent runs</h2></div>
        ${k.history.length ? `<div class="tablewrap"><table><thead><tr><th>Date</th><th>Level</th><th>Assessment</th><th>Score</th><th>Result</th><th>XP</th></tr></thead><tbody>
          ${k.history.slice(0, 8).map(h => `<tr><td class="num">${h.at}</td><td class="num">${h.level}</td><td class="num">#${h.index + 1}</td>
            <td class="num">${h.pct}%</td><td><span class="pill ${h.passed ? 'pill-good' : 'pill-warn'}">${h.passed ? 'Passed' : 'Not yet'}</span></td><td class="num">${h.xp}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="muted tiny">No assessments finished yet. Your first run will show up here.</p>'}
      </div>
    </div>`;
  }

  function childLevels() {
    const k = kid(), p = S.ensureProgress(k, k.band), b = bandOf(k.band);
    const need = st().settings.assessmentsToClear;
    return `<div class="stack">
      <div><div class="eyebrow">${esc(b.grades)} · ${esc(b.ages)}</div><h1>Level map</h1>
      <p class="muted">Ten levels, twenty-five assessments in each, fifty questions a time.</p></div>
      <div class="card"><div class="trail">
        ${Array.from({ length: E.LEVELS }, (_, i) => {
      const lv = i + 1, done = !!p.cleared[lv], open = lv <= p.level;
      const passed = ((p.passedInLevel || {})[lv] || []).length;
      return `<div class="trail-row">
            <button class="node ${done ? 'done' : open ? 'open' : 'locked'}" ${open ? '' : 'disabled'} data-act="openlevel" data-lv="${lv}" aria-label="Level ${lv}">
              ${lv}${open ? '' : '<span class="lock">🔒</span>'}</button>
            <div class="trail-meta">
              <b>${esc(C.LEVEL_NAMES[i])} ${done ? '· cleared' : open ? '· open' : '· locked'}</b>
              <div class="meter"><i style="width:${Math.min(100, (done ? need : passed) / need * 100)}%"></i></div>
              <span class="tiny muted">${done ? 'Badge earned ' + p.cleared[lv].at : open ? passed + ' of ' + need + ' assessments passed' : 'Clear level ' + i + ' to open this'}</span>
            </div></div>`;
    }).join('')}
      </div></div>
    </div>`;
  }

  function levelSheet(lv) {
    const k = kid(), p = S.ensureProgress(k, k.band);
    const passedArr = (p.passedInLevel || {})[lv] || [];
    return `<div class="modal-bg" data-act="closemodal"><div class="modal stack" data-stop="1">
      <div class="between"><h2>Level ${lv} — ${esc(C.LEVEL_NAMES[lv - 1])}</h2><button class="btn btn-sm btn-ghost" data-act="closemodal">Close</button></div>
      <p class="tiny muted">Each one is a different fifty-question mix. Green means you have already passed it.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:8px">
        ${Array.from({ length: E.ASSESS_PER_LEVEL }, (_, i) => {
      const a = p.attempts[`L${lv}A${i}`], ok = passedArr.includes(i);
      return `<button class="btn btn-sm ${ok ? 'btn-teal' : a ? 'btn-ghost' : ''}" data-act="startexam" data-lv="${lv}" data-ix="${i}" title="${a ? 'Best ' + a.best + '%' : 'Not attempted'}">${i + 1}</button>`;
    }).join('')}
      </div>
    </div></div>`;
  }

  function childQuizzes() {
    return `<div class="stack">
      <div><div class="eyebrow">Open any time · not tied to a level</div><h1>Power quizzes</h1>
      <p class="muted">Twenty hundred-question runs in science and mathematics, for when you want a long stretch in one subject.</p></div>
      ${['Middle School', 'High School'].map(t => `<div class="card stack">
        <div class="section-head"><h2>${t}</h2><span class="pill">${C.QUIZZES.filter(q => q.tier === t).length} quizzes · 100 questions each</span></div>
        <div class="grid g2">
          ${C.QUIZZES.filter(q => q.tier === t).map(q => `<div class="card-flat stack" style="gap:8px">
            <div class="between"><b style="font-family:var(--display);font-size:1rem">${esc(q.title)}</b>
              <span class="pill ${q.subject === 'Science' ? 'pill-teal' : 'pill-violet'}">${esc(q.subject)}</span></div>
            <p class="tiny muted">${esc(q.blurb)}</p>
            <div><button class="btn btn-sm btn-primary" data-act="startquiz" data-id="${q.id}">Start quiz</button></div>
          </div>`).join('')}
        </div></div>`).join('')}
    </div>`;
  }

  function childBadges() {
    const k = kid();
    const earned = new Set(k.badges.map(b => b.band + ':' + b.level));
    return `<div class="stack">
      <div><div class="eyebrow">One badge for every level cleared</div><h1>Badge shelf</h1>
      <p class="muted">Download any badge you have earned as a wallpaper, or order it printed on a sticker sheet, a cup or a bottle.</p></div>
      ${C.ACTIVE_BANDS.map(b => `<div class="card stack">
        <div class="section-head"><h2>${esc(b.name)}</h2><span class="pill">${esc(b.grades)}</span></div>
        <div class="badge-grid">
          ${Array.from({ length: E.LEVELS }, (_, i) => {
      const lv = i + 1, has = earned.has(b.id + ':' + lv);
      return `<div class="badge-cell ${has ? '' : 'locked'}">
              ${E.badgeArt(b.id, lv, 118)}<b>${esc(C.LEVEL_NAMES[i])}</b><span class="tiny muted">Level ${lv}</span>
              ${has ? `<div class="btn-row" style="justify-content:center;gap:6px">
                  <button class="btn btn-sm btn-teal" data-act="wallpaper" data-band="${b.id}" data-lv="${lv}">Wallpaper</button>
                  <button class="btn btn-sm btn-ghost" data-act="printorder" data-band="${b.id}" data-lv="${lv}">Print</button></div>`
          : '<span class="pill">Locked</span>'}</div>`;
    }).join('')}
        </div></div>`).join('')}
    </div>`;
  }

  function childRewards() {
    const k = kid(), list = S.rewardsFor(k.id), grants = S.grantsFor(k.id);
    const groups = [['platform', 'From QuestQuiz', 'Paid for by the platform.'], ['partner', 'From partners', 'Digital codes and physical goods from sponsors.'], ['personal', 'From your family', 'Set by a parent, just for you.']];
    return `<div class="stack">
      <div><div class="eyebrow">Unlocked by clearing levels</div><h1>Rewards</h1></div>
      ${groups.map(([tier, title, sub]) => {
      const items = list.filter(r => r.tier === tier);
      if (!items.length) return '';
      return `<div class="card stack">
          <div class="section-head"><h2>${title}</h2><span class="pill">${esc(sub)}</span></div>
          <div class="grid g2">${items.map(r => `<div class="rw rw-tier-${tier} ${r.unlocked ? '' : 'locked'}">
            <div class="rw-top"><b>${esc(r.title)}</b><span class="pill ${r.unlocked ? 'pill-good' : ''}">${r.unlocked ? 'Unlocked' : 'Level ' + r.level}</span></div>
            <p class="tiny muted">${esc(r.desc)}</p>
            <div class="between"><span class="tiny muted">${esc(r.sponsor || 'Your family')}</span>
            ${r.claimed ? '<span class="pill pill-teal">Claimed</span>' : r.unlocked ? `<button class="btn btn-sm btn-primary" data-act="claim" data-id="${r.id}">Claim</button>` : ''}</div>
          </div>`).join('')}</div></div>`;
    }).join('')}
      <div class="card"><div class="section-head"><h2>What you have claimed</h2></div>
        ${grants.length ? `<div class="tablewrap"><table><thead><tr><th>Reward</th><th>Type</th><th>Claimed</th><th>Status</th><th>Detail</th></tr></thead><tbody>
          ${grants.map(g => `<tr><td>${esc(g.reward.title)}</td><td>${esc(g.reward.tier)}</td><td class="num">${g.at}</td>
            <td><span class="pill ${g.status === 'granted' ? 'pill-good' : g.status === 'awaiting parent' ? 'pill-warn' : 'pill-teal'}">${esc(g.status)}</span></td>
            <td class="mono tiny">${esc(g.note || '—')}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="tiny muted">Nothing claimed yet.</p>'}
      </div>
    </div>`;
  }

  function childMe() {
    const k = kid();
    return `<div class="stack">
      <div><div class="eyebrow">Grade ${esc(k.grade)} · ${esc(bandOf(k.band).name)}</div><h1>My progress</h1></div>
      <div class="grid g4">
        <div class="stat"><b class="mono">${k.history.length}</b><span>Assessments done</span></div>
        <div class="stat"><b class="mono">${k.history.filter(h => h.passed).length}</b><span>Passed</span></div>
        <div class="stat"><b class="mono">${k.history.length ? Math.round(k.history.reduce((s, h) => s + h.pct, 0) / k.history.length) : 0}%</b><span>Average score</span></div>
        <div class="stat"><b class="mono">${k.history.reduce((s, h) => s + (h.recovered || 0), 0)}</b><span>Questions recovered</span></div>
      </div>
      <div class="card stack"><div class="section-head"><h2>Score over time</h2><span class="pill">Most recent first</span></div>
        ${k.history.length ? sparkTable(k.history) : '<p class="tiny muted">Finish an assessment and the run-by-run picture builds here.</p>'}</div>
      <div class="card stack">
        <div class="section-head"><h2>Still to revisit</h2><span class="pill pill-violet">${k.recoveryQueue.length} questions</span></div>
        ${k.recoveryQueue.length ? `<div class="tablewrap"><table><thead><tr><th>Subject</th><th>What it covers</th><th>Forms seen</th></tr></thead><tbody>
          ${k.recoveryQueue.map(r => `<tr><td>${esc(r.subject)}</td><td>${esc(r.prompt || '—')}</td><td class="num">${(r.formsSeen || []).length}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="tiny muted">Clear — nothing outstanding.</p>'}
      </div>
    </div>`;
  }

  function sparkTable(hist) {
    return `<div class="stack" style="gap:7px">${hist.slice(0, 12).map(h => `
      <div class="row" style="gap:10px;flex-wrap:nowrap">
        <span class="mono tiny muted" style="flex:0 0 78px">${h.at}</span>
        <span class="tiny" style="flex:0 0 64px">L${h.level}·#${h.index + 1}</span>
        <span class="meter" style="flex:1;min-width:90px"><i style="width:${h.pct}%;background:${h.passed ? 'var(--good)' : 'var(--warn)'}"></i></span>
        <span class="mono tiny" style="flex:0 0 42px;text-align:right;font-weight:800">${h.pct}%</span>
      </div>`).join('')}</div>`;
  }

  /* ============================================================
     EXAM
     ============================================================ */
  function examVerify() {
    return `<div class="modal-bg"><div class="modal stack" data-stop="1">
      <div><div class="eyebrow">Identity check</div><h2>Confirm it is you</h2></div>
      <p class="tiny muted">Every assessment starts with a PIN check, so results are always tied to the right learner.</p>
      ${pub.error ? `<div class="notice notice-bad">${esc(pub.error)}</div>` : ''}
      <div class="pindots">${[0, 1, 2, 3].map(i => `<i class="${pub.pin.length > i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="pinpad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-act="epin" data-n="${n}">${n}</button>`).join('')}
        <button data-act="epinclear">✕</button><button data-act="epin" data-n="0">0</button><button data-act="epinback">⌫</button>
      </div>
      <p class="tiny muted center">Demo PIN: <span class="demo-key">${kid().pin}</span></p>
      <button class="btn btn-ghost" data-act="cancelexam">Not now</button>
    </div></div>`;
  }

  function examTitle(s) {
    if (s.mode === 'quiz') return s.meta.quiz.title;
    if (s.mode === 'ap') return `${s.meta.course.name} · ${s.meta.label}`;
    return `Level ${s.meta.level} · Assessment ${s.meta.index + 1}`;
  }

  function examRunner() {
    const s = exam, i = s.cursor;
    if (i >= s.plan.length) return examResult();
    const q = s.plan[i], ans = s.answers[i];
    return `<div class="exam-wrap stack">
      <div class="between">
        <div><div class="eyebrow">${esc(examTitle(s))}</div><h2>Question ${i + 1} of ${s.plan.length}</h2></div>
        <button class="btn btn-sm btn-ghost" data-act="quitexam">Save & leave</button>
      </div>
      <div class="beads" aria-hidden="true">${s.plan.map((_, j) => {
      const a = s.answers[j];
      return `<i class="${j === i ? 'now' : a ? (a.correct ? 'ok' : 'no') : (s.plan[j].reask ? 're' : '')}"></i>`;
    }).join('')}</div>
      <div class="qcard">
        <div class="row" style="gap:7px">
          <span class="pill pill-teal">${esc(q.subject)}</span>
          ${q.unit ? `<span class="pill">Unit ${q.unit}</span>` : ''}
          ${q.reask ? `<span class="pill pill-violet">Second look · asked a different way</span>` : ''}
          ${q.carryOver ? `<span class="pill pill-warn">From last time</span>` : ''}
        </div>
        <div class="qprompt wrapanywhere">${esc(q.prompt)}</div>
        <div class="opts">
          ${q.options.map((o, oi) => {
      let cls = '';
      if (ans) { if (o === q.answer) cls = 'right'; else if (o === ans.choice) cls = 'wrong'; }
      return `<button class="opt ${cls}" ${ans ? 'disabled' : ''} data-act="answer" data-o="${esc(o)}">
              <span class="key">${'ABCD'[oi]}</span><span class="wrapanywhere">${esc(o)}</span></button>`;
    }).join('')}
        </div>
        ${ans ? `<div class="feedback ${ans.correct ? 'fb-good' : 'fb-bad'}">
            <b>${ans.correct ? 'Correct.' : 'Not this time.'}</b> ${esc(q.explain)}
            ${!ans.correct && examView && examView.injected ? `<div class="tiny" style="margin-top:6px">This one comes back at question ${examView.injected.at + 1}, worded differently.</div>` : ''}
          </div>
          <div class="btn-row" style="margin-top:16px"><button class="btn btn-primary btn-lg" data-act="nextq">${i + 1 >= s.plan.length ? 'See my result →' : 'Next question →'}</button></div>` : ''}
      </div>
    </div>`;
  }

  function examResult() {
    const s = exam, sc = E.sessionScore(s), by = E.subjectBreakdown(s);
    const info = s._recorded;
    const isAp = s.mode === 'ap';
    return `<div class="exam-wrap stack">
      <div class="card celebrate">
        ${info && info.levelCleared ? E.badgeArt(s.meta.band, info.levelCleared, 150) : ''}
        <div class="eyebrow">${esc(examTitle(s))}</div>
        <h1>${isAp ? sc.pct + '%' : (sc.passed ? 'Passed.' : 'Not this run.') + ' ' + sc.pct + '%'}</h1>
        <p class="muted">${sc.firstCorrect} of ${sc.total} right first time · ${sc.recovered} recovered on the second look · ${sc.xp} XP earned</p>
        ${isAp && info && info.projected ? `<div class="row" style="gap:14px;align-items:center;justify-content:center">
            <div class="scorebig s${info.projected}"><b>${info.projected}</b><span>projected</span></div>
            <div style="text-align:left;max-width:30ch"><b style="font-family:var(--display)">${esc(AP.SCORE_LABEL[info.projected])}</b>
            <p class="tiny muted">Directional only — real cut points vary by subject and year, and free response is not simulated.</p></div>
          </div>` : ''}
        ${info && info.levelCleared ? `<div class="notice notice-good">🎖️ Level ${info.levelCleared} cleared — the <b>${esc(C.LEVEL_NAMES[info.levelCleared - 1])}</b> badge is on your shelf and the rewards behind it are open.</div>`
        : (!isAp && info) ? `<p class="tiny muted">${info.passedCount} of ${info.need} assessments passed at this level.</p>` : ''}
      </div>

      ${isAp ? apUnitBreakdown(s) : `<div class="card stack">
        <div class="section-head"><h2>By subject</h2><span class="pill">First-attempt answers only</span></div>
        <div class="stack" style="gap:8px">
          ${Object.entries(by).map(([sub, v]) => `<div class="row" style="gap:10px;flex-wrap:nowrap">
            <span class="tiny" style="flex:0 0 150px">${esc(sub)}</span>
            <span class="meter" style="flex:1;min-width:80px"><i style="width:${Math.round(v.right / v.total * 100)}%"></i></span>
            <span class="mono tiny" style="flex:0 0 56px;text-align:right;font-weight:800">${v.right}/${v.total}</span></div>`).join('')}
        </div></div>`}

      ${sc.unresolved.length ? `<div class="card stack">
        <div class="section-head"><h2>Coming back next time</h2><span class="pill pill-violet">${sc.unresolved.length}</span></div>
        <p class="tiny muted">Still unresolved. These will be asked again, reworded into a different form from the one you saw last.</p>
        <ul class="tiny" style="margin:0;padding-left:18px">${sc.unresolved.slice(0, 8).map(u => `<li><b>${esc(u.subject)}</b> — ${esc(u.prompt)}</li>`).join('')}</ul>
      </div>` : '<div class="notice notice-good">Nothing left outstanding — every miss was cleared on the second look.</div>'}

      <div class="btn-row">
        <button class="btn btn-primary" data-act="exitexam">${isAp ? 'Back to the course' : 'Back to the quest board'}</button>
        ${s.mode === 'assessment' ? `<button class="btn btn-ghost" data-act="startexam" data-lv="${s.meta.level}" data-ix="${(s.meta.index + 1) % E.ASSESS_PER_LEVEL}">Next assessment →</button>` : ''}
        ${isAp ? `<button class="btn btn-ghost" data-act="appractice" data-id="${s.meta.course.id}" data-u="${s.meta.unit}">Run another set →</button>` : ''}
      </div>
    </div>`;
  }

  function apUnitBreakdown(s) {
    const by = {};
    s.plan.forEach((q, i) => {
      const a = s.answers[i];
      if (!a || q.reask || !q.unit) return;
      by[q.unit] = by[q.unit] || { right: 0, total: 0 };
      by[q.unit].total++;
      if (a.correct) by[q.unit].right++;
    });
    const course = s.meta.course;
    const keys = Object.keys(by).map(Number).sort((a, b) => a - b);
    if (!keys.length) return '';
    return `<div class="card stack">
      <div class="section-head"><h2>By unit</h2><span class="pill">First-attempt answers only</span></div>
      <div class="stack" style="gap:8px">
        ${keys.map(u => {
      const v = by[u], pct = Math.round(v.right / v.total * 100);
      const unit = course.units.find(x => x.n === u);
      return `<div class="row" style="gap:10px;flex-wrap:nowrap">
            <span class="tiny" style="flex:1;min-width:0">Unit ${u}${unit ? ' · ' + esc(unit.title) : ''}</span>
            <span class="meter" style="flex:0 0 90px"><i style="width:${pct}%;background:${pct >= 75 ? 'var(--good)' : pct >= 55 ? 'var(--warn)' : 'var(--bad)'}"></i></span>
            <span class="mono tiny" style="flex:0 0 46px;text-align:right;font-weight:800">${v.right}/${v.total}</span></div>`;
    }).join('')}
      </div></div>`;
  }

  /* ============================================================
     PARENT
     ============================================================ */
  const parentKids = () => (me().children || []).map(id => st().learners[id]).filter(Boolean);

  function parentHome() {
    const kids = parentKids();
    const links = S.pendingLinksFor(me().email);
    const pend = st().grants.filter(g => g.status === 'awaiting parent' && kids.some(k => k.id === g.learnerId));
    return `<div class="stack">
      <div class="between"><div><div class="eyebrow">Signed in as ${esc(me().email)}</div><h1>Your family</h1></div>
        <button class="btn btn-primary" data-act="addchild">+ Add a learner</button></div>
      ${links.length ? `<div class="notice notice-warn"><b>${links.length} child signup${links.length > 1 ? 's are' : ' is'} waiting for your consent.</b>
        <button class="btn btn-sm btn-primary" data-act="go" data-route="approvals">Review</button></div>` : ''}
      ${pend.length ? `<div class="notice notice-info">${pend.length} family reward${pend.length > 1 ? 's are' : ' is'} waiting to be granted.
        <button class="btn btn-sm btn-teal" data-act="go" data-route="approvals">Review</button></div>` : ''}
      <div class="grid g2">
        ${kids.length ? kids.map(k => {
      const p = S.ensureProgress(k, k.band), need = st().settings.assessmentsToClear;
      const passed = ((p.passedInLevel || {})[p.level] || []).length;
      const avg = k.history.length ? Math.round(k.history.reduce((s, h) => s + h.pct, 0) / k.history.length) : 0;
      const ap = S.ensureAp(k);
      return `<div class="card stack">
            <div class="row"><span style="font-size:2.2rem">${k.avatar}</span>
              <div><b style="font-family:var(--display);font-size:1.2rem">${esc(k.name)}</b>
              <div class="tiny muted">Grade ${esc(k.grade)} · ${esc(bandOf(k.band).name)} · ${k.under13 ? 'under 13 — consent on file' : '13 or older'}</div></div></div>
            <div class="grid g3">
              <div class="stat"><b class="mono">${p.level}</b><span>Level</span></div>
              <div class="stat"><b class="mono">${avg}%</b><span>Average</span></div>
              <div class="stat"><b class="mono">${k.badges.length}</b><span>Badges</span></div>
            </div>
            <div class="meter"><i style="width:${Math.min(100, passed / need * 100)}%"></i></div>
            <div class="tiny muted">${passed} of ${need} assessments passed at level ${p.level}</div>
            ${ap.enrolled.length ? `<div class="row" style="gap:6px">${ap.enrolled.map(courseOf).filter(Boolean).map(c => {
        const s = S.apCourseSummary(k, c.id);
        return `<span class="pill pill-violet">${esc(c.abbr)}${s.projected ? ' · ' + s.projected : ''}</span>`;
      }).join('')}</div>` : ''}
            <div class="btn-row">
              <button class="btn btn-sm btn-teal" data-act="focuskid" data-id="${k.id}" data-route="progress">Progress</button>
              <button class="btn btn-sm btn-ghost" data-act="focuskid" data-id="${k.id}" data-route="myrewards">Rewards</button>
              <button class="btn btn-sm btn-ghost" data-act="focuskid" data-id="${k.id}" data-route="setlevel">Level</button>
            </div></div>`;
    }).join('') : '<div class="card"><p class="muted">No learner profiles yet. Add one to get started.</p></div>'}
      </div>
    </div>`;
  }

  function kidSelector() {
    const kids = parentKids();
    if (!parentFocus || !kids.some(k => k.id === parentFocus)) parentFocus = kids[0] && kids[0].id;
    return `<div class="row" style="gap:8px">${kids.map(k => `<button class="btn btn-sm ${parentFocus === k.id ? 'btn-primary' : 'btn-ghost'}" data-act="focuskid" data-id="${k.id}">${k.avatar} ${esc(k.name)}</button>`).join('')}</div>`;
  }

  function parentProgress() {
    const k = st().learners[parentFocus] || parentKids()[0];
    if (!k) return '<p class="muted">No learner profiles yet.</p>';
    const p = S.ensureProgress(k, k.band), ap = S.ensureAp(k);
    return `<div class="stack">
      <div><div class="eyebrow">Parent view</div><h1>Progress</h1></div>
      ${kidSelector()}
      <div class="grid g4">
        <div class="stat"><b class="mono">${p.level}</b><span>Current level</span></div>
        <div class="stat"><b class="mono">${k.history.length}</b><span>Assessments</span></div>
        <div class="stat"><b class="mono">${k.history.length ? Math.round(k.history.reduce((s, h) => s + h.pct, 0) / k.history.length) : 0}%</b><span>Average</span></div>
        <div class="stat"><b class="mono">${k.recoveryQueue.length}</b><span>To revisit</span></div>
      </div>
      ${ap.enrolled.length ? `<div class="card stack">
        <div class="section-head"><h2>AP courses</h2><span class="pill pill-violet">${daysToExam()} days to the exam window</span></div>
        <div class="tablewrap"><table><thead><tr><th>Course</th><th>Practice</th><th>Mastery</th><th>Projected</th><th>Weakest unit</th></tr></thead><tbody>
          ${ap.enrolled.map(courseOf).filter(Boolean).map(c => {
      const s = S.apCourseSummary(k, c.id);
      const weak = Object.entries(s.rec.units).map(([u, v]) => ({ u, pct: Math.round(v.right / v.total * 100) })).sort((a, b) => a.pct - b.pct)[0];
      return `<tr><td><b>${esc(c.name)}</b></td><td class="num">${s.sets.length} sets</td>
              <td class="num">${s.pct === null ? '—' : s.pct + '%'}</td>
              <td>${s.projected ? `<span class="scorechip s${s.projected}">${s.projected}</span>` : '—'}</td>
              <td class="tiny">${weak ? 'Unit ' + weak.u + ' · ' + weak.pct + '%' : '—'}</td></tr>`;
    }).join('')}
        </tbody></table></div></div>` : ''}
      <div class="card stack"><div class="section-head"><h2>Run history</h2></div>
        ${k.history.length ? sparkTable(k.history) : '<p class="tiny muted">Nothing finished yet.</p>'}</div>
      <div class="card stack">
        <div class="section-head"><h2>Where ${esc(k.name)} is losing marks</h2><span class="pill pill-violet">${k.recoveryQueue.length} queued</span></div>
        ${k.recoveryQueue.length ? `<div class="tablewrap"><table><thead><tr><th>Subject</th><th>Topic</th><th>Times re-asked</th></tr></thead><tbody>
          ${k.recoveryQueue.map(r => `<tr><td>${esc(r.subject)}</td><td>${esc(r.prompt || '—')}</td><td class="num">${(r.formsSeen || []).length}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="tiny muted">Nothing outstanding.</p>'}
      </div>
      <div class="card stack"><div class="section-head"><h2>Badges earned</h2></div>
        ${k.badges.length ? `<div class="badge-grid">${k.badges.map(b => `<div class="badge-cell">${E.badgeArt(b.band, b.level, 100)}<b>${esc(C.LEVEL_NAMES[b.level - 1])}</b><span class="tiny muted">${b.at}</span></div>`).join('')}</div>`
        : '<p class="tiny muted">No badges yet.</p>'}</div>
    </div>`;
  }

  function parentSetLevel() {
    const k = st().learners[parentFocus] || parentKids()[0];
    if (!k) return '<p class="muted">No learner profiles yet.</p>';
    const p = S.ensureProgress(k, k.band);
    return `<div class="stack">
      <div><div class="eyebrow">Parent view</div><h1>Level & pacing</h1>
      <p class="muted">Move a child up or down a level, or switch the grade band if the default is too easy or too hard.</p></div>
      ${kidSelector()}
      <div class="card stack">
        <div class="section-head"><h2>${esc(k.name)} — level ${p.level} of ${E.LEVELS}</h2><span class="pill">${esc(bandOf(k.band).grades)}</span></div>
        <label class="field">Working level<input type="range" id="lvslider" min="1" max="${E.LEVELS}" value="${p.level}" style="width:100%"></label>
        <div class="between"><span class="tiny muted">1 · ${esc(C.LEVEL_NAMES[0])}</span><span class="tiny muted">${E.LEVELS} · ${esc(C.LEVEL_NAMES[E.LEVELS - 1])}</span></div>
        <div class="btn-row"><button class="btn btn-primary" data-act="savelevel" data-id="${k.id}">Set the level</button></div>
        <hr class="hr">
        <label class="field">Grade band
          <select id="bandsel">${C.ACTIVE_BANDS.map(b => `<option value="${b.id}" ${b.id === k.band ? 'selected' : ''}>${esc(b.name)} · ${esc(b.grades)} · ${esc(b.ages)}</option>`).join('')}</select></label>
        <div class="btn-row"><button class="btn btn-ghost" data-act="saveband" data-id="${k.id}">Change band</button></div>
        <p class="tiny muted">Changing the band keeps the badges already earned and starts a fresh level track in the new band.</p>
      </div>
    </div>`;
  }

  function parentRewards() {
    const k = st().learners[parentFocus] || parentKids()[0];
    if (!k) return '<p class="muted">No learner profiles yet.</p>';
    const mine = st().rewards.filter(r => r.tier === 'personal' && r.childId === k.id);
    return `<div class="stack">
      <div><div class="eyebrow">Parent view</div><h1>Family rewards</h1>
      <p class="muted">Rewards only your family sees. Attach one to a level — extra screen time, choosing dinner, a later bedtime. When the level is cleared, ${esc(k.name)} claims it and it lands in your approvals queue.</p></div>
      ${kidSelector()}
      <div class="card stack">
        <div class="section-head"><h2>Add a reward for ${esc(k.name)}</h2></div>
        <form class="stack" data-act="addpersonal" data-id="${k.id}">
          <div class="grid g2">
            <label class="field">Reward<input type="text" id="pr-title" required placeholder="30 minutes extra screen time"></label>
            <label class="field">Unlocks at level
              <select id="pr-level">${Array.from({ length: E.LEVELS }, (_, i) => `<option value="${i + 1}">Level ${i + 1} — ${esc(C.LEVEL_NAMES[i])}</option>`).join('')}</select></label>
          </div>
          <label class="field">Conditions or notes<input type="text" id="pr-desc" placeholder="Only on a weekend, and homework has to be done first"></label>
          <div><button class="btn btn-primary" type="submit">Add reward</button></div>
        </form>
      </div>
      <div class="card stack">
        <div class="section-head"><h2>Active family rewards</h2><span class="pill">${mine.length}</span></div>
        ${mine.length ? `<div class="grid g2">${mine.map(r => `<div class="rw rw-tier-personal">
          <div class="rw-top"><b>${esc(r.title)}</b><span class="pill pill-accent">Level ${r.level}</span></div>
          <p class="tiny muted">${esc(r.desc || '—')}</p>
          <div><button class="btn btn-sm btn-ghost" data-act="delpersonal" data-id="${r.id}">Remove</button></div></div>`).join('')}</div>`
        : '<p class="tiny muted">None yet.</p>'}
      </div>
    </div>`;
  }

  function parentApprovals() {
    const kids = parentKids();
    const links = S.pendingLinksFor(me().email);
    const all = st().grants.filter(g => kids.some(k => k.id === g.learnerId))
      .map(g => ({ ...g, reward: st().rewards.find(r => r.id === g.rewardId), kid: st().learners[g.learnerId] })).filter(g => g.reward);
    const pend = all.filter(g => g.status === 'awaiting parent');
    return `<div class="stack">
      <div><div class="eyebrow">Parent view</div><h1>Approvals</h1></div>

      <div class="card stack">
        <div class="section-head"><h2>Child signups waiting for consent</h2><span class="pill ${links.length ? 'pill-warn' : 'pill-good'}">${links.length}</span></div>
        ${links.length ? links.map(r => `<div class="card-flat stack">
          <div class="between"><div><b style="font-family:var(--display);font-size:1.05rem">${r.avatar} ${esc(r.childName)}</b>
            <div class="tiny muted">Grade ${esc(r.grade)} · born ${r.birthYear} · requested ${r.at}${r.schoolCode ? ' · school code ' + esc(r.schoolCode) : ''}</div></div>
            <span class="pill pill-warn">Under 13</span></div>
          <p class="tiny muted">${esc(r.childName)} asked to join QuestQuiz. Nothing has been created yet. Approving this records your verifiable parental consent and creates the profile under your account.</p>
          <div class="card-flat" style="background:var(--surface)">
            ${S.CONSENT_ITEMS.map(ci => `<label class="checkline">
              <input type="checkbox" data-consent="${ci.id}" data-req="${r.id}" ${ci.required ? 'data-required="1"' : ''}>
              <span>${esc(ci.label)} ${ci.required ? '<span class="req">required</span>' : '<span class="muted">optional</span>'}</span></label>`).join('')}
          </div>
          <div class="btn-row"><button class="btn btn-primary" data-act="approvelink" data-id="${r.id}">Give consent and create the profile</button>
          <button class="btn btn-ghost" data-act="declinelink" data-id="${r.id}">Decline</button></div>
        </div>`).join('') : '<p class="tiny muted">Nothing waiting.</p>'}
      </div>

      <div class="card stack">
        <div class="section-head"><h2>Rewards waiting to be granted</h2><span class="pill ${pend.length ? 'pill-warn' : 'pill-good'}">${pend.length}</span></div>
        ${pend.length ? pend.map(g => `<div class="card-flat between">
          <div><b>${esc(g.reward.title)}</b><div class="tiny muted">${g.kid.avatar} ${esc(g.kid.name)} · claimed ${g.at}</div>
          <div class="tiny muted">${esc(g.reward.desc || '')}</div></div>
          <div class="btn-row"><button class="btn btn-sm btn-primary" data-act="grant" data-id="${g.id}">Grant it</button>
          <button class="btn btn-sm btn-ghost" data-act="declinegrant" data-id="${g.id}">Not now</button></div></div>`).join('')
        : '<p class="tiny muted">Nothing waiting.</p>'}
      </div>

      <div class="card stack"><div class="section-head"><h2>History</h2></div>
        <div class="tablewrap"><table><thead><tr><th>Child</th><th>Reward</th><th>Type</th><th>Date</th><th>Status</th></tr></thead><tbody>
          ${all.map(g => `<tr><td>${g.kid.avatar} ${esc(g.kid.name)}</td><td>${esc(g.reward.title)}</td><td>${esc(g.reward.tier)}</td>
            <td class="num">${g.at}</td><td><span class="pill ${g.status === 'granted' ? 'pill-good' : g.status === 'declined' ? 'pill-bad' : g.status === 'awaiting parent' ? 'pill-warn' : 'pill-teal'}">${esc(g.status)}</span></td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
  }

  function parentOrders() {
    const kids = parentKids().map(k => k.id);
    const orders = st().orders.filter(o => kids.includes(o.learnerId));
    return `<div class="stack">
      <div><div class="eyebrow">Parent view</div><h1>Print orders</h1></div>
      <div class="card">
        ${orders.length ? `<div class="tablewrap"><table><thead><tr><th>Order</th><th>Child</th><th>Badge</th><th>Item</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead><tbody>
          ${orders.map(o => `<tr><td class="mono">${o.id}</td><td>${esc((st().learners[o.learnerId] || {}).name || '—')}</td>
            <td>${esc(C.LEVEL_NAMES[o.level - 1])} · L${o.level}</td><td>${esc(o.product)}</td><td class="num">${o.qty}</td>
            <td class="num">$${o.price.toFixed(2)}</td><td><span class="pill">${esc(o.status)}</span></td></tr>`).join('')}
        </tbody></table></div>` : '<p class="tiny muted">No orders yet. Badges can be ordered from a child\'s badge shelf.</p>'}
      </div>
      <div class="notice notice-info">Payment capture and print fulfilment are not connected in this build. Orders placed here are recorded so the queue can be tested.</div>
    </div>`;
  }

  function parentPrivacy() {
    const kids = parentKids();
    return `<div class="stack">
      <div><div class="eyebrow">Parent view</div><h1>Consent & data</h1></div>
      ${kids.map(k => `<div class="card stack">
        <div class="section-head"><h2>${k.avatar} ${esc(k.name)}</h2>
          <span class="pill ${k.under13 ? 'pill-warn' : ''}">${k.under13 ? 'Under 13 — COPPA applies' : '13 or older'}</span></div>
        <div class="tablewrap"><table><thead><tr><th>Consent</th><th>State</th></tr></thead><tbody>
          ${S.CONSENT_ITEMS.map(ci => {
      const on = k.consent && k.consent.items && k.consent.items[ci.id];
      return `<tr><td>${esc(ci.label)}</td><td><span class="pill ${on ? 'pill-good' : ''}">${on ? 'Given' : 'Not given'}</span>
              ${ci.required ? '' : `<button class="btn btn-sm btn-ghost" data-act="toggleconsent" data-id="${k.id}" data-c="${ci.id}">${on ? 'Withdraw' : 'Give'}</button>`}</td></tr>`;
    }).join('')}
        </tbody></table></div>
        <p class="tiny muted">Recorded ${k.consent ? new Date(k.consent.at).toLocaleString() : '—'} by ${esc(k.consent ? k.consent.by : '—')} · policy version ${esc(k.consent ? k.consent.version : '—')}</p>
        <div class="btn-row">
          <button class="btn btn-sm btn-ghost" data-act="exportkid" data-id="${k.id}">Download this child's data</button>
          <button class="btn btn-sm btn-ghost" data-act="deletekid" data-id="${k.id}">Delete this profile</button>
        </div>
      </div>`).join('')}
      <div class="card stack">
        <h2>What is collected, and what is not</h2>
        <div class="grid g2">
          <div class="card-flat"><b>Collected</b><ul class="tiny" style="margin:6px 0 0;padding-left:18px">
            <li>First name and avatar</li><li>Grade and year of birth</li><li>Assessment answers, scores and timestamps</li>
            <li>Badges, rewards claimed, print orders</li><li>Parent email and school code if supplied</li></ul></div>
          <div class="card-flat"><b>Never collected</b><ul class="tiny" style="margin:6px 0 0;padding-left:18px">
            <li>Home address or phone number for a child</li><li>Photographs, voice or video</li><li>Precise location</li>
            <li>Advertising or cross-site tracking identifiers</li><li>Contacts or social accounts</li></ul></div>
        </div>
        <div class="notice notice-info">Behavioural advertising is disabled platform-wide with no setting that turns it on for a learner profile. Reward partners receive a first name and a level only, on redemption, and only if that optional consent is on.</div>
      </div>
    </div>`;
  }

  /* ============================================================
     SCHOOL
     ============================================================ */
  const schoolKids = () => Object.values(st().learners).filter(l => l.schoolId === me().schoolId);

  function schoolHome() {
    const kids = schoolKids(), school = st().schools[me().schoolId];
    const avg = kids.length ? Math.round(kids.reduce((s, k) => s + (k.history.length ? k.history.reduce((a, h) => a + h.pct, 0) / k.history.length : 0), 0) / kids.length) : 0;
    const byBand = {};
    kids.forEach(k => { byBand[k.band] = (byBand[k.band] || 0) + 1; });
    const apCount = kids.reduce((s, k) => s + S.ensureAp(k).enrolled.length, 0);
    return `<div class="stack">
      <div><div class="eyebrow">${esc(school.district)}</div><h1>${esc(school.name)}</h1>
      <p class="muted">Class code <span class="demo-key">${esc(school.code)}</span> — parents enter this when they set up a learner, which is what links a child to this roster.</p></div>
      <div class="grid g4">
        <div class="stat"><b class="mono">${kids.length}</b><span>Learners linked</span></div>
        <div class="stat"><b class="mono">${avg}%</b><span>Cohort average</span></div>
        <div class="stat"><b class="mono">${apCount}</b><span>AP enrolments</span></div>
        <div class="stat"><b class="mono">${kids.reduce((s, k) => s + k.history.length, 0)}</b><span>Assessments taken</span></div>
      </div>
      <div class="card stack">
        <div class="section-head"><h2>Where the cohort sits</h2><span class="pill">By grade band</span></div>
        <div class="stack" style="gap:8px">
          ${C.ACTIVE_BANDS.map(b => { const n = byBand[b.id] || 0; return `<div class="row" style="gap:10px;flex-wrap:nowrap">
            <span class="tiny" style="flex:0 0 160px">${esc(b.name)} · ${esc(b.grades)}</span>
            <span class="meter" style="flex:1;min-width:80px"><i style="width:${kids.length ? n / kids.length * 100 : 0}%"></i></span>
            <span class="mono tiny" style="flex:0 0 32px;text-align:right;font-weight:800">${n}</span></div>`; }).join('')}
        </div>
      </div>
      <div class="notice notice-info">A school sees names, grades, levels and scores for learners whose parent entered this class code and left school-sharing consent on. It cannot see a parent's email, a family reward, or anything consent has been withdrawn for.</div>
    </div>`;
  }

  function schoolRoster() {
    const kids = schoolKids();
    return `<div class="stack">
      <div><div class="eyebrow">Roster</div><h1>Learners</h1></div>
      <div class="card"><div class="tablewrap"><table><thead><tr><th>Learner</th><th>Grade</th><th>Band</th><th>Level</th><th>Assessments</th><th>Average</th><th>AP</th><th>To revisit</th></tr></thead><tbody>
        ${kids.map(k => {
      const p = S.ensureProgress(k, k.band);
      const avg = k.history.length ? Math.round(k.history.reduce((s, h) => s + h.pct, 0) / k.history.length) : 0;
      const ap = S.ensureAp(k);
      return `<tr><td>${k.avatar} ${esc(k.name)}</td><td class="num">${esc(k.grade)}</td><td>${esc(bandOf(k.band).name)}</td>
          <td class="num">${p.level}</td><td class="num">${k.history.length}</td><td class="num">${avg}%</td>
          <td class="tiny">${ap.enrolled.length ? ap.enrolled.map(c => (courseOf(c) || {}).abbr).join(', ') : '—'}</td>
          <td class="num">${k.recoveryQueue.length}</td></tr>`;
    }).join('')}
      </tbody></table></div></div>
    </div>`;
  }

  function schoolSubjects() {
    const kids = schoolKids();
    const by = {};
    kids.forEach(k => k.recoveryQueue.forEach(r => { by[r.subject] = (by[r.subject] || 0) + 1; }));
    const max = Math.max(1, ...Object.values(by));
    return `<div class="stack">
      <div><div class="eyebrow">Diagnostics</div><h1>Subject strength</h1>
      <p class="muted">Built from questions learners are still carrying in their recovery queue — the topics the cohort keeps missing across re-asks.</p></div>
      <div class="card stack">
        ${Object.keys(by).length ? Object.entries(by).sort((a, b) => b[1] - a[1]).map(([sub, n]) => `<div class="row" style="gap:10px;flex-wrap:nowrap">
          <span class="tiny" style="flex:0 0 170px">${esc(sub)}</span>
          <span class="meter" style="flex:1;min-width:80px"><i style="width:${n / max * 100}%;background:var(--warn)"></i></span>
          <span class="mono tiny" style="flex:0 0 32px;text-align:right;font-weight:800">${n}</span></div>`).join('')
        : '<p class="tiny muted">Nothing outstanding across the cohort.</p>'}
      </div>
    </div>`;
  }

  function schoolCodes() {
    const school = st().schools[me().schoolId];
    return `<div class="stack">
      <div><div class="eyebrow">Onboarding</div><h1>Class codes</h1></div>
      <div class="card stack">
        <div class="between"><div><b style="font-family:var(--display);font-size:1.3rem">${esc(school.code)}</b>
          <div class="tiny muted">Share this with families. A parent or a student aged 13+ enters it during signup.</div></div>
          <span class="pill pill-good">Active</span></div>
        <hr class="hr">
        <p class="tiny muted">A class code links a learner to this school's roster. It does not create an account and it does not bypass parental consent — a parent still completes the consent step, including verifiable consent for a child under 13.</p>
      </div>
    </div>`;
  }

  /* ============================================================
     ADMIN
     ============================================================ */
  function adminSchools() {
    const q = st().pendingSchools;
    const pending = q.filter(p => p.status === 'pending');
    return `<div class="stack">
      <div><div class="eyebrow">Platform</div><h1>School approvals</h1>
      <p class="muted">Every school registration is reviewed by hand. Approving one creates the school, issues a class code and activates the contact's sign-in.</p></div>
      <div class="card stack">
        <div class="section-head"><h2>Waiting for review</h2><span class="pill ${pending.length ? 'pill-warn' : 'pill-good'}">${pending.length}</span></div>
        ${pending.length ? pending.map(p => `<div class="card-flat stack">
          <div class="between"><div><b style="font-family:var(--display);font-size:1.1rem">${esc(p.schoolName)}</b>
            <div class="tiny muted">${esc(p.district)} · approx. ${esc(p.students)} students · submitted ${p.at}</div></div>
            <span class="pill pill-warn">Pending</span></div>
          <div class="tablewrap"><table><tbody>
            <tr><td>Contact</td><td>${esc(p.contactName)}, ${esc(p.role)}</td></tr>
            <tr><td>Email</td><td class="mono tiny">${esc(p.email)}</td></tr>
            <tr><td>Phone</td><td class="mono tiny">${esc(p.phone)}</td></tr>
          </tbody></table></div>
          <div class="notice notice-info">Check before approving: does the email domain belong to the school, and is this person authorised to enrol students?</div>
          <div class="btn-row"><button class="btn btn-primary" data-act="approveschool" data-id="${p.id}">Approve and issue a class code</button>
          <button class="btn btn-ghost" data-act="rejectschool" data-id="${p.id}">Reject</button></div>
        </div>`).join('') : '<p class="tiny muted">Nothing waiting.</p>'}
      </div>
      <div class="card stack"><div class="section-head"><h2>Decided</h2></div>
        ${q.filter(p => p.status !== 'pending').length ? `<div class="tablewrap"><table><thead><tr><th>School</th><th>Contact</th><th>Submitted</th><th>Outcome</th></tr></thead><tbody>
          ${q.filter(p => p.status !== 'pending').map(p => `<tr><td>${esc(p.schoolName)}</td><td class="tiny">${esc(p.email)}</td><td class="num tiny">${p.at}</td>
            <td><span class="pill ${p.status === 'approved' ? 'pill-good' : 'pill-bad'}">${esc(p.status)}</span>${p.reason ? ' <span class="tiny muted">' + esc(p.reason) + '</span>' : ''}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="tiny muted">Nothing decided yet.</p>'}
      </div>
    </div>`;
  }

  function adminHome() {
    const s = st();
    const learners = Object.values(s.learners);
    const pending = s.pendingSchools.filter(p => p.status === 'pending').length;
    const links = s.linkRequests.filter(r => r.status === 'awaiting parent').length;
    const apEnrol = learners.reduce((n, l) => n + S.ensureAp(l).enrolled.length, 0);
    return `<div class="stack">
      <div><div class="eyebrow">Platform</div><h1>Dashboard</h1></div>
      ${pending ? `<div class="notice notice-warn">${pending} school registration${pending > 1 ? 's are' : ' is'} waiting for review.
        <button class="btn btn-sm btn-primary" data-act="go" data-route="schools">Open the queue</button></div>` : ''}
      <div class="grid g4">
        <div class="stat"><b class="mono">${learners.length}</b><span>Learner profiles</span></div>
        <div class="stat"><b class="mono">${Object.values(s.users).filter(u => u.role === 'parent').length}</b><span>Parent accounts</span></div>
        <div class="stat"><b class="mono">${Object.keys(s.schools).length}</b><span>Approved schools</span></div>
        <div class="stat"><b class="mono">${apEnrol}</b><span>AP enrolments</span></div>
      </div>
      <div class="grid g2">
        <div class="card stack">
          <div class="section-head"><h2>Content bank</h2><span class="pill pill-teal">Live</span></div>
          <div class="tablewrap"><table><tbody>
            <tr><td>Grade bands</td><td class="num">${C.ACTIVE_BANDS.length}</td></tr>
            <tr><td>Levels per band</td><td class="num">${E.LEVELS}</td></tr>
            <tr><td>Assessments per level</td><td class="num">${E.ASSESS_PER_LEVEL}</td></tr>
            <tr><td>Questions per assessment</td><td class="num">${E.QUESTIONS}</td></tr>
            <tr><td>Question slots per band</td><td class="num">${(E.LEVELS * E.ASSESS_PER_LEVEL * E.QUESTIONS).toLocaleString()}</td></tr>
            <tr><td>Power quizzes</td><td class="num">${C.QUIZZES.length} × 100</td></tr>
            <tr><td>AP courses</td><td class="num">${AP.AP_COURSES.length}</td></tr>
          </tbody></table></div>
        </div>
        <div class="card stack">
          <div class="section-head"><h2>Verification and policy</h2><span class="pill pill-good">Enforced</span></div>
          <div class="tablewrap"><table><tbody>
            <tr><td>School registrations pending</td><td class="num">${pending}</td></tr>
            <tr><td>Under-13 signups awaiting a parent</td><td class="num">${links}</td></tr>
            <tr><td>Behavioural advertising</td><td><span class="pill pill-good">Off</span></td></tr>
            <tr><td>Third-party analytics</td><td><span class="pill pill-good">Off</span></td></tr>
            <tr><td>PIN check before every exam</td><td><span class="pill ${s.settings.requirePinEveryExam ? 'pill-good' : 'pill-warn'}">${s.settings.requirePinEveryExam ? 'On' : 'Off'}</span></td></tr>
            <tr><td>Data retention</td><td class="num">${s.settings.dataRetentionMonths} months</td></tr>
            <tr><td>Consent policy version</td><td class="mono">${esc(s.settings.consentVersion)}</td></tr>
          </tbody></table></div>
        </div>
      </div>
      <div class="card stack"><div class="section-head"><h2>Recent activity</h2></div>
        <div class="tablewrap"><table><thead><tr><th>When</th><th>Actor</th><th>Action</th></tr></thead><tbody>
          ${s.audit.slice(0, 12).map(a => `<tr><td class="num tiny">${new Date(a.at).toLocaleString()}</td><td class="tiny">${esc(a.actor)}</td><td class="tiny">${esc(a.action)}</td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
  }

  function adminRewards() {
    const s = st();
    return `<div class="stack">
      <div><div class="eyebrow">Platform</div><h1>Rewards</h1>
      <p class="muted">Three streams: what QuestQuiz funds, what partners supply, and what parents set at home. The first two are configured here.</p></div>
      <div class="card stack">
        <div class="section-head"><h2>Add a reward</h2></div>
        <form class="stack" data-act="addreward">
          <div class="grid g2">
            <label class="field">Title<input type="text" id="ar-title" required placeholder="Free child ticket"></label>
            <label class="field">Sponsor<input type="text" id="ar-sponsor" required placeholder="QuestQuiz or a partner name"></label>
            <label class="field">Stream<select id="ar-tier"><option value="platform">Platform-sponsored</option><option value="partner">Partner</option></select></label>
            <label class="field">Kind<select id="ar-kind"><option value="code">Digital code</option><option value="physical">Physical goods</option><option value="download">Download</option><option value="perk">In-app perk</option><option value="credit">Print credit</option></select></label>
            <label class="field">Unlocks at level<select id="ar-level">${Array.from({ length: E.LEVELS }, (_, i) => `<option value="${i + 1}">Level ${i + 1}</option>`).join('')}</select></label>
            <label class="field">Grade band<select id="ar-band"><option value="any">Any band</option>${C.ACTIVE_BANDS.map(b => `<option value="${b.id}">${esc(b.name)} · ${esc(b.grades)}</option>`).join('')}</select></label>
            <label class="field">Stock<input type="number" id="ar-stock" value="100" min="1"></label>
          </div>
          <label class="field">Description<input type="text" id="ar-desc" placeholder="What the learner actually gets"></label>
          <div><button class="btn btn-primary" type="submit">Add reward</button></div>
        </form>
      </div>
      <div class="card stack"><div class="section-head"><h2>Live catalogue</h2><span class="pill">${s.rewards.length} rewards</span></div>
        <div class="tablewrap"><table><thead><tr><th>Reward</th><th>Stream</th><th>Kind</th><th>Band</th><th>Level</th><th>Stock</th><th>State</th><th></th></tr></thead><tbody>
          ${s.rewards.map(r => `<tr><td><b>${esc(r.title)}</b><div class="tiny muted">${esc(r.sponsor || 'Family')}</div></td>
            <td><span class="pill ${r.tier === 'platform' ? 'pill-teal' : r.tier === 'partner' ? 'pill-violet' : 'pill-accent'}">${esc(r.tier)}</span></td>
            <td class="tiny">${esc(r.kind)}</td><td class="tiny">${r.band === 'any' ? 'Any' : esc(bandOf(r.band).name)}</td><td class="num">${r.level}</td>
            <td class="num">${r.stock === undefined ? '—' : r.stock}</td>
            <td><span class="pill ${r.active !== false ? 'pill-good' : ''}">${r.active !== false ? 'Active' : 'Paused'}</span></td>
            <td><button class="btn btn-sm btn-ghost" data-act="togglereward" data-id="${r.id}">${r.active !== false ? 'Pause' : 'Resume'}</button></td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
  }

  function adminLevels() {
    const s = st().settings;
    return `<div class="stack">
      <div><div class="eyebrow">Platform</div><h1>Levels & rules</h1></div>
      <div class="card stack">
        <div class="section-head"><h2>Structure</h2><span class="pill">Fixed for this build</span></div>
        <div class="grid g4">
          <div class="stat"><b class="mono">${C.ACTIVE_BANDS.length}</b><span>Grade bands</span></div>
          <div class="stat"><b class="mono">${E.LEVELS}</b><span>Levels each</span></div>
          <div class="stat"><b class="mono">${E.ASSESS_PER_LEVEL}</b><span>Assessments per level</span></div>
          <div class="stat"><b class="mono">${E.QUESTIONS}</b><span>Questions each</span></div>
        </div>
      </div>
      <div class="card stack">
        <div class="section-head"><h2>Pass and progression rules</h2></div>
        <form class="stack" data-act="savesettings">
          <div class="grid g2">
            <label class="field">Pass mark (%)<input type="number" id="s-pass" min="40" max="100" value="${s.passMark}"></label>
            <label class="field">Assessments needed to clear a level<input type="number" id="s-need" min="1" max="${E.ASSESS_PER_LEVEL}" value="${s.assessmentsToClear}"></label>
            <label class="field">XP per first-attempt correct answer<input type="number" id="s-xp" min="1" value="${s.xpPerCorrect}"></label>
            <label class="field">XP per recovered question<input type="number" id="s-xpr" min="0" value="${s.xpPerRecovery}"></label>
            <label class="field">Data retention (months)<input type="number" id="s-ret" min="1" max="120" value="${s.dataRetentionMonths}"></label>
            <label class="field">Require a PIN before every assessment<select id="s-pin"><option value="1" ${s.requirePinEveryExam ? 'selected' : ''}>Yes</option><option value="0" ${!s.requirePinEveryExam ? 'selected' : ''}>No</option></select></label>
            <label class="field">AP exam window opens<input type="text" id="s-ap" value="${esc(s.apExamWindowOpens)}" placeholder="YYYY-MM-DD"></label>
          </div>
          <div><button class="btn btn-primary" type="submit">Save rules</button></div>
        </form>
        <p class="tiny muted">The AP date drives the countdown shown to students. Confirm the real window on the College Board site before each cycle.</p>
      </div>
      <div class="card stack">
        <div class="section-head"><h2>Subject mix per assessment</h2><span class="pill">50 questions</span></div>
        <div class="stack" style="gap:8px">
          ${C.MIX.map(([sub, n]) => `<div class="row" style="gap:10px;flex-wrap:nowrap">
            <span class="tiny" style="flex:0 0 180px">${esc(sub)}</span>
            <span class="meter" style="flex:1;min-width:80px"><i style="width:${n / 50 * 100}%"></i></span>
            <span class="mono tiny" style="flex:0 0 32px;text-align:right;font-weight:800">${n}</span></div>`).join('')}
        </div>
      </div>
      <div class="card stack">
        <div class="section-head"><h2>Error repetition</h2><span class="pill pill-violet">Always on</span></div>
        <ol class="tiny" style="margin:0;padding-left:18px;line-height:1.7">
          <li>A missed question is re-asked eight questions later in the same assessment, reworded into a second form.</li>
          <li>If it is missed again, it returns once more fourteen questions on, in a third form.</li>
          <li>Anything still unresolved joins the learner's carry-over queue.</li>
          <li>Up to five carry-over questions open the learner's next assessment, each in a different form from the one they saw last.</li>
          <li>First-attempt answers alone decide the score; recovered questions earn reduced XP.</li>
        </ol>
      </div>
    </div>`;
  }

  function adminCatalog() {
    const bySubject = {};
    Object.keys(C.BANKS).forEach(id => { const k = id.split('.')[0]; bySubject[k] = (bySubject[k] || 0) + C.BANKS[id].items.length; });
    const names = { m: 'Mathematics', ela: 'English Language Arts', sci: 'Science', lang: 'World Languages', gk: 'General Knowledge', ap: 'Advanced Placement' };
    return `<div class="stack">
      <div><div class="eyebrow">Platform</div><h1>Content bank</h1>
      <p class="muted">Questions are generated, not stored one by one: fact banks supply knowledge items and parameterised families supply computational ones, each seeded from the band, level and assessment number so a given assessment is always the same set.</p></div>
      <div class="grid g2">
        <div class="card stack"><div class="section-head"><h2>Fact banks</h2><span class="pill">${Object.keys(C.BANKS).length} banks</span></div>
          <div class="tablewrap"><table><thead><tr><th>Subject</th><th>Facts</th></tr></thead><tbody>
            ${Object.entries(bySubject).map(([k, n]) => `<tr><td>${esc(names[k] || k)}</td><td class="num">${n}</td></tr>`).join('')}
          </tbody></table></div>
          <p class="tiny muted">Each fact is asked in three shapes — forward, reversed, and pick-the-true-statement — which is what makes a re-ask feel like a different question.</p>
        </div>
        <div class="card stack"><div class="section-head"><h2>AP unit coverage</h2>
          ${(() => {
        const tot = AP.AP_COURSES.reduce((s, c) => s + c.units.length, 0);
        const covered = AP.AP_COURSES.reduce((s, c) => s + c.units.filter(u => E.apUnitItemCount(c, u.n) > 0).length, 0);
        return `<span class="pill ${covered === tot ? 'pill-good' : 'pill-warn'}">${covered} of ${tot} units have questions</span>`;
      })()}</div>
          <p class="tiny muted">A unit with no questions cannot be practised on its own. Students see it marked “no items yet” and are given mixed practice instead, so no answer is ever filed against the wrong unit. This table is the authoring backlog.</p>
          <div class="tablewrap"><table><thead><tr><th>Course</th><th>Units</th><th>With questions</th><th>Gaps</th></tr></thead><tbody>
            ${AP.AP_COURSES.map(c => {
        const gaps = c.units.filter(u => E.apUnitItemCount(c, u.n) === 0).map(u => u.n);
        return `<tr><td class="tiny"><b>${esc(c.name)}</b></td>
                <td class="num">${c.units.length}</td>
                <td class="num">${c.units.length - gaps.length}</td>
                <td class="tiny">${gaps.length
            ? `<span class="pill pill-warn">${gaps.map(n => 'U' + n).join(', ')}</span>`
            : '<span class="pill pill-good">complete</span>'}</td></tr>`;
      }).join('')}
          </tbody></table></div>
        </div>
      </div>
      <div class="card stack"><div class="section-head"><h2>Generated families</h2><span class="pill">${C.FAMS.length}</span></div>
        <div class="tablewrap"><table><thead><tr><th>Family</th><th>Subject</th><th>Band</th></tr></thead><tbody>
          ${C.FAMS.map(f => `<tr><td class="mono tiny">${esc(f.id)}</td><td class="tiny">${esc(f.subject)}</td><td class="tiny">${esc(bandOf(f.band).name)}</td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
  }

  function adminOrders() {
    const s = st();
    const states = ['Payment pending', 'Paid', 'Printed — awaiting dispatch', 'Dispatched', 'Cancelled'];
    return `<div class="stack">
      <div><div class="eyebrow">Platform</div><h1>Print orders</h1></div>
      <div class="card stack">
        <div class="section-head"><h2>Queue</h2><span class="pill">${s.orders.length}</span></div>
        ${s.orders.length ? `<div class="tablewrap"><table><thead><tr><th>Order</th><th>Learner</th><th>Badge</th><th>Item</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead><tbody>
          ${s.orders.map(o => `<tr><td class="mono">${o.id}</td><td>${esc((s.learners[o.learnerId] || {}).name || '—')}</td>
            <td>L${o.level} ${esc(C.LEVEL_NAMES[o.level - 1])}</td><td>${esc(o.product)}</td><td class="num">${o.qty}</td><td class="num">$${o.price.toFixed(2)}</td>
            <td><select data-act="orderstatus" data-id="${o.id}">${states.map(x => `<option ${x === o.status ? 'selected' : ''}>${x}</option>`).join('')}</select></td></tr>`).join('')}
        </tbody></table></div>` : '<p class="tiny muted">No orders yet.</p>'}
      </div>
      <div class="card stack"><div class="section-head"><h2>Print pricing</h2></div>
        <form class="stack" data-act="saveprices"><div class="grid g3">
          <label class="field">Sticker sheet ($)<input type="number" id="p-sticker" step="0.5" value="${s.settings.printPrices.sticker}"></label>
          <label class="field">Ceramic cup ($)<input type="number" id="p-mug" step="0.5" value="${s.settings.printPrices.mug}"></label>
          <label class="field">Water bottle ($)<input type="number" id="p-bottle" step="0.5" value="${s.settings.printPrices.bottle}"></label>
        </div><div><button class="btn btn-primary" type="submit">Save pricing</button></div></form>
      </div>
      <div class="notice notice-warn">No payment processor and no print supplier are connected. Statuses here are manual.</div>
    </div>`;
  }

  function adminPeople() {
    const s = st();
    return `<div class="stack">
      <div><div class="eyebrow">Platform</div><h1>Accounts</h1></div>
      <div class="card stack"><div class="section-head"><h2>Staff and parents</h2></div>
        <div class="tablewrap"><table><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th><th>Children</th></tr></thead><tbody>
          ${Object.values(s.users).map(u => `<tr><td>${esc(u.name)}</td><td><span class="pill">${esc(u.role)}</span></td><td class="tiny">${esc(u.email)}</td>
            <td><span class="pill ${u.status === 'active' ? 'pill-good' : 'pill-warn'}">${esc(u.status || 'active')}</span></td>
            <td class="num">${(u.children || []).length || '—'}</td></tr>`).join('')}
        </tbody></table></div></div>
      <div class="card stack"><div class="section-head"><h2>Learner profiles</h2></div>
        <div class="tablewrap"><table><thead><tr><th>Learner</th><th>Grade</th><th>Band</th><th>Level</th><th>Account</th><th>School</th><th>AP</th><th>XP</th></tr></thead><tbody>
          ${Object.values(s.learners).map(l => { const p = S.ensureProgress(l, l.band); const ap = S.ensureAp(l);
      return `<tr><td>${l.avatar} ${esc(l.name)}</td><td class="num">${esc(l.grade)}</td><td>${esc(bandOf(l.band).name)}</td><td class="num">${p.level}</td>
            <td class="tiny">${l.under13 ? '<span class="pill pill-warn">Under 13 · parent-held</span>' : l.selfManaged ? '<span class="pill">Self-managed</span>' : '<span class="pill">Parent-held</span>'}</td>
            <td class="tiny">${esc(l.schoolId && s.schools[l.schoolId] ? s.schools[l.schoolId].name : '—')}</td>
            <td class="num">${ap.enrolled.length || '—'}</td><td class="num">${l.xp.toLocaleString()}</td></tr>`; }).join('')}
        </tbody></table></div></div>
      <div class="card stack"><div class="section-head"><h2>Schools</h2></div>
        <div class="tablewrap"><table><thead><tr><th>School</th><th>District</th><th>Code</th><th>Learners</th></tr></thead><tbody>
          ${Object.values(s.schools).map(sc => `<tr><td>${esc(sc.name)}</td><td class="tiny">${esc(sc.district)}</td><td class="mono">${esc(sc.code)}</td>
            <td class="num">${Object.values(s.learners).filter(l => l.schoolId === sc.id).length}</td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
  }

  function adminLedger() {
    const s = st();
    return `<div class="stack">
      <div><div class="eyebrow">Platform</div><h1>Consent ledger</h1>
      <p class="muted">Every consent, withdrawal, verification, sign-in and identity check, with who did it and when.</p></div>
      <div class="card stack"><div class="section-head"><h2>Consent on file</h2></div>
        <div class="tablewrap"><table><thead><tr><th>Learner</th><th>Under 13</th><th>Given by</th><th>Recorded</th><th>Version</th><th>Optional consents</th></tr></thead><tbody>
          ${Object.values(s.learners).map(l => `<tr><td>${l.avatar} ${esc(l.name)}</td>
            <td>${l.under13 ? '<span class="pill pill-warn">COPPA</span>' : '—'}</td>
            <td class="tiny">${esc(l.consent ? l.consent.by : '—')}</td>
            <td class="tiny num">${l.consent ? new Date(l.consent.at).toLocaleDateString() : '—'}</td>
            <td class="mono tiny">${esc(l.consent ? l.consent.version : '—')}</td>
            <td class="tiny">${l.consent ? (S.CONSENT_ITEMS.filter(c => !c.required && l.consent.items[c.id]).map(c => c.id).join(', ') || 'none') : '—'}</td></tr>`).join('')}
        </tbody></table></div></div>
      <div class="card stack"><div class="section-head"><h2>Under-13 signup requests</h2><span class="pill">${s.linkRequests.length}</span></div>
        ${s.linkRequests.length ? `<div class="tablewrap"><table><thead><tr><th>Child</th><th>Grade</th><th>Parent email</th><th>Requested</th><th>Status</th></tr></thead><tbody>
          ${s.linkRequests.map(r => `<tr><td>${esc(r.childName)}</td><td class="num">${esc(r.grade)}</td><td class="tiny">${esc(r.parentEmail)}</td>
            <td class="num tiny">${r.at}</td><td><span class="pill ${r.status === 'approved' ? 'pill-good' : r.status === 'declined' ? 'pill-bad' : 'pill-warn'}">${esc(r.status)}</span></td></tr>`).join('')}
        </tbody></table></div>` : '<p class="tiny muted">None.</p>'}
      </div>
      <div class="card stack"><div class="section-head"><h2>Full audit trail</h2><span class="pill">${s.audit.length} entries</span></div>
        <div class="tablewrap"><table><thead><tr><th>When</th><th>Kind</th><th>Actor</th><th>Action</th></tr></thead><tbody>
          ${s.audit.map(a => `<tr><td class="num tiny">${new Date(a.at).toLocaleString()}</td><td><span class="pill">${esc(a.kind)}</span></td>
            <td class="tiny">${esc(a.actor)}</td><td class="tiny">${esc(a.action)}</td></tr>`).join('')}
        </tbody></table></div></div>
    </div>`;
  }

  /* ---------- add child (parent, in-app) ---------- */
  function addChildForm() {
    const yr = new Date().getFullYear();
    return `<form class="card stack" data-act="doaddchild">
      <div><div class="eyebrow">New learner profile</div><h2>Add a child</h2></div>
      ${pub.error ? `<div class="notice notice-bad">${esc(pub.error)}</div>` : ''}
      <div class="grid g2">
        <label class="field">Child's first name<input type="text" id="c-name" required placeholder="First name only"></label>
        <label class="field">Grade<select id="c-grade">${C.ACTIVE_GRADES.map(g => `<option value="${g}">Grade ${g}</option>`).join('')}</select></label>
        <label class="field">Year of birth<select id="c-year">${Array.from({ length: 16 }, (_, i) => yr - 4 - i).map(y => `<option value="${y}">${y}</option>`).join('')}</select></label>
        <label class="field">4-digit PIN<input type="text" id="c-pin" required pattern="[0-9]{4}" maxlength="4" inputmode="numeric" placeholder="e.g. 4821"></label>
        <label class="field">Avatar<select id="c-av">${['🦊', '🐙', '🐢', '🦉', '🐝', '🦖', '🐼', '🦄', '🐧', '🐳'].map(a => `<option>${a}</option>`).join('')}</select></label>
        <label class="field">School code <span class="muted" style="font-weight:600">(optional)</span><input type="text" id="c-school" placeholder="MAPLE-24"></label>
      </div>
      ${consentBlock(true)}
      <p class="tiny muted">On a live deployment the COPPA step hands off to a certified verification provider before the profile activates. This build records the consent, its version and its timestamp in the ledger.</p>
      <div class="btn-row"><button class="btn btn-primary" type="submit">Create learner profile</button>
      <button class="btn btn-ghost" type="button" data-act="cancelchild">Cancel</button></div>
    </form>`;
  }

  function printSheet(band, lv) {
    const pr = st().settings.printPrices;
    return `<div class="modal-bg" data-act="closemodal"><div class="modal stack" data-stop="1">
      <div class="between"><h2>Print the ${esc(C.LEVEL_NAMES[lv - 1])} badge</h2><button class="btn btn-sm btn-ghost" data-act="closemodal">Close</button></div>
      <div class="center">${E.badgeArt(band, lv, 140)}</div>
      <div class="grid g3">
        ${[['sticker', 'Sticker sheet', '6 die-cut vinyl stickers'], ['mug', 'Ceramic cup', '11 oz, dishwasher safe'], ['bottle', 'Water bottle', '600 ml insulated steel']].map(([p, name, desc]) => `
          <button class="card-flat" style="text-align:left;cursor:pointer;border:2px solid var(--line)" data-act="buyprint" data-band="${band}" data-lv="${lv}" data-p="${p}">
            <b style="font-family:var(--display)">${name}</b><div class="tiny muted">${desc}</div>
            <div class="mono" style="margin-top:6px;font-weight:800">$${pr[p].toFixed(2)}</div></button>`).join('')}
      </div>
      <p class="tiny muted">Checkout and fulfilment are not wired up in this build — placing an order records it for the admin queue so the flow can be tested end to end.</p>
    </div></div>`;
  }

  function wallpaperSheet(band, lv) {
    return `<div class="modal-bg" data-act="closemodal"><div class="modal stack" data-stop="1">
      <div class="between"><h2>${esc(C.LEVEL_NAMES[lv - 1])} wallpaper</h2><button class="btn btn-sm btn-ghost" data-act="closemodal">Close</button></div>
      <div class="center">${E.badgeArt(band, lv, 130)}</div>
      <p class="tiny muted">Pick a size. The badge is drawn fresh at full resolution, so it stays sharp on any screen.</p>
      <div class="btn-row">
        <button class="btn btn-teal" data-act="dlwall" data-band="${band}" data-lv="${lv}" data-size="1170x2532">Phone · 1170 × 2532</button>
        <button class="btn btn-teal" data-act="dlwall" data-band="${band}" data-lv="${lv}" data-size="2560x1600">Laptop · 2560 × 1600</button>
        <button class="btn btn-ghost" data-act="dlwall" data-band="${band}" data-lv="${lv}" data-size="1080x1080">Square · 1080 × 1080</button>
      </div>
    </div></div>`;
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  function body() {
    const role = S.session.role;
    if (!role) {
      const v = pub.view;
      if (v === 'signin') return signinView();
      if (v === 'signup-role') return signupRole();
      if (v === 'signup-school') return signupSchoolView();
      if (v === 'school-submitted') return schoolSubmitted();
      if (v === 'signup-parent') return signupParentView();
      if (v === 'parent-otp') return otpView();
      if (v === 'signup-student') return studentAge();
      if (v === 'student-13') return student13();
      if (v === 'student-email') return emailVerifyView();
      if (v === 'student-u13') return studentU13();
      if (v === 'u13-submitted') return u13Submitted();
      if (v === 'kidpick') return kidPick();
      if (v === 'kidpin') return kidPin();
      return landing();
    }
    if (exam) return shell(exam._needPin ? examVerify() : examRunner());
    if (role === 'child') {
      const map = { home: childHome, levels: childLevels, ap: apHub, apcourse: apCourse, quizzes: childQuizzes, badges: childBadges, rewards: childRewards, me: childMe };
      return shell((map[route] || childHome)());
    }
    if (role === 'parent') {
      if (route === 'addchild') return shell(addChildForm());
      const map = { home: parentHome, progress: parentProgress, setlevel: parentSetLevel, myrewards: parentRewards, approvals: parentApprovals, orders: parentOrders, privacy: parentPrivacy };
      return shell((map[route] || parentHome)());
    }
    if (role === 'school') {
      const map = { home: schoolHome, roster: schoolRoster, subjects: schoolSubjects, codes: schoolCodes };
      return shell((map[route] || schoolHome)());
    }
    const map = { home: adminHome, schools: adminSchools, rewards: adminRewards, levels: adminLevels, catalog: adminCatalog, orders: adminOrders, people: adminPeople, ledger: adminLedger };
    return shell((map[route] || adminHome)());
  }

  function render() { app.innerHTML = body() + (modal || ''); }

  /* ============================================================
     EVENTS
     ============================================================ */
  document.addEventListener('click', ev => {
    const stop = ev.target.closest('[data-stop]');
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'closemodal' && stop && !ev.target.closest('button[data-act="closemodal"]')) return;
    const fn = ACTIONS[el.dataset.act];
    if (fn) { ev.preventDefault(); fn(el, ev); }
  });
  document.addEventListener('submit', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const fn = ACTIONS[el.dataset.act];
    if (fn) { ev.preventDefault(); fn(el, ev); }
  });
  document.addEventListener('change', ev => {
    const el = ev.target.closest('[data-act="orderstatus"]');
    if (el) {
      const o = st().orders.find(x => x.id === el.dataset.id);
      if (o) { o.status = el.value; S.save(); toast('Order ' + o.id + ' → ' + o.status); }
    }
  });

  function goPub(v) { pub.view = v; pub.error = ''; pub.pin = ''; pub.taster = null; render(); window.scrollTo(0, 0); }

  /* Repaint only the taster card. A full render would scroll the visitor back to
     the top of a long marketing page every time they answer a question. */
  function repaintTry() {
    const host = document.getElementById('try-card');
    if (host) host.innerHTML = tryPanel(); else render();
  }

  function startExam(plan, opts) {
    exam = E.createSession(plan, opts);
    exam.meta = plan;
    exam._needPin = st().settings.requirePinEveryExam;
    pub.pin = ''; pub.error = ''; examView = null;
    modal = null; render(); window.scrollTo(0, 0);
  }

  const ACTIONS = {
    /* ----- public ----- */
    pub: el => goPub(el.dataset.v),

    /* ----- try-before-signup taster ----- */
    trystart: () => {
      pub.taster = null;
      render();
      const el = document.getElementById('try');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    trypick: el => { startTaster(el.dataset.band); repaintTry(); },
    tryanswer: el => {
      const t = pub.taster;
      if (!t || t.answers[t.i] !== undefined) return;
      t.answers[t.i] = el.dataset.o;
      if (el.dataset.o === t.qs[t.i].answer) t.right++;
      repaintTry();
    },
    trynext: () => {
      const t = pub.taster;
      if (!t) return;
      if (t.i + 1 >= t.qs.length) t.done = true; else t.i++;
      repaintTry();
    },
    tryreset: () => { pub.taster = null; repaintTry(); },
    dosignin: () => {
      const res = S.signIn(val('si-email'), val('si-pass'));
      if (res.ok) {
        route = 'home'; parentFocus = null; apFocus = null; pub.error = '';
        render(); window.scrollTo(0, 0);
        toast('Signed in — welcome back.', 'good');
        return;
      }
      if (res.resume === 'parent-otp') { pub.userId = res.userId; pub.demoCode = ''; goPub('parent-otp'); toast('Verify your phone to finish setting up.', 'bad'); return; }
      if (res.resume === 'student-email') { pub.learnerId = res.learnerId; pub.demoCode = ''; goPub('student-email'); toast('Verify your email to finish setting up.', 'bad'); return; }
      if (res.resume === 'school-pending') { pub.error = res.error; pub.view = 'signin'; render(); return; }
      pub.error = res.error; render();
    },

    doschool: () => {
      const f = {
        schoolName: val('sc-name'), district: val('sc-district'), contactName: val('sc-contact'),
        role: val('sc-role'), email: val('sc-email'), phone: val('sc-phone'),
        students: val('sc-students'), password: val('sc-pass')
      };
      const res = S.signupSchool(f);
      if (!res.ok) { pub.error = res.error; render(); return; }
      pub.data = f; goPub('school-submitted');
    },

    doparent: () => {
      const res = S.signupParent({ name: val('pa-name'), email: val('pa-email'), phone: val('pa-phone'), password: val('pa-pass') });
      if (!res.ok) { pub.error = res.error; render(); return; }
      pub.userId = res.user.id; pub.demoCode = res.otp;
      goPub('parent-otp');
    },
    dootp: () => {
      const entered = val('otp-input') || pub.pin;
      const res = S.verifyOtp(pub.userId, entered);
      if (!res.ok) { pub.error = res.error; pub.pin = ''; render(); return; }
      // pick up any child signup waiting on this email
      const waiting = S.pendingLinksFor(res.user.email);
      route = waiting.length ? 'approvals' : 'home';
      pub.error = ''; pub.demoCode = ''; render(); window.scrollTo(0, 0);
      toast(waiting.length ? 'Verified. A child signup is waiting for your consent.' : 'Phone verified — your account is active.', 'good');
    },
    resendotp: () => {
      const res = S.resendOtp(pub.userId);
      if (res.ok) { pub.demoCode = res.otp; pub.pin = ''; pub.error = ''; render(); toast('New code sent.'); }
    },

    doage: () => {
      const yr = Number(val('ag-year'));
      const age = new Date().getFullYear() - yr;
      pub.data = { birthYear: yr, age };
      goPub(age < 13 ? 'student-u13' : 'student-13');
    },
    dostudent13: () => {
      const res = S.signupStudent13({
        name: val('s-name'), grade: val('s-grade'), email: val('s-email'), password: val('s-pass'),
        pin: val('s-pin'), avatar: val('s-av'), schoolCode: val('s-school'),
        parentEmail: val('s-parent'), consents: collectConsents()
      });
      if (!res.ok) { pub.error = res.error; render(); return; }
      pub.learnerId = res.learner.id; pub.demoCode = res.code;
      goPub('student-email');
    },
    doemailcode: () => {
      const entered = val('ev-input') || pub.pin;
      const res = S.verifyEmailCode(pub.learnerId, entered);
      if (!res.ok) { pub.error = res.error; pub.pin = ''; render(); return; }
      route = 'home'; pub.error = ''; pub.demoCode = ''; render(); window.scrollTo(0, 0);
      toast('Email verified. Welcome to QuestQuiz.', 'good');
    },
    resendemail: () => {
      const res = S.resendEmailCode(pub.learnerId);
      if (res.ok) { pub.demoCode = res.code; pub.pin = ''; pub.error = ''; render(); toast('New code sent.'); }
    },

    dou13: () => {
      const f = {
        childName: val('u-name'), grade: val('u-grade'), birthYear: pub.data.birthYear,
        pin: val('u-pin'), avatar: val('u-av'), parentEmail: val('u-parent'), schoolCode: val('u-school')
      };
      const res = S.requestParentLink(f);
      pub.data = Object.assign({}, f, { parentExists: res.parentExists });
      goPub('u13-submitted');
    },
    parentfromu13: () => {
      pub.data = { prefillEmail: pub.data.parentEmail, childName: pub.data.childName };
      goPub('signup-parent');
    },

    pickkid: el => { pub.learnerId = el.dataset.id; goPub('kidpin'); },
    pin: el => {
      if (pub.pin.length >= 4) return;
      pub.pin += el.dataset.n;
      if (pub.pin.length === 4) {
        const res = S.signInChild(pub.learnerId, pub.pin);
        if (res.ok) { route = 'home'; pub.pin = ''; pub.error = ''; render(); toast('Welcome back, ' + res.learner.name + '!', 'good'); return; }
        pub.error = res.error; pub.pin = '';
      }
      render();
    },
    pinback: () => { pub.pin = pub.pin.slice(0, -1); render(); },
    pinclear: () => { pub.pin = ''; pub.error = ''; render(); },

    /* ----- shell ----- */
    go: el => { route = el.dataset.route; modal = null; render(); window.scrollTo(0, 0); },
    logout: () => {
      S.logout(); exam = null; modal = null; apFocus = null;
      pub = { view: 'landing', error: '', data: {}, demoCode: '', pin: '', learnerId: null, userId: null };
      render(); window.scrollTo(0, 0);
    },
    theme: () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : cur === 'light' ? '' : 'dark';
      if (next) document.documentElement.setAttribute('data-theme', next); else document.documentElement.removeAttribute('data-theme');
      toast(next ? next.charAt(0).toUpperCase() + next.slice(1) + ' theme' : 'Following your system theme');
    },
    closemodal: () => { modal = null; render(); },

    /* ----- AP ----- */
    apenroll: el => { S.apEnroll(S.session.learnerId, el.dataset.id); render(); toast('Enrolled.', 'good'); },
    apdrop: el => { S.apDrop(S.session.learnerId, el.dataset.id); render(); toast('Dropped.'); },
    apopen: el => { apFocus = el.dataset.id; route = 'apcourse'; render(); window.scrollTo(0, 0); },
    appractice: el => {
      const c = courseOf(el.dataset.id), u = Number(el.dataset.u) || 0;
      apFocus = c.id;
      const plan = E.buildApSet(c, { unit: u, count: 25, label: u ? `Unit ${u} practice` : 'Mixed practice', nonce: Date.now() });
      if (!plan || !plan.questions.length) { toast('No practice items for that unit yet.', 'bad'); return; }
      if (u && plan.coverage && !plan.coverage.complete) {
        toast('Unit ' + u + ' has no questions written yet — running mixed practice instead.');
      }
      startExam(plan, { passMark: 60, mode: 'ap' });
    },
    apmock: el => {
      const c = courseOf(el.dataset.id);
      apFocus = c.id;
      const plan = E.buildApSet(c, { unit: 0, count: 60, label: 'Full mock exam', nonce: Date.now() });
      if (!plan || !plan.questions.length) { toast('This course has no mock exam yet.', 'bad'); return; }
      startExam(plan, { passMark: 60, mode: 'ap' });
    },

    /* ----- exam ----- */
    openlevel: el => { modal = levelSheet(Number(el.dataset.lv)); render(); },
    startnext: () => {
      const k = kid(), p = S.ensureProgress(k, k.band);
      const passed = (p.passedInLevel || {})[p.level] || [];
      let ix = 0; while (passed.includes(ix) && ix < E.ASSESS_PER_LEVEL - 1) ix++;
      const plan = E.buildAssessment(k.band, p.level, ix, k.recoveryQueue);
      startExam(plan, { passMark: st().settings.passMark, mode: 'assessment' });
    },
    startexam: el => {
      const k = kid();
      const plan = E.buildAssessment(k.band, Number(el.dataset.lv), Number(el.dataset.ix), k.recoveryQueue);
      startExam(plan, { passMark: st().settings.passMark, mode: 'assessment' });
    },
    startquiz: el => {
      const plan = E.buildQuiz(el.dataset.id);
      startExam(plan, { passMark: st().settings.passMark, mode: 'quiz' });
    },
    epin: el => {
      if (pub.pin.length >= 4) return;
      pub.pin += el.dataset.n;
      if (pub.pin.length === 4) {
        if (S.verifyPin(S.session.learnerId, pub.pin)) { exam._needPin = false; pub.pin = ''; pub.error = ''; render(); return; }
        pub.error = 'That PIN is not right.'; pub.pin = '';
      }
      render();
    },
    epinback: () => { pub.pin = pub.pin.slice(0, -1); render(); },
    epinclear: () => { pub.pin = ''; pub.error = ''; render(); },
    cancelexam: () => { exam = null; examView = null; render(); },
    quitexam: () => { exam = null; examView = null; render(); toast('Left the assessment. Nothing was recorded.'); },
    answer: el => { examView = { injected: E.answer(exam, el.dataset.o).injected }; render(); },
    nextq: () => {
      exam.cursor++;
      examView = null;
      if (exam.cursor >= exam.plan.length && !exam._recorded) {
        const sc = E.sessionScore(exam);
        sc.clearedQids = {};
        Object.entries(exam.misses).forEach(([qid, m]) => { if (m.cleared) sc.clearedQids[qid] = true; });
        if (exam.mode === 'assessment') {
          exam._recorded = S.recordResult(S.session.learnerId, exam.meta, sc);
          if (exam._recorded.levelCleared) toast('Level ' + exam._recorded.levelCleared + ' cleared! Badge unlocked.', 'good');
        } else if (exam.mode === 'ap') {
          exam._recorded = S.recordApSet(S.session.learnerId, exam.meta, exam, sc);
        } else {
          kid().xp += sc.xp; S.save();
          exam._recorded = { levelCleared: null, passedCount: 0, need: 0 };
        }
      }
      render(); window.scrollTo(0, 0);
    },
    exitexam: () => {
      const wasAp = exam && exam.mode === 'ap';
      exam = null; examView = null;
      route = wasAp ? 'apcourse' : 'home';
      render(); window.scrollTo(0, 0);
    },

    /* ----- rewards ----- */
    claim: el => {
      const res = S.claimReward(S.session.learnerId, el.dataset.id);
      if (!res.ok) { toast(res.error, 'bad'); return; }
      render();
      toast(res.status === 'awaiting parent' ? 'Claimed — a parent needs to grant this one.' : 'Claimed! ' + (res.note || ''), 'good');
    },
    grant: el => { S.setGrantStatus(el.dataset.id, 'granted'); render(); toast('Granted.', 'good'); },
    declinegrant: el => { S.setGrantStatus(el.dataset.id, 'declined'); render(); },
    addpersonal: el => {
      st().rewards.push({
        id: S.uid('r'), tier: 'personal', title: val('pr-title'), desc: val('pr-desc'), kind: 'privilege',
        band: st().learners[el.dataset.id].band, level: Number(val('pr-level')),
        ownerId: S.session.userId, childId: el.dataset.id, active: true
      });
      S.save(); S.audit(me().email, `Added family reward "${val('pr-title')}"`, 'reward');
      render(); toast('Reward added.', 'good');
    },
    delpersonal: el => { st().rewards = st().rewards.filter(r => r.id !== el.dataset.id); S.save(); render(); toast('Removed.'); },
    addreward: () => {
      st().rewards.push({
        id: S.uid('r'), tier: val('ar-tier'), title: val('ar-title'), desc: val('ar-desc'), kind: val('ar-kind'),
        band: val('ar-band'), level: Number(val('ar-level')), stock: Number(val('ar-stock')), sponsor: val('ar-sponsor'), active: true
      });
      S.save(); S.audit(me().email, `Added ${val('ar-tier')} reward "${val('ar-title')}"`, 'reward');
      render(); toast('Reward published.', 'good');
    },
    togglereward: el => {
      const r = st().rewards.find(x => x.id === el.dataset.id);
      if (r) { r.active = r.active === false; S.save(); render(); }
    },

    /* ----- parent ----- */
    focuskid: el => { parentFocus = el.dataset.id; if (el.dataset.route) route = el.dataset.route; render(); },
    addchild: () => { route = 'addchild'; pub.error = ''; render(); },
    cancelchild: () => { route = 'home'; pub.error = ''; render(); },
    doaddchild: () => {
      const res = S.addLearner(S.session.userId, {
        name: val('c-name'), grade: val('c-grade'), pin: val('c-pin'), avatar: val('c-av'),
        birthYear: val('c-year'), schoolCode: val('c-school'), consents: collectConsents()
      });
      if (!res.ok) { pub.error = res.error; render(); return; }
      pub.error = ''; parentFocus = res.learner.id; route = 'home'; render();
      toast(res.learner.name + ' is set up and ready to start.', 'good');
    },
    approvelink: el => {
      const consents = {};
      document.querySelectorAll(`[data-consent][data-req="${el.dataset.id}"]`).forEach(c => consents[c.dataset.consent] = c.checked);
      const res = S.approveLink(el.dataset.id, consents);
      if (!res.ok) { toast(res.error, 'bad'); return; }
      render(); toast(res.learner.name + ' is set up and can sign in with their PIN.', 'good');
    },
    declinelink: el => { S.declineLink(el.dataset.id); render(); toast('Request declined.'); },
    savelevel: el => {
      const k = st().learners[el.dataset.id], p = S.ensureProgress(k, k.band);
      p.level = Number(document.getElementById('lvslider').value);
      S.save(); S.audit(me().email, `Set ${k.name} to level ${p.level}`, 'progress');
      render(); toast(k.name + ' is now on level ' + p.level, 'good');
    },
    saveband: el => {
      const k = st().learners[el.dataset.id];
      k.band = document.getElementById('bandsel').value;
      S.ensureProgress(k, k.band); S.save();
      S.audit(me().email, `Moved ${k.name} to the ${bandOf(k.band).name} band`, 'progress');
      render(); toast(k.name + ' moved to ' + bandOf(k.band).name, 'good');
    },
    toggleconsent: el => {
      const k = st().learners[el.dataset.id], c = el.dataset.c;
      k.consent.items[c] = !k.consent.items[c];
      S.save(); S.audit(me().email, `${k.consent.items[c] ? 'Gave' : 'Withdrew'} optional consent "${c}" for ${k.name}`, 'consent');
      render(); toast('Consent updated and logged.');
    },
    exportkid: async el => {
      const k = st().learners[el.dataset.id];
      const payload = JSON.stringify({ exportedAt: new Date().toISOString(), learner: k, grants: S.grantsFor(k.id), orders: st().orders.filter(o => o.learnerId === k.id) }, null, 2);
      await saveFile(`${k.name.toLowerCase()}-questquiz-data.json`, payload);
    },
    deletekid: el => {
      const k = st().learners[el.dataset.id];
      modal = `<div class="modal-bg" data-act="closemodal"><div class="modal stack" data-stop="1">
        <h2>Delete ${esc(k.name)}'s profile?</h2>
        <p class="tiny muted">This removes the profile, every assessment result, badges, claimed rewards and the consent record. It cannot be undone.</p>
        <div class="btn-row"><button class="btn btn-primary" data-act="confirmdelete" data-id="${k.id}">Delete permanently</button>
        <button class="btn btn-ghost" data-act="closemodal">Keep it</button></div></div></div>`;
      render();
    },
    confirmdelete: el => {
      const k = st().learners[el.dataset.id];
      delete st().learners[el.dataset.id];
      const u = me(); u.children = (u.children || []).filter(c => c !== el.dataset.id);
      st().grants = st().grants.filter(g => g.learnerId !== el.dataset.id);
      st().orders.forEach(o => { if (o.learnerId === el.dataset.id) o.learnerId = null; });
      S.save(); S.audit(u.email, `Deleted the learner profile for ${k.name} at parent request`, 'consent');
      modal = null; parentFocus = null; render(); toast('Profile deleted.');
    },

    /* ----- badges & prints ----- */
    wallpaper: el => { modal = wallpaperSheet(el.dataset.band, Number(el.dataset.lv)); render(); },
    dlwall: async el => {
      const [w, h] = el.dataset.size.split('x').map(Number);
      const blob = await renderWallpaper(el.dataset.band, Number(el.dataset.lv), w, h);
      await saveFile(`questquiz-${el.dataset.band}-level${el.dataset.lv}-${w}x${h}.png`, blob);
    },
    printorder: el => { modal = printSheet(el.dataset.band, Number(el.dataset.lv)); render(); },
    buyprint: el => {
      const o = S.placeOrder(S.session.learnerId, el.dataset.band, Number(el.dataset.lv), el.dataset.p, 1);
      modal = null; render();
      toast(`Order ${o.id} recorded — $${o.price.toFixed(2)}, payment pending.`, 'good');
    },

    /* ----- admin ----- */
    approveschool: el => {
      const res = S.approveSchool(el.dataset.id);
      if (!res.ok) { toast(res.error, 'bad'); return; }
      render(); toast(`Approved. Class code ${res.code} issued.`, 'good');
    },
    rejectschool: el => {
      S.rejectSchool(el.dataset.id, 'Could not verify the school domain');
      render(); toast('Registration rejected.');
    },
    savesettings: () => {
      const s = st().settings;
      s.passMark = Number(val('s-pass')); s.assessmentsToClear = Number(val('s-need'));
      s.xpPerCorrect = Number(val('s-xp')); s.xpPerRecovery = Number(val('s-xpr'));
      s.dataRetentionMonths = Number(val('s-ret')); s.requirePinEveryExam = val('s-pin') === '1';
      if (/^\d{4}-\d{2}-\d{2}$/.test(val('s-ap'))) s.apExamWindowOpens = val('s-ap');
      S.save(); S.audit(me().email, 'Updated progression rules', 'policy'); render(); toast('Rules saved.', 'good');
    },
    saveprices: () => {
      const p = st().settings.printPrices;
      p.sticker = Number(val('p-sticker')); p.mug = Number(val('p-mug')); p.bottle = Number(val('p-bottle'));
      S.save(); render(); toast('Pricing saved.', 'good');
    }
  };

  /* ---------- downloads ---------- */
  async function getDownloads() {
    if (downloadsNs !== undefined) return downloadsNs;
    try { downloadsNs = (window.claude && window.claude.use) ? await window.claude.use('downloads') : null; }
    catch (e) { downloadsNs = null; }
    return downloadsNs;
  }
  async function saveFile(filename, data) {
    // Inside a Claude artifact the host brokers the save. On an ordinary web host
    // there is no broker, so fall back to a normal browser download.
    const dl = await getDownloads();
    if (dl) {
      try { await dl.save({ filename, data }); toast('Saved ' + filename, 'good'); return; }
      catch (e) {
        if (e && e.code === 'declined') return;
        // fall through to the browser download
      }
    }
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
      toast('Downloading ' + filename, 'good');
    } catch (e) {
      toast('That file could not be saved in this browser.', 'bad');
    }
  }

  function renderWallpaper(bandId, level, W, H) {
    return new Promise(resolve => {
      const band = bandOf(bandId);
      const hue = (band.hue + level * 17) % 360, hue2 = (hue + 42) % 360;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const x = cv.getContext('2d');
      const g = x.createLinearGradient(0, 0, W * .4, H);
      g.addColorStop(0, `hsl(${hue} 60% 22%)`); g.addColorStop(1, `hsl(${hue2} 65% 12%)`);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 22; i++) {
        x.beginPath();
        x.fillStyle = `hsla(${(hue2 + i * 12) % 360}, 80%, 65%, .07)`;
        x.arc(Math.random() * W, Math.random() * H, (Math.min(W, H) / 8) * (0.2 + Math.random()), 0, Math.PI * 2);
        x.fill();
      }
      const cx = W / 2, cy = H * 0.42, R = Math.min(W, H) * 0.3;
      const rays = 6 + (level % 7);
      x.strokeStyle = `hsla(${hue2}, 92%, 80%, .5)`; x.lineWidth = R * 0.05; x.lineCap = 'round';
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2;
        x.beginPath();
        x.moveTo(cx + Math.cos(a) * R * 1.15, cy + Math.sin(a) * R * 1.15);
        x.lineTo(cx + Math.cos(a) * R * 1.45, cy + Math.sin(a) * R * 1.45);
        x.stroke();
      }
      const shapes = ['hex', 'shield', 'star', 'bloom', 'gem'];
      const shape = shapes[level % shapes.length];
      const bg = x.createLinearGradient(cx, cy - R, cx, cy + R);
      bg.addColorStop(0, `hsl(${hue} 85% 62%)`); bg.addColorStop(1, `hsl(${hue2} 80% 44%)`);
      x.fillStyle = bg; x.strokeStyle = `hsl(${hue} 60% 24%)`; x.lineWidth = R * 0.055;
      x.beginPath();
      if (shape === 'star') {
        const pts = 5 + (level % 4);
        for (let i = 0; i < pts * 2; i++) {
          const rr = (i % 2 ? R * 0.5 : R), a = -Math.PI / 2 + i * Math.PI / pts;
          const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
          i ? x.lineTo(px, py) : x.moveTo(px, py);
        }
      } else {
        const n = shape === 'hex' ? 6 : shape === 'bloom' ? 8 + (level % 3) : shape === 'gem' ? 5 : 6;
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + i * 2 * Math.PI / n;
          const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
          i ? x.lineTo(px, py) : x.moveTo(px, py);
        }
      }
      x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.arc(cx, cy, R * 0.42, 0, Math.PI * 2);
      x.fillStyle = `hsl(${hue} 30% 98%)`; x.fill();
      x.lineWidth = R * 0.045; x.strokeStyle = `hsl(${hue} 60% 28%)`; x.stroke();
      x.fillStyle = `hsl(${hue} 65% 24%)`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `800 ${R * 0.52}px "Baloo 2", Verdana, sans-serif`;
      x.fillText(String(level), cx, cy + R * 0.02);
      x.fillStyle = 'rgba(255,255,255,.95)';
      x.font = `800 ${Math.min(W, H) * 0.066}px "Baloo 2", Verdana, sans-serif`;
      x.fillText(C.LEVEL_NAMES[level - 1], cx, cy + R * 1.75);
      x.fillStyle = 'rgba(255,255,255,.62)';
      x.font = `700 ${Math.min(W, H) * 0.029}px Nunito, sans-serif`;
      x.fillText(`LEVEL ${level}  ·  ${band.name.toUpperCase()}  ·  QUESTQUIZ`, cx, cy + R * 2.1);
      cv.toBlob(b => resolve(b), 'image/png');
    });
  }

  render();
})();
