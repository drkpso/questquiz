/* Password / child-code hashing (scrypt) and auth rate limits.
   Zero npm deps — uses Node crypto.scrypt. */
const crypto = require('crypto');
const db = require('./db');

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 32;
const PREFIX = 'scrypt';

/** Format: scrypt$N$r$p$saltHex$hashHex */
function isHashed(value) {
  return typeof value === 'string' && value.startsWith(PREFIX + '$');
}

function hashSecret(plain) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(plain), salt, KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024
  });
  return [
    PREFIX, SCRYPT_N, SCRYPT_R, SCRYPT_P,
    salt.toString('hex'), derived.toString('hex')
  ].join('$');
}

function verifySecret(plain, stored) {
  if (stored == null || stored === '') return false;
  const input = String(plain);
  if (!isHashed(stored)) {
    const a = Buffer.from(input);
    const b = Buffer.from(String(stored));
    if (a.length !== b.length) {
      // timing junk compare
      crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  }
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], 'hex');
  const expected = Buffer.from(parts[5], 'hex');
  if (!salt.length || !expected.length) return false;
  let derived;
  try {
    derived = crypto.scryptSync(input, salt, expected.length, {
      N, r, p, maxmem: 64 * 1024 * 1024
    });
  } catch (_) {
    return false;
  }
  return crypto.timingSafeEqual(derived, expected);
}

/** If stored is plaintext, hash it. Returns { value, upgraded }. */
function migrateIfPlain(stored) {
  if (stored == null || stored === '') return { value: stored, upgraded: false };
  if (isHashed(stored)) return { value: stored, upgraded: false };
  return { value: hashSecret(stored), upgraded: true };
}

/** Hash every plaintext password/pin still sitting in the DB (one-shot upgrade). */
function migrateAllPlaintextInPlace() {
  let count = 0;
  db.mutate(d => {
    Object.values(d.users || {}).forEach(u => {
      if (u.password && !isHashed(u.password)) {
        u.password = hashSecret(u.password);
        count++;
      }
    });
    Object.values(d.learners || {}).forEach(l => {
      if (l.password && !isHashed(l.password)) {
        l.password = hashSecret(l.password);
        count++;
      }
      if (l.pin != null && l.pin !== '' && !isHashed(l.pin)) {
        l.pin = hashSecret(String(l.pin));
        count++;
      }
    });
    (d.pendingSchools || []).forEach(p => {
      if (p.password && !isHashed(p.password)) {
        p.password = hashSecret(p.password);
        count++;
      }
    });
  });
  return count;
}

/* ---------------- rate limits / lockouts ---------------- */

const LIMITS = {
  signin: { maxFails: 5, lockMs: 15 * 60 * 1000, windowMs: 15 * 60 * 1000 },
  child: { maxFails: 5, lockMs: 15 * 60 * 1000, windowMs: 15 * 60 * 1000 },
  verify: { maxFails: 5, lockMs: 15 * 60 * 1000, windowMs: 30 * 60 * 1000 },
  resend: { maxFails: 5, lockMs: 60 * 60 * 1000, windowMs: 60 * 60 * 1000, minIntervalMs: 60 * 1000 }
};

function now() { return Date.now(); }

function ensureBucket() {
  const d = db.get();
  if (!d.rateLimit) {
    db.mutate(x => { x.rateLimit = x.rateLimit || {}; });
  }
}

function clientKey(req) {
  const xf = (req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'] || '').split(',')[0].trim();
  const ip = xf || (req.socket && req.socket.remoteAddress) || 'unknown';
  return ip;
}

function bucketKey(kind, id) {
  return kind + ':' + String(id || '').toLowerCase();
}

function readEntry(key) {
  ensureBucket();
  return (db.get().rateLimit || {})[key] || null;
}

function writeEntry(key, entry) {
  db.mutate(d => {
    d.rateLimit = d.rateLimit || {};
    d.rateLimit[key] = entry;
    // prune old entries occasionally
    const keys = Object.keys(d.rateLimit);
    if (keys.length > 2000) {
      const cutoff = now() - 24 * 60 * 60 * 1000;
      keys.forEach(k => {
        const e = d.rateLimit[k];
        if (!e || ((e.lockedUntil || 0) < now() && (e.windowStart || 0) < cutoff)) {
          delete d.rateLimit[k];
        }
      });
    }
  });
}

function checkLock(kind, id) {
  const cfg = LIMITS[kind] || LIMITS.signin;
  const key = bucketKey(kind, id);
  const entry = readEntry(key);
  if (!entry) return { ok: true };
  if (entry.lockedUntil && entry.lockedUntil > now()) {
    const mins = Math.max(1, Math.ceil((entry.lockedUntil - now()) / 60000));
    return {
      ok: false,
      status: 429,
      error: 'Too many attempts. Try again in about ' + mins + ' minute' + (mins === 1 ? '' : 's') + '.'
    };
  }
  if (kind === 'resend' && entry.lastAt && cfg.minIntervalMs && (now() - entry.lastAt) < cfg.minIntervalMs) {
    const secs = Math.ceil((cfg.minIntervalMs - (now() - entry.lastAt)) / 1000);
    return {
      ok: false,
      status: 429,
      error: 'Please wait ' + secs + ' seconds before requesting another code.'
    };
  }
  return { ok: true };
}

function recordFailure(kind, id) {
  const cfg = LIMITS[kind] || LIMITS.signin;
  const key = bucketKey(kind, id);
  const entry = readEntry(key) || { fails: 0, windowStart: now() };
  if (!entry.windowStart || (now() - entry.windowStart) > cfg.windowMs) {
    entry.fails = 0;
    entry.windowStart = now();
  }
  entry.fails = (entry.fails || 0) + 1;
  entry.lastFailAt = now();
  if (entry.fails >= cfg.maxFails) {
    entry.lockedUntil = now() + cfg.lockMs;
    entry.fails = 0;
    entry.windowStart = now();
  }
  writeEntry(key, entry);
  return entry;
}

function recordSuccess(kind, id) {
  const key = bucketKey(kind, id);
  const entry = readEntry(key) || {};
  entry.fails = 0;
  entry.lockedUntil = 0;
  entry.windowStart = now();
  entry.lastAt = now();
  writeEntry(key, entry);
}

function recordResendOk(id) {
  const key = bucketKey('resend', id);
  const entry = readEntry(key) || { fails: 0, windowStart: now() };
  entry.lastAt = now();
  entry.fails = (entry.fails || 0) + 1;
  const cfg = LIMITS.resend;
  if (entry.fails >= cfg.maxFails) {
    entry.lockedUntil = now() + cfg.lockMs;
    entry.fails = 0;
  }
  writeEntry(key, entry);
}

module.exports = {
  isHashed,
  hashSecret,
  verifySecret,
  migrateIfPlain,
  migrateAllPlaintextInPlace,
  checkLock,
  recordFailure,
  recordSuccess,
  recordResendOk,
  clientKey,
  LIMITS
};
