/* ============================================================
   QuestQuiz — state, accounts, verification, consent, rewards
   ============================================================ */
(function () {
  const C = window.QQ_CONTENT, E = window.QQ_ENGINE, AP = window.QQ_AP;
  const KEY = 'questquiz.v2';
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 9);
  const today = () => new Date().toISOString().slice(0, 10);
  const code6 = () => String(Math.floor(100000 + Math.random() * 900000));

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

  /* ---------------- seed ---------------- */
  function seed() {
    const st = {
      version: 2,
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      users: {}, learners: {}, schools: {},
      rewards: [], orders: [], audit: [], grants: [],
      pendingSchools: [], linkRequests: []
    };

    st.users['u_admin'] = { id: 'u_admin', role: 'admin', name: 'Platform Admin', email: 'admin@questquiz.app', password: 'admin123', status: 'active' };

    const school = { id: 's_maple', name: 'Maple Ridge High School', code: 'MAPLE-24', district: 'Calcasieu Parish', contact: 'office@mapleridge.edu', createdAt: today() };
    st.schools[school.id] = school;
    st.users['u_school'] = { id: 'u_school', role: 'school', name: 'Maple Ridge Front Office', email: 'office@mapleridge.edu', password: 'school123', schoolId: school.id, status: 'active' };

    const parent = { id: 'u_parent', role: 'parent', name: 'Riya Sharma', email: 'parent@questquiz.app', password: 'parent123', children: ['l_aarav', 'l_kabir'], status: 'active', verifiedAt: new Date().toISOString(), createdAt: today() };
    st.users[parent.id] = parent;

    const mkLearner = (id, name, grade, pin, avatar, extra) => Object.assign({
      id, name, grade, band: C.GRADE_TO_BAND[grade], pin, avatar,
      parentId: parent.id, schoolId: school.id,
      under13: Number(grade) <= 7,
      xp: 0, streak: 0, badges: [], recoveryQueue: [], history: [],
      progress: {}, ap: { enrolled: [], courses: {} }, createdAt: today(), status: 'active',
      consent: { version: st.settings.consentVersion, at: new Date().toISOString(), by: parent.email, items: { terms: true, privacy: true, coppa: true, progress: true, rewards: true, schoolshare: true } }
    }, extra || {});

    const aarav = mkLearner('l_aarav', 'Aarav', '7', '2468', '🦊', { loginId: 'aarav' });
    const kabir = mkLearner('l_kabir', 'Kabir', '11', '9021', '🦉', {
      under13: false, selfManaged: true, email: 'kabir@example.com', password: 'student123',
      verifiedAt: new Date().toISOString(), loginId: 'kabir'
    });
    st.learners[aarav.id] = aarav;
    st.learners[kabir.id] = kabir;

    // Aarav: mid-track in the Navigators band
    ensureProgress(aarav, 'm68');
    const p = aarav.progress.m68;
    p.cleared[1] = { at: today(), passed: [0, 1, 2, 3, 4] };
    p.cleared[2] = { at: today(), passed: [0, 1, 2, 4, 7] };
    p.level = 3;
    p.attempts = { 'L3A0': { best: 74, attempts: 1, lastAt: today() }, 'L3A1': { best: 82, attempts: 1, lastAt: today() } };
    p.passedInLevel = { 3: [1] };
    aarav.xp = 4820; aarav.streak = 6;
    aarav.badges = [{ band: 'm68', level: 1, at: today() }, { band: 'm68', level: 2, at: today() }];
    aarav.recoveryQueue = [
      { qid: 'bank:cs.m68.internet:11', band: 'm68', subject: 'Computer Science', srcType: 'bank', src: 'cs.m68.internet', seed: E.hash('rq1'), formsSeen: [0], prompt: 'Telling a server apart from a client' },
      { qid: 'bank:hist.m68.civics:7', band: 'm68', subject: 'History & Civics', srcType: 'bank', src: 'hist.m68.civics', seed: E.hash('rq2'), formsSeen: [0], prompt: 'Which branch does what' }
    ];
    aarav.history = [
      { at: today(), band: 'm68', level: 3, index: 1, pct: 82, passed: true, xp: 452, recovered: 3 },
      { at: today(), band: 'm68', level: 3, index: 0, pct: 74, passed: false, xp: 388, recovered: 2 }
    ];

    // Kabir: a junior taking four AP courses
    ensureProgress(kabir, 'h912');
    kabir.progress.h912.cleared[1] = { at: today(), passed: [0, 1, 2, 3, 4] };
    kabir.progress.h912.level = 2;
    kabir.xp = 11240; kabir.streak = 12;
    kabir.badges = [{ band: 'h912', level: 1, at: today() }];
    kabir.ap.enrolled = ['calc-ab', 'bio', 'apush', 'csa'];
    kabir.ap.courses = {
      'calc-ab': { units: { 1: { right: 14, total: 16 }, 2: { right: 11, total: 15 }, 3: { right: 6, total: 12 }, 6: { right: 9, total: 14 } }, sets: [{ at: today(), label: 'Unit 2 practice', unit: 2, pct: 73, count: 25 }, { at: today(), label: 'Mixed practice', unit: 0, pct: 68, count: 25 }] },
      'bio': { units: { 1: { right: 9, total: 10 }, 2: { right: 12, total: 14 }, 5: { right: 8, total: 13 }, 7: { right: 11, total: 13 } }, sets: [{ at: today(), label: 'Mixed practice', unit: 0, pct: 80, count: 25 }] },
      'apush': { units: { 3: { right: 7, total: 12 }, 5: { right: 10, total: 14 }, 8: { right: 9, total: 12 } }, sets: [{ at: today(), label: 'Mixed practice', unit: 0, pct: 63, count: 25 }] },
      'csa': { units: { 4: { right: 13, total: 15 }, 6: { right: 10, total: 14 }, 10: { right: 5, total: 11 } }, sets: [{ at: today(), label: 'Unit 10 practice', unit: 10, pct: 45, count: 25 }] }
    };

    st.rewards = [
      { id: uid('r'), tier: 'platform', title: 'Badge Sticker Sheet — free print credit', desc: 'One free printed sticker sheet of any badge you have earned.', kind: 'credit', band: 'any', level: 1, stock: 500, sponsor: 'QuestQuiz', active: true },
      { id: uid('r'), tier: 'platform', title: 'Wallpaper Pack: Aurora Set', desc: 'Five wallpapers for phone and laptop.', kind: 'download', band: 'any', level: 3, stock: 9999, sponsor: 'QuestQuiz', active: true },
      { id: uid('r'), tier: 'platform', title: 'Double XP Weekend', desc: 'Every correct answer is worth double XP for 48 hours.', kind: 'perk', band: 'any', level: 5, stock: 9999, sponsor: 'QuestQuiz', active: true },
      { id: uid('r'), tier: 'platform', title: 'AP Practice Unlimited — 30 days', desc: 'Unlimited AP practice sets and full mock exams for a month.', kind: 'perk', band: 'h912', level: 2, stock: 9999, sponsor: 'QuestQuiz', active: true },
      { id: uid('r'), tier: 'partner', title: 'Scholastic — 20% off one book', desc: 'Single-use code, valid online, no personal data shared beyond a first name.', kind: 'code', band: 'any', level: 2, stock: 240, sponsor: 'Scholastic', active: true },
      { id: uid('r'), tier: 'partner', title: 'Local Library — skip-the-queue card', desc: 'Show at the desk for priority holds for one month.', kind: 'physical', band: 'any', level: 4, stock: 60, sponsor: 'Calcasieu Parish Library', active: true },
      { id: uid('r'), tier: 'partner', title: 'Science Museum — child ticket', desc: 'One free child entry with a paying adult.', kind: 'physical', band: 'any', level: 6, stock: 40, sponsor: 'Lake Charles Science Centre', active: true },
      { id: uid('r'), tier: 'personal', title: '30 minutes extra screen time', desc: 'Granted by a parent after a level is cleared.', kind: 'privilege', band: 'm68', level: 3, ownerId: 'u_parent', childId: 'l_aarav', active: true },
      { id: uid('r'), tier: 'personal', title: 'Choose Friday dinner', desc: 'You pick what the family eats on Friday.', kind: 'privilege', band: 'm68', level: 4, ownerId: 'u_parent', childId: 'l_aarav', active: true },
      { id: uid('r'), tier: 'personal', title: 'Driving lesson on Saturday', desc: 'One hour behind the wheel for every AP unit brought above 75%.', kind: 'privilege', band: 'h912', level: 2, ownerId: 'u_parent', childId: 'l_kabir', active: true }
    ];

    st.grants = [{ id: uid('g'), learnerId: 'l_aarav', rewardId: st.rewards[4].id, at: today(), status: 'claimed', note: 'Code SCHOL-4F2K9' }];
    st.orders = [{ id: 'QQ-10041', learnerId: 'l_aarav', band: 'm68', level: 2, product: 'sticker', qty: 2, price: 9, status: 'Printed — awaiting dispatch', at: today() }];

    // A school waiting on admin approval, so the queue is not empty on first look
    st.pendingSchools = [{
      id: uid('ps'), schoolName: 'Westlake STEM Academy', district: 'Calcasieu Parish',
      contactName: 'Dana Whitfield', role: 'Assistant Principal', email: 'dwhitfield@westlakestem.edu',
      students: '640', password: 'school123',
      status: 'pending', at: today()
    }];

    // An under-13 signup waiting on a parent
    st.linkRequests = [{
      id: uid('lr'), childName: 'Nina', grade: '6', birthYear: new Date().getFullYear() - 11,
      pin: '3344', avatar: '🐢', parentEmail: 'parent@questquiz.app', schoolCode: 'MAPLE-24',
      status: 'awaiting parent', at: today()
    }];

    st.audit = [
      { at: new Date().toISOString(), actor: 'parent@questquiz.app', action: 'Parental consent recorded for Aarav (under 13)', kind: 'consent' },
      { at: new Date().toISOString(), actor: 'kabir@example.com', action: 'Student email verified (age 13 or older)', kind: 'auth' },
      { at: new Date().toISOString(), actor: 'dwhitfield@westlakestem.edu', action: 'School registration submitted — awaiting admin approval', kind: 'account' },
      { at: new Date().toISOString(), actor: 'admin@questquiz.app', action: 'Behavioural advertising disabled platform-wide', kind: 'policy' }
    ];
    return st;
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

  /* ---------------- persistence ---------------- */
  let state = null;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.version === 2) {
          state = migrateLearnerLogins(p);
          save();
          return state;
        }
      }
    } catch (e) { /* private window or blocked storage — run from memory */ }
    state = seed(); save(); return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) { } state = seed(); save(); return state; }

  /* ---------------- session ---------------- */
  let session = { role: null, userId: null, learnerId: null, pinVerifiedAt: 0 };

  function audit(actor, action, kind) {
    state.audit.unshift({ at: new Date().toISOString(), actor, action, kind: kind || 'general' });
    state.audit = state.audit.slice(0, 400);
    save();
  }

  const findUserByEmail = em => Object.values(state.users).find(u => u.email.toLowerCase() === String(em || '').toLowerCase().trim());
  const findLearnerByEmail = em => Object.values(state.learners).find(l => l.email && l.email.toLowerCase() === String(em || '').toLowerCase().trim());

  /* One sign-in for every role — the account decides where you land. */
  function signIn(email, password) {
    const em = String(email || '').toLowerCase().trim();
    const u = findUserByEmail(em);
    if (u) {
      if (u.password !== password) return { ok: false, error: 'That password does not match this account.' };
      if (u.status === 'email-pending' || u.status === 'otp-pending') {
        return { ok: false, resume: 'parent-email', userId: u.id, error: 'This account still needs its email verified.' };
      }
      if (u.status === 'pending') return { ok: false, resume: 'school-pending', error: 'This school registration is still waiting for admin approval.' };
      if (u.status === 'rejected') return { ok: false, error: 'This school registration was not approved. Contact support to appeal.' };
      session = { role: u.role, userId: u.id, learnerId: null, pinVerifiedAt: 0 };
      audit(u.email, `Signed in as ${u.role}`, 'auth');
      return { ok: true, role: u.role, user: u };
    }
    const l = findLearnerByEmail(em);
    if (l) {
      if (l.password !== password) return { ok: false, error: 'That password does not match this account.' };
      if (l.status === 'email-pending') return { ok: false, resume: 'student-email', learnerId: l.id, error: 'This account still needs its email verified.' };
      session = { role: 'child', userId: l.parentId || null, learnerId: l.id, pinVerifiedAt: Date.now() };
      audit(l.email, 'Student signed in', 'auth');
      return { ok: true, role: 'child', learner: l };
    }
    const ps = state.pendingSchools.find(p => p.email.toLowerCase() === em);
    if (ps) return { ok: false, resume: 'school-pending', pending: ps, error: 'This school registration is ' + ps.status + '.' };
    return { ok: false, error: 'No account found for that email. Create one instead.' };
  }

  function signInChild(loginId, pin) {
    const id = normalizeLoginId(loginId);
    if (!validLoginId(id)) return { ok: false, error: 'Enter the login ID your parent gave you.' };
    const l = findLearnerByLoginId(id);
    if (!l || l.status !== 'active') return { ok: false, error: 'That login ID or code is not right. Ask a parent for help.' };
    if (l.needsLoginSetup || !l.loginId) return { ok: false, error: 'A parent still needs to finish setting up this login. Ask them to open Family → Login details.' };
    if (String(l.pin) !== String(pin)) return { ok: false, error: 'That login ID or code is not right. Ask a parent for help.' };
    session = { role: 'child', userId: l.parentId, learnerId: l.id, pinVerifiedAt: Date.now() };
    audit(l.loginId, 'Learner signed in with login ID + code', 'auth');
    return { ok: true, learner: l };
  }

  function setLearnerCredentials(learnerId, { loginId, pin }) {
    const l = state.learners[learnerId];
    if (!l) return { ok: false, error: 'Learner not found.' };
    const id = normalizeLoginId(loginId);
    if (!validLoginId(id)) return { ok: false, error: 'Login ID must be 3–24 characters: letters, numbers, _ or -.' };
    const other = findLearnerByLoginId(id);
    if (other && other.id !== learnerId) return { ok: false, error: 'That login ID is already used by another learner on this device.' };
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

  function verifyPin(learnerId, pin) {
    const l = state.learners[learnerId];
    if (!l || String(l.pin) !== String(pin)) return false;
    session.pinVerifiedAt = Date.now();
    audit(l.name, 'Identity confirmed before an assessment', 'exam');
    return true;
  }
  function logout() { session = { role: null, userId: null, learnerId: null, pinVerifiedAt: 0 }; }

  /* ---------------- signup: school (admin approval) ---------------- */
  function signupSchool(f) {
    if (findUserByEmail(f.email) || state.pendingSchools.some(p => p.email.toLowerCase() === f.email.toLowerCase() && p.status === 'pending'))
      return { ok: false, error: 'A registration already exists for that email address.' };
    const rec = Object.assign({ id: uid('ps'), status: 'pending', at: today() }, f);
    state.pendingSchools.push(rec); save();
    audit(f.email, `School registration submitted for ${f.schoolName} — awaiting admin approval`, 'account');
    return { ok: true, pending: rec };
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
    audit(state.users[session.userId].email, `Approved ${p.schoolName}; class code ${code} issued`, 'account');
    return { ok: true, school, code };
  }
  function rejectSchool(id, reason) {
    const p = state.pendingSchools.find(x => x.id === id);
    if (!p) return { ok: false, error: 'That registration is no longer in the queue.' };
    p.status = 'rejected'; p.reason = reason || 'Not verified'; save();
    audit(state.users[session.userId].email, `Rejected ${p.schoolName} — ${p.reason}`, 'account');
    return { ok: true };
  }

  /* ---------------- signup: parent (email verification) ---------------- */
  function signupParent(f) {
    if (findUserByEmail(f.email)) return { ok: false, error: 'An account already exists for that email. Sign in instead.' };
    const code = code6();
    const u = {
      id: uid('u'), role: 'parent', name: f.name, email: f.email, password: f.password,
      children: [], status: 'email-pending', emailCode: code, codeAt: Date.now(),
      codeAttempts: 0, createdAt: today()
    };
    state.users[u.id] = u; save();
    audit(f.email, 'Parent account created — verification code sent to email', 'account');
    return { ok: true, user: u, code };
  }
  function resendParentEmailCode(userId) {
    const u = state.users[userId];
    if (!u) return { ok: false, error: 'Account not found.' };
    u.emailCode = code6(); u.codeAt = Date.now(); u.codeAttempts = 0;
    delete u.otp; delete u.otpAt; delete u.otpAttempts;
    if (u.status === 'otp-pending') u.status = 'email-pending';
    save();
    audit(u.email, 'Parent email verification code resent', 'auth');
    return { ok: true, code: u.emailCode };
  }
  function verifyParentEmailCode(userId, entered) {
    const u = state.users[userId];
    if (!u) return { ok: false, error: 'Account not found.' };
    const code = u.emailCode || u.otp;
    const at = u.codeAt || u.otpAt;
    if (Date.now() - at > 30 * 60 * 1000) return { ok: false, error: 'That code has expired. Send a new one.' };
    u.codeAttempts = (u.codeAttempts || u.otpAttempts || 0) + 1;
    if (u.codeAttempts > 5) return { ok: false, error: 'Too many attempts. Send a new code.' };
    if (String(entered) !== String(code)) { save(); return { ok: false, error: 'That code is not right. ' + (6 - u.codeAttempts) + ' attempts left.' }; }
    u.status = 'active'; u.verifiedAt = new Date().toISOString();
    delete u.emailCode; delete u.otp; delete u.otpAt; delete u.otpAttempts;
    save();
    audit(u.email, 'Parent email verified', 'auth');
    session = { role: 'parent', userId: u.id, learnerId: null, pinVerifiedAt: 0 };
    return { ok: true, user: u };
  }

  /* ---------------- signup: student ---------------- */
  function signupStudent13(f) {
    if (findLearnerByEmail(f.email) || findUserByEmail(f.email))
      return { ok: false, error: 'An account already exists for that email. Sign in instead.' };
    if (!f.consents.terms || !f.consents.privacy || !f.consents.progress)
      return { ok: false, error: 'The required consents must be accepted to create an account.' };
    const school = Object.values(state.schools).find(s => s.code.toUpperCase() === String(f.schoolCode || '').toUpperCase());
    const codeV = code6();
    let loginId = normalizeLoginId(f.loginId || String(f.email || '').split('@')[0] || f.name);
    if (!validLoginId(loginId) || findLearnerByLoginId(loginId)) loginId = suggestLoginId(f.name);
    const l = {
      id: uid('l'), name: f.name, grade: f.grade, band: C.GRADE_TO_BAND[f.grade],
      pin: f.pin, loginId, avatar: f.avatar || '🦉', email: f.email, password: f.password,
      parentId: null, schoolId: school ? school.id : null, under13: false, selfManaged: true,
      status: 'email-pending', emailCode: codeV, codeAt: Date.now(), codeAttempts: 0,
      xp: 0, streak: 0, badges: [], recoveryQueue: [], history: [], progress: {},
      ap: { enrolled: [], courses: {} }, createdAt: today(),
      consent: { version: state.settings.consentVersion, at: new Date().toISOString(), by: f.email, items: f.consents }
    };
    ensureProgress(l, l.band);
    state.learners[l.id] = l; save();
    audit(f.email, `Student account created (age 13+) — verification code sent to email`, 'account');
    return { ok: true, learner: l, code: codeV };
  }
  function resendEmailCode(learnerId) {
    const l = state.learners[learnerId];
    if (!l) return { ok: false, error: 'Account not found.' };
    l.emailCode = code6(); l.codeAt = Date.now(); l.codeAttempts = 0; save();
    return { ok: true, code: l.emailCode };
  }
  function verifyEmailCode(learnerId, entered) {
    const l = state.learners[learnerId];
    if (!l) return { ok: false, error: 'Account not found.' };
    if (Date.now() - l.codeAt > 30 * 60 * 1000) return { ok: false, error: 'That code has expired. Send a new one.' };
    l.codeAttempts = (l.codeAttempts || 0) + 1;
    if (l.codeAttempts > 5) return { ok: false, error: 'Too many attempts. Send a new code.' };
    if (String(entered) !== String(l.emailCode)) { save(); return { ok: false, error: 'That code is not right. ' + (6 - l.codeAttempts) + ' attempts left.' }; }
    l.status = 'active'; l.verifiedAt = new Date().toISOString(); delete l.emailCode;
    save();
    audit(l.email, 'Student email verified', 'auth');
    session = { role: 'child', userId: null, learnerId: l.id, pinVerifiedAt: Date.now() };
    return { ok: true, learner: l };
  }

  /* Under 13 — cannot proceed without a parent account behind it. */
  function requestParentLink(f) {
    const rec = Object.assign({ id: uid('lr'), status: 'awaiting parent', at: today() }, f);
    state.linkRequests.push(rec); save();
    const parentExists = !!findUserByEmail(f.parentEmail);
    audit(f.parentEmail, `Under-13 signup for ${f.childName} — parental consent requested${parentExists ? '' : ' (no parent account yet)'}`, 'consent');
    return { ok: true, request: rec, parentExists };
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
    const school = Object.values(state.schools).find(s => s.code.toUpperCase() === String(f.schoolCode || '').toUpperCase());
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
    // First-attempt answers only, bucketed by unit
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
