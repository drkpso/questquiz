# Production checklist

What stands between this build and real users. Most of it is vendor contracts and
review, not code.

---

## Blockers

### 1. Backend and accounts (shipped — harden next)

Accounts are **server-backed** via `/api/auth/*` and `/api/state` with a JSON file
DB under `DATA_DIR` (mount a Railway Volume at `/data`). Sessions are bearer
tokens; clients receive a scoped snapshot (not other families’ private data).

Still recommended before high traffic:

- a real database (Postgres) instead of a single JSON file under write lock
- ~~password hashing~~ / ~~rate limits~~ — shipped (scrypt + lockouts)

Mount a Volume and set `ADMIN_EMAIL` / `ADMIN_PASSWORD` so school approvals work
across redeploys.

### 2. Email delivery (required for signup)

Parents and students 13+ verify by **email only** — six digits, expiry, attempt
limits, resend. Codes are generated on the server and sent via Resend; they are
**never returned to the browser** when `RESEND_API_KEY` is set. Without the key,
signup endpoints that need email fail closed (no on-screen code fallback).

Set `RESEND_API_KEY` and `EMAIL_FROM` in Railway Variables. See `.env.example`.

### 3. Verifiable parental consent (COPPA)

Required before enrolling a single under-13 in the United States. The flow, the
request queue, the versioned consent record and the audit ledger are all built —
but a checkbox is not *verifiable* consent under the rule. You need a certified
provider (PRIVO, KidsLoop or similar) doing a card authorisation, ID check or
signed form, hooked into `approveLink()`.

Note this is a real legal exposure, not a formality: COPPA penalties are assessed
per child per violation.

### 4. Payments and fulfilment

Badge print orders record but cannot charge. Needs a processor (Stripe) plus
sales-tax handling for every state you ship to, and a print-on-demand API
(Printful, Gooten). Order statuses in the admin console are manual placeholders.

### 5. Content review

**Nothing in this repo has been reviewed by a teacher.** The test suite verifies
*form*, not pedagogy — a question can be perfectly well-formed and still be wrong
for the grade, or misaligned with a state standard.

Minimum viable review:

- one sample assessment per grade band, reviewed by a teacher of that band
- one AP course per discipline group, reviewed by someone who has taught it

This is the cheapest high-value step on the list, and it shapes everything else.

### 6. AP unit gaps

18 of 153 units have no questions. The product handles this honestly — those units
are marked "no items yet" and excluded from unit practice — but the gaps are real.
Admin → Content bank → *AP unit coverage* is the backlog.

### 7. AP free-response

Practice is multiple-choice only. The projected 1–5 score is labelled directional
for exactly this reason: real composite cut points vary by subject and year, and
no FRQ section is simulated. Either build rubric-scored free response, or keep the
caveat prominent. Do not quietly drop it.

### 8. Legal

- Privacy policy and terms of use
- COPPA direct notice
- A data-sharing agreement template — many districts require a signed DPA before
  a single student logs in
- Confirm AP nominative-use wording with counsel. Using "AP" for test prep is
  common practice, but worth a read before you spend on marketing.

### 9. Accessibility

A WCAG 2.1 AA audit. Most US districts require it in procurement, so this gates
the school channel regardless of how good the product is. Keyboard navigation and
focus states are already in place; colour contrast and screen-reader labelling
need a real audit.

---

## Suggested order

1. **Content review on a sample.** It shapes everything downstream, and it is the
   cheapest thing on this list.
2. **Backend, auth and real OTP/email delivery.** Until this exists, nothing a
   user does survives a change of device, which caps any pilot.
3. **Legal pack and the consent provider.** These gate school conversations; start
   them early because they take calendar time rather than effort.
4. **Accessibility audit.** Before the first district pitch.
5. **Payments and fulfilment.** Only needed once prints actually sell.

---

## If you ever add advertising

The current build has none, and the no-advertising position is stated on the
homepage and in the parent Consent & data screen. If that changes:

- both of those pages have to change with it, or the product contradicts itself
  in writing
- behavioural advertising to under-13s pulls COPPA back in where you had otherwise
  escaped it
- districts will generally not adopt an ad-supported student product, which closes
  the school channel

The reward catalogue is the sponsorship surface instead. Partners fund rewards and
receive a first name and a level only, at redemption, and only where that optional
consent is on.
