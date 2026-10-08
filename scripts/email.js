/* Transactional email via Resend (https://resend.com).
   Zero npm deps — uses Node https. Without RESEND_API_KEY, callers get demo:true. */
const https = require('https');

function configured() {
  return Boolean(process.env.RESEND_API_KEY && String(process.env.RESEND_API_KEY).trim());
}

function fromAddress() {
  return process.env.EMAIL_FROM || 'QuestQuiz <onboarding@resend.dev>';
}

function sendViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const body = JSON.stringify({
    from: fromAddress(),
    to: [to],
    subject,
    html,
    text: text || undefined
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(raw || '{}'); } catch (_) { parsed = { raw }; }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, id: parsed.id || null });
        } else {
          reject(new Error((parsed && (parsed.message || parsed.error)) || ('Resend HTTP ' + res.statusCode)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function verificationEmail({ email, code, purpose }) {
  const why = purpose === 'parent'
    ? 'confirm your parent account'
    : purpose === 'school'
      ? 'confirm your school contact email'
      : 'confirm your student account';
  const subject = 'Your QuestQuiz verification code';
  const text = `Your QuestQuiz code is ${code}. It expires in 30 minutes. Enter it to ${why}.`;
  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0d1524">
    <p>Your QuestQuiz verification code is:</p>
    <p style="font-size:28px;letter-spacing:0.35em;font-weight:700;font-family:ui-monospace,monospace">${code}</p>
    <p>Enter it in the app to ${why}. The code expires in 30 minutes.</p>
    <p style="color:#667085;font-size:13px">If you did not request this, you can ignore this email.</p>
  </div>`;
  return { to: email, subject, html, text };
}

/** Send a verification code. Returns { ok, demo?, id?, error? }. */
async function sendVerificationCode({ email, code, purpose }) {
  const to = String(email || '').trim().toLowerCase();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: 'A valid email address is required.' };
  }
  if (!/^\d{6}$/.test(String(code || ''))) {
    return { ok: false, error: 'A six-digit code is required.' };
  }
  if (!configured()) {
    return { ok: true, demo: true };
  }
  try {
    const result = await sendViaResend(verificationEmail({ email: to, code: String(code), purpose: purpose || 'account' }));
    return { ok: true, demo: false, id: result.id };
  } catch (e) {
    return { ok: false, error: e.message || 'Email provider failed.' };
  }
}

module.exports = { configured, sendVerificationCode, fromAddress };
