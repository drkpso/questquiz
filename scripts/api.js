/* QuestQuiz production API — server-backed accounts, sessions, and state sync.
   Email verification codes are generated here and sent via Resend; codes are
   never returned to the client when RESEND_API_KEY is configured. */
const crypto = require('crypto');
const db = require('./db');
const email = require('./email');
const sec = require('./security');

const GRADE_TO_BAND = {
  K: 'k2', 1: 'k2', 2: 'k2', 3: 'e35', 4: 'e35', 5: 'e35',
  6: 'm68', 7: 'm68', 8: 'm68', 9: 'h912', 10: 'h912', 11: 'h912', 12: 'h912'
};

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CODE_TTL_MS = 30 * 60 * 1000;

function uid(p) { return p + '_' + crypto.randomBytes(4).toString('hex'); }
function today() { return new Date().toISOString().slice(0, 10); }
function code6() { return String(Math.floor(100000 + Math.random() * 900000)); }
function token() { return crypto.randomBytes(32).toString('hex'); }
function now() { return Date.now(); }

function normalizeLoginId(raw) {
  return String(raw || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
}
function validLoginId(id) {
  return /^[a-z0-9][a-z0-9_-]{2,23}$/.test(id);
}

function stripSecrets(entity) {
  if (!entity || typeof entity !== 'object') return entity;
  const out = { ...entity };
  delete out.password;
  delete out.pin;
  delete out.emailCode;
  delete out.codeAt;
  delete out.codeAttempts;
  delete out.otp;
  delete out.otpAt;
  delete out.otpAttempts;
  if (entity.pin != null && entity.pin !== '') out.hasPin = true;
  return out;
}

function findUserByEmail(d, em) {
  const e = String(em || '').toLowerCase().trim();
  return Object.values(d.users).find(u => u.email && u.email.toLowerCase() === e) || null;
}
function findLearnerByEmail(d, em) {
  const e = String(em || '').toLowerCase().trim();
  return Object.values(d.learners).find(l => l.email && l.email.toLowerCase() === e) || null;
}
function findLearnerByLoginId(d, loginId) {
  const id = normalizeLoginId(loginId);
  if (!id) return null;
  return Object.values(d.learners).find(l => l.loginId && normalizeLoginId(l.loginId) === id) || null;
}

function suggestLoginId(d, name) {
  const base = normalizeLoginId(name).replace(/^_+|_+$/g, '') || 'learner';
  const stem = base.slice(0, 20);
  const taken = id => Object.values(d.learners).some(l => l.loginId && normalizeLoginId(l.loginId) === id);
  if (validLoginId(stem) && !taken(stem)) return stem;
  for (let i = 2; i < 100; i++) {
    const cand = (stem.slice(0, 20) + i).slice(0, 24);
    if (validLoginId(cand) && !taken(cand)) return cand;
  }
  return 'kid_' + crypto.randomBytes(3).toString('hex');
}

function audit(d, actor, action, kind) {
  d.audit = d.audit || [];
  d.audit.unshift({ at: new Date().toISOString(), actor, action, kind: kind || 'general' });
  d.audit = d.audit.slice(0, 400);
}

function ensureAdmin() {
  const emailAddr = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!emailAddr || !password) return;
  const hashed = sec.isHashed(password) ? password : sec.hashSecret(password);
  db.mutate(d => {
    const existing = findUserByEmail(d, emailAddr);
    if (existing) {
      existing.role = 'admin';
      if (sec.verifySecret(password, existing.password)) {
        if (!sec.isHashed(existing.password)) existing.password = sec.hashSecret(password);
      } else {
        existing.password = hashed;
      }
      existing.status = 'active';
      existing.name = existing.name || 'Platform Admin';
      return;
    }
    const id = 'u_admin';
    d.users[id] = {
      id, role: 'admin', name: 'Platform Admin',
      email: emailAddr, password: hashed, status: 'active', createdAt: today()
    };
  });
}

function bootSecurity() {
  ensureAdmin();
  const n = sec.migrateAllPlaintextInPlace();
  if (n > 0) console.log('Hashed ' + n + ' plaintext secret(s) in place (scrypt).');
}

function createSession(d, { role, userId, learnerId }) {
  const t = token();
  d.sessions = d.sessions || {};
  d.sessions[t] = {
    token: t, role, userId: userId || null, learnerId: learnerId || null,
    createdAt: now(), expiresAt: now() + SESSION_TTL_MS
  };
  return t;
}

function getSession(reqToken) {
  if (!reqToken) return null;
  const d = db.get();
  const s = (d.sessions || {})[reqToken];
  if (!s) return null;
  if (s.expiresAt < now()) {
    db.mutate(x => { delete (x.sessions || {})[reqToken]; });
    return null;
  }
  return s;
}

function bearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  return null;
}

/** Build a client-safe state snapshot scoped to the session. */
function scopedState(d, session) {
  const settings = d.settings || {};
  const rewards = (d.rewards || []).filter(r => r.tier === 'platform' || r.tier === 'partner' || (
    session && session.role === 'parent' && r.tier === 'personal' && r.ownerId === session.userId
  ) || (
    session && session.role === 'child' && r.tier === 'personal' && r.childId === session.learnerId
  ) || (
    session && session.role === 'admin'
  ));

  if (!session) {
    return {
      version: 2,
      settings,
      users: {},
      learners: {},
      schools: {},
      rewards: rewards.filter(r => r.tier === 'platform' || r.tier === 'partner'),
      grants: [],
      orders: [],
      pendingSchools: [],
      linkRequests: [],
      audit: []
    };
  }

  if (session.role === 'admin') {
    const users = {};
    Object.values(d.users).forEach(u => { users[u.id] = stripSecrets(u); });
    const learners = {};
    Object.values(d.learners).forEach(l => { learners[l.id] = stripSecrets(l); });
    return {
      version: 2,
      settings,
      users,
      learners,
      schools: { ...d.schools },
      rewards: [...(d.rewards || [])],
      grants: [...(d.grants || [])],
      orders: [...(d.orders || [])],
      pendingSchools: (d.pendingSchools || []).map(p => {
        const x = { ...p }; delete x.password; return x;
      }),
      linkRequests: [...(d.linkRequests || [])],
      audit: [...(d.audit || [])]
    };
  }

  if (session.role === 'school') {
    const u = d.users[session.userId];
    const schoolId = u && u.schoolId;
    const users = {};
    if (u) users[u.id] = stripSecrets(u);
    const learners = {};
    Object.values(d.learners).forEach(l => {
      if (l.schoolId === schoolId) learners[l.id] = stripSecrets(l);
    });
    const schools = {};
    if (schoolId && d.schools[schoolId]) schools[schoolId] = d.schools[schoolId];
    return {
      version: 2, settings, users, learners, schools,
      rewards: rewards.filter(r => r.tier === 'platform' || r.tier === 'partner'),
      grants: (d.grants || []).filter(g => learners[g.learnerId]),
      orders: (d.orders || []).filter(o => learners[o.learnerId]),
      pendingSchools: [],
      linkRequests: [],
      audit: (d.audit || []).filter(a => a.actor === (u && u.email)).slice(0, 50)
    };
  }

  if (session.role === 'parent') {
    const u = d.users[session.userId];
    const users = {};
    if (u) users[u.id] = stripSecrets(u);
    const childIds = new Set((u && u.children) || []);
    const learners = {};
    Object.values(d.learners).forEach(l => {
      if (childIds.has(l.id) || l.parentId === session.userId) {
        learners[l.id] = stripSecrets(l);
        childIds.add(l.id);
      }
    });
    const schools = {};
    Object.values(learners).forEach(l => {
      if (l.schoolId && d.schools[l.schoolId]) schools[l.schoolId] = d.schools[l.schoolId];
    });
    // Allow looking up school by class code when adding a child
    Object.values(d.schools || {}).forEach(s => { schools[s.id] = { id: s.id, name: s.name, code: s.code }; });
    return {
      version: 2, settings, users, learners, schools,
      rewards,
      grants: (d.grants || []).filter(g => childIds.has(g.learnerId)),
      orders: (d.orders || []).filter(o => childIds.has(o.learnerId)),
      pendingSchools: [],
      linkRequests: (d.linkRequests || []).filter(r =>
        r.parentEmail && u && r.parentEmail.toLowerCase() === u.email.toLowerCase()
      ),
      audit: (d.audit || []).filter(a => a.actor === (u && u.email) || Object.values(learners).some(l => a.actor === l.name || a.actor === l.loginId || a.actor === l.email)).slice(0, 80)
    };
  }

  if (session.role === 'child') {
    const l = d.learners[session.learnerId];
    const learners = {};
    if (l) learners[l.id] = stripSecrets(l);
    const users = {};
    if (l && l.parentId && d.users[l.parentId]) {
      const p = stripSecrets(d.users[l.parentId]);
      users[p.id] = { id: p.id, role: p.role, name: p.name, email: p.email, children: p.children, status: p.status };
    }
    const schools = {};
    if (l && l.schoolId && d.schools[l.schoolId]) {
      const s = d.schools[l.schoolId];
      schools[s.id] = { id: s.id, name: s.name, code: s.code };
    }
    return {
      version: 2, settings, users, learners, schools,
      rewards,
      grants: (d.grants || []).filter(g => g.learnerId === session.learnerId),
      orders: (d.orders || []).filter(o => o.learnerId === session.learnerId),
      pendingSchools: [],
      linkRequests: [],
      audit: (d.audit || []).filter(a => l && (a.actor === l.name || a.actor === l.loginId || a.actor === l.email)).slice(0, 40)
    };
  }

  return scopedState(d, null);
}

async function sendCode(to, code, purpose) {
  if (!email.configured()) {
    return { ok: false, error: 'Email delivery is not configured. Set RESEND_API_KEY on the server.' };
  }
  const result = await email.sendVerificationCode({ email: to, code, purpose });
  if (!result.ok) return { ok: false, error: result.error || 'Email could not be sent.' };
  if (result.demo) {
    return { ok: false, error: 'Email delivery is not configured. Set RESEND_API_KEY on the server.' };
  }
  return { ok: true };
}

function publicStatus() {
  bootSecurity();
  return {
    ok: true,
    live: true,
    serverBacked: true,
    emailConfigured: email.configured(),
    from: email.configured() ? email.fromAddress() : null,
    dataDir: db.DATA_DIR,
    secretsHashed: true,
    rateLimited: true
  };
}

/* ---------------- auth handlers ---------------- */

async function signupParent(body, req) {
  const name = String(body.name || '').trim();
  const em = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!name || !em || password.length < 6) {
    return { ok: false, error: 'Name, email, and a password of at least 6 characters are required.' };
  }
  bootSecurity();
  const code = code6();
  let userId = null;
  const conflict = db.mutate(d => {
    if (findUserByEmail(d, em) || findLearnerByEmail(d, em)) {
      return 'An account already exists for that email. Sign in instead.';
    }
    const u = {
      id: uid('u'), role: 'parent', name, email: em, password: sec.hashSecret(password),
      children: [], status: 'email-pending', emailCode: sec.hashSecret(code), codeAt: now(),
      codeAttempts: 0, createdAt: today()
    };
    d.users[u.id] = u;
    audit(d, em, 'Parent account created — verification code sent to email', 'account');
    userId = u.id;
    return null;
  });
  if (conflict) return { ok: false, error: conflict };

  const sent = await sendCode(em, code, 'parent');
  if (!sent.ok) {
    db.mutate(d => { delete d.users[userId]; });
    return { ok: false, error: sent.error };
  }
  return { ok: true, userId, email: em };
}

async function signupStudent(body) {
  const name = String(body.name || '').trim();
  const em = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const grade = String(body.grade || '');
  const pin = String(body.pin || '');
  const consents = body.consents || {};
  if (!name || !em || password.length < 6) {
    return { ok: false, error: 'Name, email, and a password of at least 6 characters are required.' };
  }
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'The exam PIN must be exactly 4 digits.' };
  if (!consents.terms || !consents.privacy || !consents.progress) {
    return { ok: false, error: 'The required consents must be accepted to create an account.' };
  }
  const codeV = code6();
  let learnerId = null;
  const err = db.mutate(d => {
    if (findLearnerByEmail(d, em) || findUserByEmail(d, em)) {
      return 'An account already exists for that email. Sign in instead.';
    }
    const school = Object.values(d.schools).find(s =>
      s.code && s.code.toUpperCase() === String(body.schoolCode || '').toUpperCase()
    );
    let loginId = normalizeLoginId(body.loginId || em.split('@')[0] || name);
    if (!validLoginId(loginId) || findLearnerByLoginId(d, loginId)) loginId = suggestLoginId(d, name);
    const band = GRADE_TO_BAND[grade] || GRADE_TO_BAND[Number(grade)] || 'h912';
    const l = {
      id: uid('l'), name, grade, band, pin: sec.hashSecret(pin), loginId,
      avatar: body.avatar || '🦉', email: em, password: sec.hashSecret(password),
      parentId: null, schoolId: school ? school.id : null,
      under13: false, selfManaged: true,
      status: 'email-pending', emailCode: sec.hashSecret(codeV), codeAt: now(), codeAttempts: 0,
      xp: 0, streak: 0, badges: [], recoveryQueue: [], history: [],
      progress: { [band]: { level: 1, cleared: {}, attempts: {}, passedInLevel: {} } },
      ap: { enrolled: [], courses: {} }, createdAt: today(),
      consent: { version: (d.settings && d.settings.consentVersion) || '2026-09-A', at: new Date().toISOString(), by: em, items: consents }
    };
    d.learners[l.id] = l;
    audit(d, em, 'Student account created (age 13+) — verification code sent to email', 'account');
    learnerId = l.id;
    return null;
  });
  if (err) return { ok: false, error: err };

  const sent = await sendCode(em, codeV, 'student');
  if (!sent.ok) {
    db.mutate(d => { delete d.learners[learnerId]; });
    return { ok: false, error: sent.error };
  }
  return { ok: true, learnerId, email: em };
}

async function resendCode(body, req) {
  const kind = body.kind === 'parent' ? 'parent' : 'student';
  const id = body.id;
  const lockId = id || sec.clientKey(req);
  const locked = sec.checkLock('resend', lockId);
  if (!locked.ok) return locked;
  const ipLock = sec.checkLock('resend', 'ip:' + sec.clientKey(req));
  if (!ipLock.ok) return ipLock;

  let emailAddr = null;
  let code = null;
  const err = db.mutate(d => {
    if (kind === 'parent') {
      const u = d.users[id];
      if (!u) return 'Account not found.';
      code = code6();
      u.emailCode = sec.hashSecret(code); u.codeAt = now(); u.codeAttempts = 0;
      delete u.otp; delete u.otpAt; delete u.otpAttempts;
      if (u.status === 'otp-pending') u.status = 'email-pending';
      emailAddr = u.email;
      audit(d, u.email, 'Parent email verification code resent', 'auth');
    } else {
      const l = d.learners[id];
      if (!l) return 'Account not found.';
      code = code6();
      l.emailCode = sec.hashSecret(code); l.codeAt = now(); l.codeAttempts = 0;
      emailAddr = l.email;
      audit(d, l.email, 'Student email verification code resent', 'auth');
    }
    return null;
  });
  if (err) return { ok: false, error: err };
  const sent = await sendCode(emailAddr, code, kind);
  if (!sent.ok) return { ok: false, error: sent.error };
  sec.recordResendOk(lockId);
  sec.recordResendOk('ip:' + sec.clientKey(req));
  return { ok: true };
}

function verifyCode(body, req) {
  const kind = body.kind === 'parent' ? 'parent' : 'student';
  const id = body.id;
  const entered = String(body.code || '').trim();
  const lockId = id || sec.clientKey(req);
  const locked = sec.checkLock('verify', lockId);
  if (!locked.ok) return locked;
  const ipLock = sec.checkLock('verify', 'ip:' + sec.clientKey(req));
  if (!ipLock.ok) return ipLock;

  let sessionToken = null;
  let role = null;
  let userId = null;
  let learnerId = null;
  let emailAddr = null;

  const err = db.mutate(d => {
    if (kind === 'parent') {
      const u = d.users[id];
      if (!u) return 'Account not found.';
      const code = u.emailCode || u.otp;
      const at = u.codeAt || u.otpAt;
      if (!code || !at || now() - at > CODE_TTL_MS) return 'That code has expired. Send a new one.';
      u.codeAttempts = (u.codeAttempts || u.otpAttempts || 0) + 1;
      if (u.codeAttempts > 5) return 'Too many attempts. Send a new code.';
      if (!sec.verifySecret(entered, code)) {
        return 'That code is not right. ' + (6 - u.codeAttempts) + ' attempts left.';
      }
      u.status = 'active'; u.verifiedAt = new Date().toISOString();
      delete u.emailCode; delete u.otp; delete u.otpAt; delete u.otpAttempts; delete u.codeAt; delete u.codeAttempts;
      audit(d, u.email, 'Parent email verified', 'auth');
      sessionToken = createSession(d, { role: 'parent', userId: u.id });
      role = 'parent'; userId = u.id; emailAddr = u.email;
    } else {
      const l = d.learners[id];
      if (!l) return 'Account not found.';
      if (!l.emailCode || !l.codeAt || now() - l.codeAt > CODE_TTL_MS) return 'That code has expired. Send a new one.';
      l.codeAttempts = (l.codeAttempts || 0) + 1;
      if (l.codeAttempts > 5) return 'Too many attempts. Send a new code.';
      if (!sec.verifySecret(entered, l.emailCode)) {
        return 'That code is not right. ' + (6 - l.codeAttempts) + ' attempts left.';
      }
      l.status = 'active'; l.verifiedAt = new Date().toISOString();
      delete l.emailCode; delete l.codeAt; delete l.codeAttempts;
      audit(d, l.email, 'Student email verified', 'auth');
      sessionToken = createSession(d, { role: 'child', userId: l.parentId || null, learnerId: l.id });
      role = 'child'; learnerId = l.id; emailAddr = l.email;
    }
    return null;
  });
  if (err) {
    sec.recordFailure('verify', lockId);
    sec.recordFailure('verify', 'ip:' + sec.clientKey(req));
    return { ok: false, error: err };
  }
  sec.recordSuccess('verify', lockId);
  const d = db.get();
  const session = getSession(sessionToken);
  return {
    ok: true,
    token: sessionToken,
    role,
    userId,
    learnerId,
    email: emailAddr,
    state: scopedState(d, session),
    session: { role, userId, learnerId, pinVerifiedAt: role === 'child' ? Date.now() : 0 }
  };
}

function signIn(body, req) {
  bootSecurity();
  const em = String(body.email || '').toLowerCase().trim();
  const password = String(body.password || '');
  const lockId = em || ('ip:' + sec.clientKey(req));
  const locked = sec.checkLock('signin', lockId);
  if (!locked.ok) return locked;
  const ipLock = sec.checkLock('signin', 'ip:' + sec.clientKey(req));
  if (!ipLock.ok) return ipLock;

  let result = null;

  db.mutate(d => {
    const u = findUserByEmail(d, em);
    if (u) {
      if (!sec.verifySecret(password, u.password)) {
        result = { ok: false, error: 'That password does not match this account.' };
        return;
      }
      if (!sec.isHashed(u.password)) u.password = sec.hashSecret(password);
      if (u.status === 'email-pending' || u.status === 'otp-pending') {
        result = { ok: false, resume: 'parent-email', userId: u.id, email: u.email, error: 'This account still needs its email verified.' };
        return;
      }
      if (u.status === 'pending') {
        result = { ok: false, resume: 'school-pending', error: 'This school registration is still waiting for admin approval.' };
        return;
      }
      if (u.status === 'rejected') {
        result = { ok: false, error: 'This school registration was not approved. Contact support to appeal.' };
        return;
      }
      const t = createSession(d, { role: u.role, userId: u.id });
      audit(d, u.email, `Signed in as ${u.role}`, 'auth');
      const session = d.sessions[t];
      result = {
        ok: true, token: t, role: u.role, userId: u.id, learnerId: null,
        state: scopedState(d, session),
        session: { role: u.role, userId: u.id, learnerId: null, pinVerifiedAt: 0 }
      };
      return;
    }
    const l = findLearnerByEmail(d, em);
    if (l) {
      if (!sec.verifySecret(password, l.password)) {
        result = { ok: false, error: 'That password does not match this account.' };
        return;
      }
      if (!sec.isHashed(l.password)) l.password = sec.hashSecret(password);
      if (l.status === 'email-pending') {
        result = { ok: false, resume: 'student-email', learnerId: l.id, email: l.email, error: 'This account still needs its email verified.' };
        return;
      }
      const t = createSession(d, { role: 'child', userId: l.parentId || null, learnerId: l.id });
      audit(d, l.email, 'Student signed in', 'auth');
      const session = d.sessions[t];
      result = {
        ok: true, token: t, role: 'child', userId: l.parentId || null, learnerId: l.id,
        state: scopedState(d, session),
        session: { role: 'child', userId: l.parentId || null, learnerId: l.id, pinVerifiedAt: Date.now() }
      };
      return;
    }
    const ps = (d.pendingSchools || []).find(p => p.email && p.email.toLowerCase() === em);
    if (ps) {
      result = { ok: false, resume: 'school-pending', error: 'This school registration is ' + ps.status + '.' };
      return;
    }
    result = { ok: false, error: 'No account found for that email. Create one instead.' };
  });

  if (!result || !result.ok) {
    // Don't lock for "needs email verify" / school-pending — those are not secret guesses
    if (result && (result.resume === 'parent-email' || result.resume === 'student-email' || result.resume === 'school-pending')) {
      return result;
    }
    sec.recordFailure('signin', lockId);
    sec.recordFailure('signin', 'ip:' + sec.clientKey(req));
    const again = sec.checkLock('signin', lockId);
    if (!again.ok) return again;
    return result;
  }
  sec.recordSuccess('signin', lockId);
  return result;
}

function signInChild(body, req) {
  const loginId = normalizeLoginId(body.loginId);
  const pin = String(body.pin || '');
  if (!validLoginId(loginId)) {
    return { ok: false, error: 'Enter the login ID your parent gave you.' };
  }
  const lockId = loginId;
  const locked = sec.checkLock('child', lockId);
  if (!locked.ok) return locked;
  const ipLock = sec.checkLock('child', 'ip:' + sec.clientKey(req));
  if (!ipLock.ok) return ipLock;

  let result = null;
  db.mutate(d => {
    const l = findLearnerByLoginId(d, loginId);
    if (!l || l.status !== 'active') {
      result = { ok: false, error: 'That login ID or code is not right. Ask a parent for help.' };
      return;
    }
    if (l.needsLoginSetup || !l.loginId) {
      result = { ok: false, error: 'A parent still needs to finish setting up this login. Ask them to open Family → Login details.' };
      return;
    }
    if (!sec.verifySecret(pin, l.pin)) {
      result = { ok: false, error: 'That login ID or code is not right. Ask a parent for help.' };
      return;
    }
    if (!sec.isHashed(l.pin)) l.pin = sec.hashSecret(pin);
    const t = createSession(d, { role: 'child', userId: l.parentId, learnerId: l.id });
    audit(d, l.loginId, 'Learner signed in with login ID + code', 'auth');
    const session = d.sessions[t];
    result = {
      ok: true, token: t, role: 'child', userId: l.parentId, learnerId: l.id,
      learnerName: l.name,
      state: scopedState(d, session),
      session: { role: 'child', userId: l.parentId, learnerId: l.id, pinVerifiedAt: Date.now() }
    };
  });
  if (!result || !result.ok) {
    sec.recordFailure('child', lockId);
    sec.recordFailure('child', 'ip:' + sec.clientKey(req));
    const again = sec.checkLock('child', lockId);
    if (!again.ok) return again;
    return result;
  }
  sec.recordSuccess('child', lockId);
  return result;
}

function verifyPin(body, req) {
  const session = getSession(bearer(req));
  if (!session || (!session.learnerId && session.role !== 'parent')) {
    return { ok: false, error: 'Not signed in.', status: 401 };
  }
  const learnerId = body.learnerId || session.learnerId;
  if (!learnerId) return { ok: false, error: 'Learner required.' };
  if (session.role === 'child' && learnerId !== session.learnerId) {
    return { ok: false, error: 'Not allowed.', status: 403 };
  }
  const pin = String(body.pin || '');
  const lockId = 'pin:' + learnerId;
  const locked = sec.checkLock('child', lockId);
  if (!locked.ok) return locked;

  let ok = false;
  db.mutate(d => {
    const l = d.learners[learnerId];
    if (!l) return;
    if (session.role === 'parent' && l.parentId !== session.userId) return;
    if (!sec.verifySecret(pin, l.pin)) return;
    if (!sec.isHashed(l.pin)) l.pin = sec.hashSecret(pin);
    audit(d, l.name, 'Identity confirmed before an assessment', 'exam');
    ok = true;
  });
  if (!ok) {
    sec.recordFailure('child', lockId);
    const again = sec.checkLock('child', lockId);
    if (!again.ok) return again;
    return { ok: false, error: 'That code is not right.' };
  }
  sec.recordSuccess('child', lockId);
  return { ok: true };
}

/** Prefer keeping existing hashed secrets; hash any plaintext the client sends. */
function mergeSecret(prevVal, incoming) {
  if (incoming == null || incoming === '') return prevVal;
  if (sec.isHashed(incoming)) {
    // Never trust a client-supplied hash string as a new secret
    return prevVal != null ? prevVal : incoming;
  }
  return sec.hashSecret(String(incoming));
}

function logout(reqToken) {
  if (!reqToken) return { ok: true };
  db.mutate(d => { delete (d.sessions || {})[reqToken]; });
  return { ok: true };
}

function getState(reqToken) {
  const session = getSession(reqToken);
  if (!session) return { ok: false, error: 'Not signed in.', status: 401 };
  return {
    ok: true,
    state: scopedState(db.get(), session),
    session: {
      role: session.role,
      userId: session.userId,
      learnerId: session.learnerId,
      pinVerifiedAt: session.role === 'child' ? Date.now() : 0
    }
  };
}

function signupSchool(body) {
  const em = String(body.email || '').trim().toLowerCase();
  const err = db.mutate(d => {
    if (findUserByEmail(d, em) || (d.pendingSchools || []).some(p => p.email && p.email.toLowerCase() === em && p.status === 'pending')) {
      return 'A registration already exists for that email address.';
    }
    const rec = {
      id: uid('ps'),
      schoolName: String(body.schoolName || '').trim(),
      district: String(body.district || '').trim(),
      contactName: String(body.contactName || '').trim(),
      role: String(body.role || '').trim(),
      email: em,
      students: String(body.students || '').trim(),
      password: sec.hashSecret(String(body.password || '')),
      status: 'pending',
      at: today()
    };
    d.pendingSchools = d.pendingSchools || [];
    d.pendingSchools.push(rec);
    audit(d, em, `School registration submitted for ${rec.schoolName} — awaiting admin approval`, 'account');
    return null;
  });
  if (err) return { ok: false, error: err };
  return { ok: true };
}

function requestParentLink(body) {
  db.mutate(d => {
    const rec = {
      id: uid('lr'),
      childName: String(body.childName || '').trim(),
      grade: String(body.grade || ''),
      birthYear: body.birthYear,
      // Kept plaintext only until a parent approves and a learner record is created (then hashed).
      pin: String(body.pin || ''),
      avatar: body.avatar || '🐢',
      parentEmail: String(body.parentEmail || '').trim().toLowerCase(),
      schoolCode: String(body.schoolCode || '').trim(),
      status: 'awaiting parent',
      at: today()
    };
    d.linkRequests = d.linkRequests || [];
    d.linkRequests.push(rec);
    const parentExists = !!findUserByEmail(d, rec.parentEmail);
    audit(d, rec.parentEmail, `Under-13 signup for ${rec.childName} — parental consent requested${parentExists ? '' : ' (no parent account yet)'}`, 'consent');
  });
  const d = db.get();
  const parentExists = !!findUserByEmail(d, body.parentEmail);
  return { ok: true, parentExists };
}

/**
 * Merge a client state snapshot back into the shared DB for the signed-in account.
 * Other families' records are left untouched.
 */
function syncState(reqToken, payload) {
  const session = getSession(reqToken);
  if (!session) return { ok: false, error: 'Not signed in.', status: 401 };
  const incoming = payload && payload.state;
  if (!incoming || typeof incoming !== 'object') {
    return { ok: false, error: 'Missing state payload.' };
  }

  db.mutate(d => {
    if (session.role === 'admin') {
      if (incoming.settings) d.settings = incoming.settings;
      if (incoming.users) {
        Object.entries(incoming.users).forEach(([id, u]) => {
          const prev = d.users[id] || {};
          const { password: _p, emailCode: _e, pin: _pin, ...safe } = u;
          d.users[id] = {
            ...prev,
            ...safe,
            password: mergeSecret(prev.password, u.password),
            emailCode: prev.emailCode,
            codeAt: prev.codeAt,
            codeAttempts: prev.codeAttempts
          };
        });
      }
      if (incoming.learners) {
        Object.entries(incoming.learners).forEach(([id, l]) => {
          const prev = d.learners[id] || {};
          const { password: _p, emailCode: _e, pin: _pin, ...safe } = l;
          d.learners[id] = {
            ...prev,
            ...safe,
            password: mergeSecret(prev.password, l.password),
            pin: (l.pin != null && l.pin !== '') ? mergeSecret(prev.pin, l.pin) : prev.pin,
            emailCode: prev.emailCode,
            codeAt: prev.codeAt,
            codeAttempts: prev.codeAttempts
          };
        });
      }
      if (incoming.schools) Object.assign(d.schools, incoming.schools);
      if (Array.isArray(incoming.rewards)) d.rewards = incoming.rewards;
      if (Array.isArray(incoming.grants)) d.grants = incoming.grants;
      if (Array.isArray(incoming.orders)) d.orders = incoming.orders;
      if (Array.isArray(incoming.pendingSchools)) {
        d.pendingSchools = incoming.pendingSchools.map(p => {
          const prev = (d.pendingSchools || []).find(x => x.id === p.id) || {};
          return { ...prev, ...p, password: mergeSecret(prev.password, p.password) };
        });
      }
      if (Array.isArray(incoming.linkRequests)) d.linkRequests = incoming.linkRequests;
      if (Array.isArray(incoming.audit)) d.audit = incoming.audit.slice(0, 400);
      return;
    }

    if (session.role === 'parent') {
      const uIn = incoming.users && incoming.users[session.userId];
      if (uIn) {
        const prev = d.users[session.userId] || {};
        d.users[session.userId] = {
          ...prev,
          ...uIn,
          id: session.userId,
          role: 'parent',
          password: prev.password,
          email: prev.email,
          status: prev.status === 'active' ? 'active' : (uIn.status || prev.status)
        };
      }
      const allowed = new Set((d.users[session.userId] && d.users[session.userId].children) || []);
      Object.values(incoming.learners || {}).forEach(l => {
        if (!l || !l.id) return;
        const prev = d.learners[l.id];
        if (prev && prev.parentId !== session.userId && !allowed.has(l.id)) return;
        if (!prev && l.parentId && l.parentId !== session.userId) return;
        const { password: _pw, pin: _pin, emailCode: _ec, ...safeL } = l;
        const merged = {
          ...(prev || {}),
          ...safeL,
          parentId: session.userId,
          password: mergeSecret(prev && prev.password, l.password),
          pin: (l.pin != null && l.pin !== '') ? mergeSecret(prev && prev.pin, l.pin) : (prev && prev.pin),
          emailCode: prev && prev.emailCode,
          codeAt: prev && prev.codeAt,
          codeAttempts: prev && prev.codeAttempts
        };
        d.learners[l.id] = merged;
        allowed.add(l.id);
      });
      if (d.users[session.userId]) d.users[session.userId].children = [...allowed];

      // Personal rewards owned by this parent
      const platform = (d.rewards || []).filter(r => r.tier !== 'personal' || r.ownerId !== session.userId);
      const personal = (incoming.rewards || []).filter(r => r.tier === 'personal' && r.ownerId === session.userId);
      d.rewards = platform.concat(personal);

      const otherGrants = (d.grants || []).filter(g => !allowed.has(g.learnerId));
      const myGrants = (incoming.grants || []).filter(g => allowed.has(g.learnerId));
      d.grants = otherGrants.concat(myGrants);

      const otherOrders = (d.orders || []).filter(o => !allowed.has(o.learnerId));
      const myOrders = (incoming.orders || []).filter(o => allowed.has(o.learnerId));
      d.orders = otherOrders.concat(myOrders);

      const myEmail = (d.users[session.userId] && d.users[session.userId].email || '').toLowerCase();
      const otherLinks = (d.linkRequests || []).filter(r => !r.parentEmail || r.parentEmail.toLowerCase() !== myEmail);
      const myLinks = (incoming.linkRequests || []).filter(r => r.parentEmail && r.parentEmail.toLowerCase() === myEmail);
      d.linkRequests = otherLinks.concat(myLinks);

      if (incoming.schools) {
        Object.values(incoming.schools).forEach(s => {
          if (s && s.id && !d.schools[s.id] && s.code && s.name) {
            // parents don't create schools; ignore unknowns except existing lookups
          }
        });
      }
      return;
    }

    if (session.role === 'child') {
      const lid = session.learnerId;
      const lIn = incoming.learners && incoming.learners[lid];
      if (lIn) {
        const prev = d.learners[lid] || {};
        d.learners[lid] = {
          ...prev,
          ...lIn,
          id: lid,
          parentId: prev.parentId,
          password: prev.password,
          pin: prev.pin,
          loginId: prev.loginId,
          email: prev.email,
          status: prev.status,
          emailCode: prev.emailCode,
          codeAt: prev.codeAt,
          codeAttempts: prev.codeAttempts
        };
      }
      const otherGrants = (d.grants || []).filter(g => g.learnerId !== lid);
      const myGrants = (incoming.grants || []).filter(g => g.learnerId === lid);
      d.grants = otherGrants.concat(myGrants);
      const otherOrders = (d.orders || []).filter(o => o.learnerId !== lid);
      const myOrders = (incoming.orders || []).filter(o => o.learnerId === lid);
      d.orders = otherOrders.concat(myOrders);
      return;
    }

    if (session.role === 'school') {
      const u = d.users[session.userId];
      const schoolId = u && u.schoolId;
      Object.values(incoming.learners || {}).forEach(l => {
        if (!l || !l.id) return;
        const prev = d.learners[l.id];
        if (!prev || prev.schoolId !== schoolId) return;
        d.learners[l.id] = {
          ...prev,
          ...l,
          password: prev.password,
          pin: prev.pin,
          emailCode: prev.emailCode,
          codeAt: prev.codeAt,
          codeAttempts: prev.codeAttempts
        };
      });
    }
  });

  return {
    ok: true,
    state: scopedState(db.get(), getSession(reqToken)),
    session: {
      role: session.role,
      userId: session.userId,
      learnerId: session.learnerId,
      pinVerifiedAt: session.role === 'child' ? Date.now() : 0
    }
  };
}

function statusOf(result) {
  if (!result) return 400;
  if (result.ok) return 200;
  return result.status || 400;
}

async function handle(req, res, rel, { readJson, sendJson }) {
  bootSecurity();

  if (rel === '/api/status' && req.method === 'GET') {
    sendJson(res, 200, publicStatus());
    return true;
  }

  if (rel === '/api/auth/signup/parent' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = await signupParent(body, req);
      sendJson(res, statusOf(result), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/auth/signup/student' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = await signupStudent(body);
      sendJson(res, statusOf(result), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/auth/signup/school' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = signupSchool(body);
      sendJson(res, statusOf(result), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/auth/resend' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = await resendCode(body, req);
      sendJson(res, statusOf(result), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/auth/verify' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = verifyCode(body, req);
      sendJson(res, statusOf(result), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/auth/signin' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = signIn(body, req);
      sendJson(res, statusOf(result), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/auth/signin-child' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = signInChild(body, req);
      sendJson(res, statusOf(result), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/auth/verify-pin' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = verifyPin(body, req);
      sendJson(res, statusOf(result), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/auth/logout' && req.method === 'POST') {
    logout(bearer(req));
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (rel === '/api/auth/link-request' && req.method === 'POST') {
    try {
      const body = await readJson(req);
      const result = requestParentLink(body);
      sendJson(res, 200, result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  if (rel === '/api/state' && req.method === 'GET') {
    const result = getState(bearer(req));
    sendJson(res, result.status || 200, result);
    return true;
  }

  if (rel === '/api/state' && req.method === 'PUT') {
    try {
      const body = await readJson(req);
      const result = syncState(bearer(req), body);
      sendJson(res, result.status || (result.ok ? 200 : 400), result);
    } catch (e) {
      sendJson(res, 400, { ok: false, error: e.message || 'Bad request' });
    }
    return true;
  }

  // Legacy email endpoints kept for status checks; send no longer accepts client-supplied codes for delivery UX.
  if (rel === '/api/email/status' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      configured: email.configured(),
      from: email.configured() ? email.fromAddress() : null
    });
    return true;
  }

  if (rel === '/api/email/send' && req.method === 'POST') {
    sendJson(res, 410, {
      ok: false,
      error: 'Direct email-code sending is disabled. Use /api/auth/signup/* and /api/auth/resend.'
    });
    return true;
  }

  return false;
}

bootSecurity();

module.exports = { handle, publicStatus, ensureAdmin, bootSecurity };
