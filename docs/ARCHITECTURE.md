# Architecture

How the code is put together, and where to change things.

---

## The shape of it

Six source files, loaded in order, each attaching one namespace to `window`.
There are no modules, no imports and no build step beyond concatenation — which
means you can open `public/index.html` in a browser from disk and it works.

```
content.js   →  window.QQ_CONTENT   banks, families, bands, subject mix
subjects.js  →  (appends to QQ_CONTENT)
engine.js    →  window.QQ_ENGINE    generation, repetition, scoring, badges
ap.js        →  window.QQ_AP        AP courses + (appends to QQ_CONTENT)
store.js     →  window.QQ_STORE     accounts, consent, progress, rewards
app.js       →  (renders into #app) the entire interface
```

The order is load-bearing. `engine.js` deliberately looks up question families
*lazily* so that `ap.js`, which loads after it, can still register new ones —
getting this wrong once caused a silent bug where AP maths questions were
replaced by kindergarten animal questions.

---

## How a question is made

Nothing is stored as a finished question. There are two generators.

**Fact banks** (`content.js`, `subjects.js`, `ap.js`) are tables of paired facts
with three sentence templates:

```js
B('sci.m68.symbol',
  'What is the chemical symbol for {a}?',    // q  — forward
  'Which element has the symbol {b}?',       // rv — reversed
  'The symbol for {a} is {b}.',              // tf — statement
  'oxygen=O|sodium=Na|iron=Fe|...');
```

One fact therefore yields three visibly different questions:

| form | looks like | options are |
|---|---|---|
| 0 | What is the chemical symbol for sodium? | symbols |
| 1 | Which element has the symbol Na? | element names |
| 2 | Which statement is correct? | four statements, one true |

That is the whole trick behind error repetition: a re-ask is the *same question*
in a different form, so the learner has to know the fact rather than remember
which option they clicked.

**Generated families** are parameterised functions for computational work:

```js
F('m.m68.eq', 'Mathematics', 'm68', (r, difficulty, form) => { ... });
```

`r` is a seeded random function, so output is deterministic. Each family also
implements three forms: direct, inverse, and word problem.

**Seeding.** Every question comes from `hash(band | level | assessment | index)`.
Assessment 7 of level 3 is always the same 50 questions, on any device, forever.
This is what makes error repetition possible — a re-ask has to be able to
regenerate the exact question that was missed.

---

## Error repetition

Implemented in `engine.js`: `answer()`, `regenerate()`, `nextForm()`.

1. Miss a question → it is re-inserted **8 questions later**, in another form.
2. Miss it again → returns once more **14 questions on**, in a third form.
3. Still unresolved at the end → joins the learner's `recoveryQueue`.
4. Up to **5 carry-over questions open the next assessment**, in a form they have
   not just seen.
5. **Only first-attempt answers count toward the score.** Recovered questions earn
   reduced XP and clear the queue entry.

`regenerate()` rebuilds from the question's `src`/`srcType`/`seed`, not from its
subject name. That matters: AP questions carry a course code rather than one of
the eight subject names, and the earlier subject-based lookup meant error
repetition silently never fired on any AP set.

---

## The subject mix

`C.MIX_BY_BAND` in `subjects.js` holds a 50-question weighting per band. Younger
bands lean on the core three; the wider subject spread arrives from grade 6.

**Every subject listed in a band's mix must have banks for that band.** If it does
not, those slots generate nothing and the assessment comes up short — this is
exactly how K–2 and 3–5 assessments silently became 34 questions long. `engine.js`
now also backfills to guarantee 50, and `test/content.test.js` asserts it.

---

## AP

`ap.js` defines 20 courses with their real College Board unit structure and exam
weightings. Every bank item carries a unit number as a third segment:

```js
AB('ap.psych.concept', q, rv, tf,
   'the discomfort of holding contradictory beliefs=cognitive dissonance=8');
                                                                       // ↑ unit
```

That tagging is what lets the course page say *which unit* a student is losing
marks in, rather than just showing a score.

`E.apUnitItemCount(course, unit)` reports how many items exist for a unit.
`buildApSet()` returns a `coverage` object saying whether the set is genuinely
unit-scoped. The interface uses both so that a unit with no content is marked
"no items yet" rather than quietly serving other units — otherwise answers would
be filed against the wrong unit and the mastery picture would lie.

---

## State and storage

`store.js` owns everything persistent. It is a single JSON object in
`localStorage` under `questquiz.v2`, wrapped in try/catch so a private window or
blocked storage degrades to memory-only rather than crashing.

```
users      admin / school / parent accounts
learners   student profiles, progress, badges, AP enrolment, consent record
schools    approved schools and their class codes
pendingSchools   registrations awaiting admin approval
linkRequests     under-13 signups awaiting a parent
rewards / grants / orders / audit
```

Replacing this with a real backend means reimplementing the functions exported at
the bottom of `store.js` against an API. The interface only talks to the store
through those functions, so nothing in `app.js` needs to change.

---

## The interface

`app.js` is one file with a `render()` that rebuilds `#app` from state, plus an
`ACTIONS` map keyed by `data-act` attributes, dispatched by three delegated
listeners (click, submit, change).

To add a screen: write a function returning an HTML string, add it to the role's
map inside `body()`, and add a nav entry in `navsFor()`.

To add a button: give it `data-act="something"` and add `something` to `ACTIONS`.

The one exception to full re-render is the landing-page taster, which repaints
only its own card — a full render would scroll the visitor back to the top of a
long marketing page every time they answered a question.

---

## Styling

`styles.css` is one file of CSS custom properties. Colour is declared three times
by design:

```css
:root            { --ink: #15223c; }                       /* light */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --ink: #e8eeff; }      /* system dark */
}
:root[data-theme="dark"]          { --ink: #e8eeff; }      /* explicit toggle */
```

All three are required. A colour defined only inside the media query is invisible
to the explicit toggle, and vice versa — which is how the landing page once ended
up ignoring the Theme button entirely while the rest of the app obeyed it.

The public homepage has its own token set prefixed `--f-` scoped to `.future-home`,
redefined in the same three places.

---

## Testing

`test/content.test.js` is the one to run constantly. It generates about 22,000
questions across every band, AP course and quiz, and checks each for unfilled
templates, missing correct answers, duplicate options, wrong-band leakage and
`NaN`. It also exercises error repetition over 10,000 consecutive question pairs
and asserts determinism.

It runs in about ten seconds and needs no browser. Every bug described in this
document was caught by adding an assertion to it.
