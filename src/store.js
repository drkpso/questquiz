/* ============================================================
   QuestQuiz — state, accounts, verification, consent, rewards
   Server-backed: accounts and progress sync via /api/* (Railway).
   Session token is the only durable client credential.
   ============================================================ */
(function () {
  const C = window.QQ_CONTENT, E = window.QQ_ENGINE, AP = window.QQ_AP;
  const SESSION_KEY = 'questquiz.session';
  const CACHE_KEY = 'questquiz.v2.cache';
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 9);
  const today = () => new Date().toISOString().slice(0, 10);

  /** Child login IDs: 3–24 chars, lowercase letters/digits/_/- */
  function normalizeLoginId(raw) {
    return String(raw || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
  }
  function validLoginId(id) {
    return /^[a-z0-9][a-z0-9_-]{2,23}$/.test(id);
  }
  function findLearnerByLoginId(loginId) {
    const id = normalizeLoginId(loginId);
    if (!id) return null;
    return Object.values(state.learners).find(l => l.loginId && normalizeLoginId(l.loginId) === id) || null;
  }
  function suggestLoginId(name, learnersMap) {
    const base = normalizeLoginId(name).replace(/^_+|_+$/g, '') || 'learner';
    const stem = base.slice(0, 20);
    const pool = learnersMap || (state && state.learners) || {};
    const taken = id => Object.values(pool).some(l => l.loginId && normalizeLoginId(l.loginId) === id);
    if (validLoginId(stem) && !taken(stem)) return stem;
    for (let i = 2; i < 100; i++) {
      const cand = (stem.slice(0, 20) + i).slice(0, 24);
      if (validLoginId(cand) && !taken(cand)) return cand;
    }
    return ('kid_' + Math.random().toString(36).slice(2, 8));
  }
  function migrateLearnerLogins(st) {
    Object.values(st.learners || {}).forEach(l => {
      if (l.loginId && validLoginId(normalizeLoginId(l.loginId))) {
        l.loginId = normalizeLoginId(l.loginId);
        delete l.needsLoginSetup;
        return;
      }
      l.loginId = l.loginId ? normalizeLoginId(l.loginId) : '';
      if (!validLoginId(l.loginId)) {
        l.needsLoginSetup = true;
        l.suggestedLoginId = suggestLoginId(l.name, st.learners);
        l.loginId = '';
      }
    });
    return st;
  }

  const DEFAULT_SETTINGS = {
    passMark: 80,
    assessmentsToClear: 5,
    xpPerCorrect: 10,
    xpPerRecovery: 4,
    behavioralAdvertising: false,
    thirdPartyAnalytics: false,
    dataRetentionMonths: 18,
    requirePinEveryExam: true,
    printPrices: { sticker: 4.5, mug: 14, bottle: 22 },
    consentVersion: '2026-09-A',
    apExamWindowOpens: '2027-05-03'
  };

  const CONSENT_ITEMS = [
    { id: 'terms', label: 'Terms of Use and Learner Code of Conduct', required: true },
    { id: 'privacy', label: 'Privacy Notice — what we collect and why', required: true },
    { id: 'coppa', label: 'Verifiable parental consent for a child under 13 (COPPA)', required: true, under13: true },
    { id: 'progress', label: 'Store assessment results so progress and badges can be shown', required: true },
    { id: 'rewards', label: 'Share a first name and level with a reward partner when a code is redeemed', required: false },
    { id: 'schoolshare', label: 'Share progress with the school if a class code is used', required: false },
    { id: 'email', label: 'Send occasional product emails to the parent address', required: false }
  ];

  /* ---------------- empty bootstrap (no demo families) ---------------- */
  function emptyState() {
    return {
      version: 2,
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      users: {},
      learners: {},
      schools: {},
      rewards: [
        { id: uid('r'), tier: 'platform', title: 'Badge Sticker Sheet — free print credit', desc: 'One free printed sticker sheet of any badge you have earned.', kind: 'credit', band: 'any', level: 1, stock: 500, sponsor: 'QuestQuiz', active: true },
        { id: uid('r'), tier: 'platform', title: 'Wallpaper Pack: Aurora Set', desc: 'Five wallpapers for phone and laptop.', kind: 'download', band: 'any', level: 3, stock: 9999, sponsor: 'QuestQuiz', active: true },
        { id: uid('r'), tier: 'platform', title: 'Double XP Weekend', desc: 'Every correct answer is worth double XP for 48 hours.', kind: 'perk', band: 'any', level: 5, stock: 9999, sponsor: 'QuestQuiz', active: true },
        { id: uid('r'), tier: 'platform', title: 'AP Practice Unlimited — 30 days', desc: 'Unlimited AP practice sets and full mock exams for a month.', kind: 'perk', band: 'h912', level: 2, stock: 9999, sponsor: 'QuestQuiz', active: true },
        { id: uid('r'), tier: 'partner', title: 'Scholastic — 20% off one book', desc: 'Single-use code, valid online, no personal data shared beyond a first name.', kind: 'code', band: 'any', level: 2, stock: 240, sponsor: 'Scholastic', active: true }
      ],
      orders: [],
      audit: [],
      grants: [],
      pendingSchools: [],
      linkRequests: []
    };
  }

  function ensureProgress(learner, band) {
    learner.progress = learner.progress || {};
    if (!learner.progress[band]) learner.progress[band] = { level: 1, cleared: {}, attempts: {}, passedInLevel: {} };
    return learner.progress[band];
  }
  function ensureAp(learner) {
    if (!learner.ap) learner.ap = { enrolled: [], courses: {} };
    if (!learner.ap.courses) learner.ap.courses = {};
    if (!learner.ap.enrolled) learner.ap.enrolled = [];
    return learner.ap;
  }

  /* ---------------- API + persistence ---------------- */
  let state = null;
  let authToken = null;
  let syncTimer = null;
  let liveInfo = { live: true, serverBacked: true, emailConfigured: false };

  async function api(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (authToken) opts.headers.Authorization = 'Bearer ' + authToken;
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok && data.ok === undefined) data.ok = false;
    if (data.error && data.ok === undefined) data.ok = false;
    data._status = res.status;
    return data;
  }

  function applyServerPayload(data) {
    if (data.token) {
      authToken = data.token;
      try { localStorage.setItem(SESSION_KEY, authToken); } catch (e) { /* ignore */ }
    }
    if (data.state) {
      state = migrateLearnerLogins(data.state);
      cacheLocal();
    }
    if (data.session) session = Object.assign({ pinVerifiedAt: 0 }, data.session);
  }

  function cacheLocal() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ token: authToken, state, session }));
    } catch (e) { /* ignore */ }
  }

  function load() {
    state = emptyState();
    session = { role: null, userId: null, learnerId: null, pinVerifiedAt: 0 };
    try {
      authToken = localStorage.getItem(SESSION_KEY) || null;
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.state && p.state.version === 2) {
          state = migrateLearnerLogins(p.state);
          if (p.session) session = p.session;
          if (p.token) authToken = p.token;
        }
      }
    } catch (e) { /* private window */ }

    // Drop legacy demo localStorage blobs so public paths never show seeded kids
    try { localStorage.removeItem('questquiz.v2'); } catch (e) { /* ignore */ }

    // Hydrate from server in the background when a session exists
    if (authToken) {
      api('GET', '/api/state').then(data => {
        if (data.ok) {
          applyServerPayload(data);
          if (typeof window.QQ_ON_HYDRATE === 'function') window.QQ_ON_HYDRATE();
        } else if (data._status === 401) {
          authToken = null;
          try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
          state = emptyState();
          session = { role: null, userId: null, learnerId: null, pinVerifiedAt: 0 };
          cacheLocal();
        }
      }).catch(() => { /* offline — keep cache */ });
    }

    api('GET', '/api/status').then(data => {
      if (data && data.ok) liveInfo = data;
    }).catch(() => { /* ignore */ });

    return state;
  }

  function save() {
    cacheLocal();
    if (!authToken) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      api('PUT', '/api/state', { state }).then(data => {
        if (data.ok && data.state) {
          state = migrateLearnerLogins(data.state);
          cacheLocal();
        }
      }).catch(() => { /* retry on next save */ });
    }, 250);
  }

  function reset() {
    if (authToken) api('POST', '/api/auth/logout').catch(() => { });
    authToken = null;
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem('questquiz.v2');
    } catch (e) { /* ignore */ }
    state = emptyState();
    session = { role: null, userId: null, learnerId: null, pinVerifiedAt: 0 };
    return state;
  }

  /* ---------------- session ---------------- */
  let session = { role: null, userId: null, learnerId: null, pinVerifiedAt: 0 };

  function audit(actor, action, kind) {
    state.audit.unshift({ at: new Date().toISOString(), actor, action, kind: kind || 'general' });
    state.audit = state.audit.slice(0, 400);
    save();
  }

  const findUserByEmail = em => Object.values(state.users).find(u => u.email && u.email.toLowerCase() === String(em || '').toLowerCase().trim());
  const findLearnerByEmail = em => Object.values(state.learners).find(l => l.email && l.email.toLowerCase() === String(em || '').toLowerCase().trim());

  async function signIn(email, password) {
    const data = await api('POST', '/api/auth/signin', { email, password });
    if (data.ok) {
      applyServerPayload(data);
      return { ok: true, role: data.role, user: data.userId ? state.users[data.userId] : null, learner: data.learnerId ? state.learners[data.learnerId] : null };
    }
    return data;
  }

  async function signInChild(loginId, pin) {
    const data = await api('POST', '/api/auth/signin-child', { loginId, pin });
    if (data.ok) {
      applyServerPayload(data);
      return { ok: true, learner: state.learners[data.learnerId] };
    }
    return data;
  }

  function setLearnerCredentials(learnerId, { loginId, pin }) {
    const l = state.learners[learnerId];
    if (!l) return { ok: false, error: 'Learner not found.' };
    const id = normalizeLoginId(loginId);
    if (!validLoginId(id)) return { ok: false, error: 'Login ID must be 3–24 characters: letters, numbers, _ or -.' };
    const other = findLearnerByLoginId(id);
    if (other && other.id !== learnerId) return { ok: false, error: 'That login ID is already used by another learner.' };
    if (pin != null && pin !== '') {
      if (!/^\d{4}$/.test(String(pin))) return { ok: false, error: 'The code must be exactly 4 digits.' };
      l.pin = String(pin);
    }
    l.loginId = id;
    delete l.needsLoginSetup;
    delete l.suggestedLoginId;
    save();
    const parent = state.users[l.parentId];
    audit((parent && parent.email) || 'parent', `Set login ID for ${l.name} to ${id}`, 'account');
    return { ok: true, learner: l };
  }

  async function verifyPin(learnerId, pin) {
    if (!authToken) {
      const l = state.learners[learnerId];
      if (!l || String(l.pin) !== String(pin)) return false;
      session.pinVerifiedAt = Date.now();
      return true;
    }
    const data = await api('POST', '/api/auth/verify-pin', { learnerId, pin });
    if (!data.ok) return false;
    session.pinVerifiedAt = Date.now();
    return true;
  }

  function logout() {
    if (authToken) api('POST', '/api/auth/logout').catch(() => { });
    authToken = null;
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(CACHE_KEY);
    } catch (e) { /* ignore */ }
    state = emptyState();
    session = { role: null, userId: null, learnerId: null, pinVerifiedAt: 0 };
  }

  /* ---------------- signup: school ---------------- */
  async function signupSchool(f) {
    const data = await api('POST', '/api/auth/signup/school', f);
    if (!data.ok) return data;
    return { ok: true, pending: f };
  }

  function approveSchool(id) {
    const p = state.pendingSchools.find(x => x.id === id);
    if (!p) return { ok: false, error: 'That registration is no longer in the queue.' };
    const code = p.schoolName.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() + '-' + String(new Date().getFullYear()).slice(2);
    const school = { id: uid('s'), name: p.schoolName, code, district: p.district, contact: p.email, createdAt: today() };
    state.schools[school.id] = school;
    const u = { id: uid('u'), role: 'school', name: p.contactName, email: p.email, password: p.password, schoolId: school.id, status: 'active', createdAt: today() };
    state.users[u.id] = u;
    p.status = 'approved'; p.approvedAt = today(); p.schoolId = school.id;
    save();
    const admin = state.users[session.userId];
    audit((admin && admin.email) || 'admin', `Approved ${p.schoolName}; class code ${code} issued`, 'account');
    return { ok: true, school, code };
  }
  function rejectSchool(id, reason) {
    const p = state.pendingSchools.find(x => x.id === id);
    if (!p) return { ok: false, error: 'That registration is no longer in the queue.' };
    p.status = 'rejected'; p.reason = reason || 'Not verified'; save();
    const admin = state.users[session.userId];
    audit((admin && admin.email) || 'admin', `Rejected ${p.schoolName} — ${p.reason}`, 'account');
    return { ok: true };
  }

  /* ---------------- signup: parent / student (server + Resend) ---------------- */
  async function signupParent(f) {
    const data = await api('POST', '/api/auth/signup/parent', f);
    if (!data.ok) return data;
    return { ok: true, userId: data.userId, email: data.email };
  }

  async function resendParentEmailCode(userId) {
    return api('POST', '/api/auth/resend', { kind: 'parent', id: userId });
  }

  async function verifyParentEmailCode(userId, entered) {
    const data = await api('POST', '/api/auth/verify', { kind: 'parent', id: userId, code: entered });
    if (data.ok) applyServerPayload(data);
    return data.ok ? { ok: true, user: state.users[userId] || (data.userId && state.users[data.userId]) } : data;
  }

  async function signupStudent13(f) {
    const data = await api('POST', '/api/auth/signup/student', f);
    if (!data.ok) return data;
    return { ok: true, learnerId: data.learnerId, email: data.email };
  }

  async function resendEmailCode(learnerId) {
    return api('POST', '/api/auth/resend', { kind: 'student', id: learnerId });
  }

  async function verifyEmailCode(learnerId, entered) {
    const data = await api('POST', '/api/auth/verify', { kind: 'student', id: learnerId, code: entered });
    if (data.ok) applyServerPayload(data);
    return data.ok ? { ok: true, learner: state.learners[learnerId] || (data.learnerId && state.learners[data.learnerId]) } : data;
  }

  async function requestParentLink(f) {
    const data = await api('POST', '/api/auth/link-request', f);
    return { ok: true, parentExists: !!(data && data.parentExists) };
  }

  function pendingLinksFor(email) {
    return state.linkRequests.filter(r => r.status === 'awaiting parent' && r.parentEmail.toLowerCase() === String(email || '').toLowerCase());
  }
  function approveLink(reqId, consents, loginId) {
    const r = state.linkRequests.find(x => x.id === reqId);
    if (!r) return { ok: false, error: 'That request is no longer pending.' };
    const parent = state.users[session.userId];
    if (!consents.coppa) return { ok: false, error: 'A child under 13 cannot be activated without verifiable parental consent.' };
    const res = addLearner(parent.id, {
      name: r.childName, grade: r.grade, pin: r.pin, avatar: r.avatar,
      birthYear: r.birthYear, schoolCode: r.schoolCode, consents,
      loginId: loginId || r.loginId || suggestLoginId(r.childName)
    });
    if (!res.ok) return res;
    r.status = 'approved'; r.learnerId = res.learner.id; r.approvedAt = today();
    save();
    return { ok: true, learner: res.learner };
  }
  function declineLink(reqId) {
    const r = state.linkRequests.find(x => x.id === reqId);
    if (r) { r.status = 'declined'; save(); audit(state.users[session.userId].email, `Declined the under-13 signup for ${r.childName}`, 'consent'); }
    return { ok: true };
  }

  function addLearner(parentId, f) {
    const parent = state.users[parentId];
    if (!parent) return { ok: false, error: 'Parent account not found.' };
    const age = new Date().getFullYear() - Number(f.birthYear);
    const under13 = age < 13;
    if (under13 && !f.consents.coppa) return { ok: false, error: 'A child under 13 cannot be registered without verifiable parental consent.' };
    if (!f.consents.terms || !f.consents.privacy || !f.consents.progress) return { ok: false, error: 'The required consents must be accepted to create a learner profile.' };
    if (!/^\d{4}$/.test(String(f.pin || ''))) return { ok: false, error: 'The login code must be exactly 4 digits.' };
    const loginId = normalizeLoginId(f.loginId || suggestLoginId(f.name));
    if (!validLoginId(loginId)) return { ok: false, error: 'Choose a login ID (3–24 characters: letters, numbers, _ or -).' };
    if (findLearnerByLoginId(loginId)) return { ok: false, error: 'That login ID is already taken. Pick another.' };
    const school = Object.values(state.schools).find(s => s.code && s.code.toUpperCase() === String(f.schoolCode || '').toUpperCase());
    const l = {
      id: uid('l'), name: f.name, grade: f.grade, band: C.GRADE_TO_BAND[f.grade],
      pin: String(f.pin), loginId, avatar: f.avatar || '🐣', parentId, schoolId: school ? school.id : null,
      under13, status: 'active', xp: 0, streak: 0, badges: [], recoveryQueue: [], history: [],
      progress: {}, ap: { enrolled: [], courses: {} }, createdAt: today(),
      consent: { version: state.settings.consentVersion, at: new Date().toISOString(), by: parent.email, items: f.consents }
    };
    ensureProgress(l, l.band);
    state.learners[l.id] = l;
    parent.children = parent.children || [];
    parent.children.push(l.id);
    save();
    audit(parent.email, `${under13 ? 'Verifiable parental consent recorded' : 'Consent recorded'} for ${f.name} (grade ${f.grade}); login ID ${loginId}`, 'consent');
    return { ok: true, learner: l };
  }

  /* ---------------- progress ---------------- */
  function recordResult(learnerId, meta, score) {
    const l = state.learners[learnerId];
    const p = ensureProgress(l, meta.band);
    const key = `L${meta.level}A${meta.index}`;
    const a = p.attempts[key] || { best: 0, attempts: 0 };
    a.attempts++; a.best = Math.max(a.best, score.pct); a.lastAt = today();
    p.attempts[key] = a;

    if (score.passed) {
      p.passedInLevel = p.passedInLevel || {};
      const arr = p.passedInLevel[meta.level] || [];
      if (!arr.includes(meta.index)) arr.push(meta.index);
      p.passedInLevel[meta.level] = arr;
    }

    l.xp += score.xp;
    l.history.unshift({ at: today(), band: meta.band, level: meta.level, index: meta.index, pct: score.pct, passed: score.passed, xp: score.xp, recovered: score.recovered });
    l.history = l.history.slice(0, 60);

    const q = l.recoveryQueue || [];
    score.unresolved.forEach(u => { if (!q.some(x => x.qid === u.qid)) q.push(u); });
    l.recoveryQueue = q.filter(x => !Object.keys(score.clearedQids || {}).includes(x.qid)).slice(0, 40);

    let levelCleared = null;
    const need = state.settings.assessmentsToClear;
    const passedCount = ((p.passedInLevel || {})[meta.level] || []).length;
    if (!p.cleared[meta.level] && passedCount >= need) {
      p.cleared[meta.level] = { at: today(), passed: (p.passedInLevel[meta.level] || []).slice() };
      p.level = Math.min(E.LEVELS, meta.level + 1);
      l.badges.push({ band: meta.band, level: meta.level, at: today() });
      levelCleared = meta.level;
      audit(l.name, `Cleared ${bandName(meta.band)} level ${meta.level} and earned the ${C.LEVEL_NAMES[meta.level - 1]} badge`, 'progress');
    }
    save();
    return { levelCleared, passedCount, need };
  }

  /* ---------------- AP ---------------- */
  function apEnroll(learnerId, courseId) {
    const l = state.learners[learnerId];
    const ap = ensureAp(l);
    if (ap.enrolled.includes(courseId)) return { ok: false, error: 'Already enrolled.' };
    ap.enrolled.push(courseId);
    ap.courses[courseId] = ap.courses[courseId] || { units: {}, sets: [] };
    save();
    audit(l.name, `Enrolled in ${(AP.AP_COURSES.find(c => c.id === courseId) || {}).name || courseId}`, 'progress');
    return { ok: true };
  }
  function apDrop(learnerId, courseId) {
    const l = state.learners[learnerId];
    const ap = ensureAp(l);
    ap.enrolled = ap.enrolled.filter(c => c !== courseId);
    save();
    return { ok: true };
  }
  function recordApSet(learnerId, meta, sess, score) {
    const l = state.learners[learnerId];
    const ap = ensureAp(l);
    const cid = meta.course.id;
    const rec = ap.courses[cid] = ap.courses[cid] || { units: {}, sets: [] };
    sess.plan.forEach((q, i) => {
      const a = sess.answers[i];
      if (!a || q.reask) return;
      const u = q.unit || 0;
      if (!u) return;
      rec.units[u] = rec.units[u] || { right: 0, total: 0 };
      rec.units[u].total++;
      if (a.correct) rec.units[u].right++;
    });
    rec.sets.unshift({ at: today(), label: meta.label, unit: meta.unit, pct: score.pct, count: score.total, projected: AP.projectScore(score.pct) });
    rec.sets = rec.sets.slice(0, 30);
    l.xp += score.xp;
    save();
    audit(l.name, `${meta.label} in ${meta.course.name}: ${score.pct}%`, 'progress');
    return { projected: AP.projectScore(score.pct) };
  }
  function apCourseSummary(learner, courseId) {
    const ap = ensureAp(learner);
    const rec = ap.courses[courseId] || { units: {}, sets: [] };
    let right = 0, total = 0;
    Object.values(rec.units).forEach(u => { right += u.right; total += u.total; });
    const pct = total ? Math.round(right / total * 100) : null;
    return { rec, right, total, pct, projected: pct === null ? null : AP.projectScore(pct), sets: rec.sets };
  }

  const bandName = id => (C.BANDS.find(b => b.id === id) || {}).name || id;

  /* ---------------- rewards ---------------- */
  function rewardsFor(learnerId) {
    const l = state.learners[learnerId];
    const p = ensureProgress(l, l.band);
    const cleared = Object.keys(p.cleared).map(Number);
    const top = cleared.length ? Math.max(...cleared) : 0;
    return state.rewards.filter(r => r.active !== false).filter(r => {
      if (r.tier === 'personal' && r.childId !== learnerId) return false;
      if (r.band !== 'any' && r.band !== l.band) return false;
      return true;
    }).map(r => ({ ...r, unlocked: top >= r.level, claimed: state.grants.some(g => g.learnerId === learnerId && g.rewardId === r.id) }));
  }
  function claimReward(learnerId, rewardId) {
    const r = state.rewards.find(x => x.id === rewardId);
    if (!r) return { ok: false, error: 'That reward is no longer listed.' };
    if (state.grants.some(g => g.learnerId === learnerId && g.rewardId === rewardId)) return { ok: false, error: 'You have already claimed this one.' };
    if (r.stock !== undefined && r.stock <= 0) return { ok: false, error: 'This reward has run out. Check back after the next refresh.' };
    const status = r.tier === 'personal' ? 'awaiting parent' : 'claimed';
    const note = r.kind === 'code' ? ('Code ' + (r.sponsor || 'QQ').slice(0, 5).toUpperCase().replace(/[^A-Z]/g, 'X') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase()) : '';
    state.grants.push({ id: uid('g'), learnerId, rewardId, at: today(), status, note });
    if (r.stock !== undefined) r.stock--;
    save();
    audit(state.learners[learnerId].name, `Claimed reward: ${r.title}`, 'reward');
    return { ok: true, status, note };
  }
  function grantsFor(learnerId) {
    return state.grants.filter(g => g.learnerId === learnerId)
      .map(g => ({ ...g, reward: state.rewards.find(r => r.id === g.rewardId) })).filter(g => g.reward);
  }
  function setGrantStatus(grantId, status) {
    const g = state.grants.find(x => x.id === grantId);
    if (g) { g.status = status; save(); }
  }
  function placeOrder(learnerId, band, level, product, qty) {
    const price = state.settings.printPrices[product] * qty;
    const o = { id: 'QQ-' + (10042 + state.orders.length), learnerId, band, level, product, qty, price: Math.round(price * 100) / 100, status: 'Payment pending', at: today() };
    state.orders.unshift(o); save();
    audit(state.learners[learnerId].name, `Ordered ${qty} × ${product} print of the level ${level} badge`, 'order');
    return o;
  }

  window.QQ_STORE = {
    get state() { return state; },
    get session() { return session; },
    set session(v) { session = v; },
    get liveInfo() { return liveInfo; },
    get authToken() { return authToken; },
    load, save, reset, ensureProgress, ensureAp, bandName, audit, uid, today,
    signIn, signInChild, verifyPin, logout,
    signupSchool, approveSchool, rejectSchool,
    signupParent, resendParentEmailCode, verifyParentEmailCode,
    signupStudent13, resendEmailCode, verifyEmailCode,
    requestParentLink, pendingLinksFor, approveLink, declineLink, addLearner,
    setLearnerCredentials, normalizeLoginId, validLoginId, suggestLoginId, findLearnerByLoginId,
    recordResult, apEnroll, apDrop, recordApSet, apCourseSummary,
    rewardsFor, claimReward, grantsFor, setGrantStatus, placeOrder,
    findUserByEmail, CONSENT_ITEMS, DEFAULT_SETTINGS
  };
})();
