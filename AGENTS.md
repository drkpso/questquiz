# QuestQuiz

A K–12 assessment platform. Plain HTML, CSS and vanilla JavaScript — no
framework, no bundler, no transpiler. `scripts/build.js` concatenates `src/`
into `public/`. Keep it that way unless the user explicitly asks otherwise.

## Before you finish any change

Run `npm run test:content`. It takes about ten seconds, needs no browser, and
generates ~22,000 questions to check them. Every historical bug in this codebase
was caught by it. If you touched the interface, also run `npm test`.

Never report work as done without running it.

## Invariants — breaking any of these is a bug, not a trade-off

1. **Load order.** `content.js` → `subjects.js` → `engine.js` → `ap.js` →
   `store.js` → `app.js`. `content.js` creates the bank registry; `subjects.js`
   and `ap.js` append to it; `engine.js` must look families up *lazily* because
   `ap.js` loads after it. Adding a source file means adding it to the `JS` array
   in `scripts/build.js`.

2. **Determinism.** Question generation is seeded from
   `hash(band|level|assessment|index)`. Inside any generator use the supplied `r()`
   — never `Math.random()`, never `Date.now()`. Reproducibility is what makes
   error repetition possible.

3. **An assessment is exactly 50 questions.** If you add a subject to
   `C.MIX_BY_BAND`, that subject must have banks for that band, or its slots
   generate nothing. The engine backfills, but the intended mix is lost.

4. **Three forms per question.** Every bank needs forward, reversed and statement
   templates; every family needs forms 0, 1 and 2. A re-ask is the same question
   in a different form — that is the core mechanic. The statement template must
   reference `{a}`, or all distractors render identically.

5. **Theme tokens are declared three times.** `:root`, then
   `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, then
   `:root[data-theme="dark"]`. A colour defined in only one of these is invisible
   in the other states. Never hardcode a hex outside those blocks.

6. **No horizontal scroll at 320px.** Absolutely positioned decorative elements
   must be centred and size-capped, or clipped by a parent.

7. **AP units.** A unit with no tagged questions must never be offered as
   practisable. `E.apUnitItemCount()` reports coverage; `buildApSet()` returns
   `coverage.complete`. 18 of 153 units are currently empty and are correctly
   marked "no items yet" — that is intended behaviour, not something to patch
   around by widening silently.

## Things that are deliberate, not oversights

- Accounts live in `localStorage`. This is a known limitation documented in
  `docs/PRODUCTION.md`, not a bug to fix casually — replacing it means
  reimplementing the exported functions in `src/store.js` against an API.
- OTP and email codes are shown on screen rather than sent. Same reason.
- The AP projected score is labelled "directional" because practice is
  multiple-choice only and no free-response section is simulated. Do not remove
  that caveat or present the number as a prediction.
- There is no advertising anywhere, and the homepage says so. If asked to add
  ads, flag that it contradicts the privacy copy in the parent Consent & data
  screen and closes the school channel.

## Honesty rules for this product

It is used by children and reviewed by schools. Do not write copy that claims
capability the build does not have. In particular: do not describe stored
progress as syncing across devices, do not present the AP projection as a
predicted score, and do not mark a feature "complete" when its third-party
dependency is unconnected.

## Where things are

- Questions and subjects: `src/content.js`, `src/subjects.js`, `src/ap.js` —
  see `docs/CONTENT.md` for the authoring format
- Generation, repetition, scoring, badges: `src/engine.js`
- Accounts, consent, rewards, progress: `src/store.js`
- Every screen: `src/app.js` — one `render()`, one `ACTIONS` map keyed by
  `data-act` attributes
- Full explanation: `docs/ARCHITECTURE.md`
