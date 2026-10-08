# Adding and editing questions

This is the file you will touch most often. Adding content is deliberately
boring — one line per fact.

After **any** content change: `npm run test:content`

---

## Adding facts to an existing bank

Find the bank in `src/content.js` (core subjects) or `src/subjects.js`
(computer science, history & civics, creative & arts) and append to the string.
Items are separated by `|`, and each is `prompt=answer`:

```js
B('gk.e35.capital', 'What is the capital city of {a}?', 'Which country has the capital {b}?',
  'The capital of {a} is {b}.',
  'France=Paris|Japan=Tokyo|India=New Delhi|Kenya=Nairobi');
                                            // ↑ add here
```

The three templates are the forward question, the reversed question, and a
statement used for the pick-the-true-statement form. `{a}` is the prompt side,
`{b}` the answer side, `{b_l}` lowercases the first letter of `{b}`.

**The statement template must mention `{a}`.** If it only mentions `{b}`, every
distractor renders identically and the question collapses to one option. The
engine guards against shipping that, but the question quietly loses a form.

---

## Adding a whole bank

```js
B('sci.e35.magnets',                                  // subject.band.topic
  'In magnetism, what is {a}?',                       // forward
  'Which of these best describes {b_l}?',             // reversed
  '{b} is {a}.',                                      // statement
  'the end of a magnet that points north=the north pole|' +
  'the invisible region where a magnet acts=a magnetic field|' +
  'what happens when two north poles meet=they repel');
```

The id is parsed, not decorative:

| segment | must be | why |
|---|---|---|
| subject | `m` `ela` `sci` `lang` `gk` `cs` `hist` `art` | maps the bank to a subject |
| band | `k2` `e35` `m68` `h912` | keeps grade-9 content out of grade-2 papers |
| topic | anything | your label |

A bank needs **at least 4 distinct answers** to produce four options. With fewer,
the engine switches that bank to its statement form so the learner never gets a
coin flip. Aim for 10–20 items.

---

## Adding a generated family

For anything computational, where you want effectively unlimited variants:

```js
F('m.e35.rounding', 'Mathematics', 'e35', (r, difficulty, form) => {
  const n = _int(r, 120, 9800);
  const to10 = Math.round(n / 10) * 10;
  if (form === 1) return { prompt: `Round ${n} to the nearest hundred.`, ... };
  if (form === 2) return { prompt: `A stadium holds ${n} people...`, ... };
  return { prompt: `Round ${n} to the nearest ten.`,
           ...mcqNum(r, to10, 30, 'int'),
           explain: `${n} is closest to ${to10}.` };
});
```

Rules:

- **Use `r()` for all randomness, never `Math.random()`.** The seed is what makes
  an assessment reproducible, and reproducibility is what makes error repetition
  work. A stray `Math.random()` breaks both.
- Implement all three forms. Form 0 direct, form 1 inverse, form 2 a word problem.
- Return `{ prompt, options, answer, explain }`. `answer` must be present in
  `options` and all options must be distinct — `mcqNum()` handles that for numbers.
- `difficulty` runs 0 to 1 across the ten levels of the band. Use it to widen
  number ranges.

---

## Adding an AP unit's questions

AP banks take a third segment: the unit number.

```js
AB('ap.psych.concept', 'In AP Psychology, what is {a}?',
   'Which of these best describes {b_l}?', '{b} is {a}.',
   'the tendency to see an outcome as predictable afterwards=hindsight bias=1|' +
   'the structure central to forming new memories=the hippocampus=2');
                                                                 // ↑ unit
```

Then make sure the bank is listed on the course in `AP_COURSES`:

```js
{ id: 'psych', name: 'AP Psychology', banks: ['ap.psych.concept'], fams: [], units: [...] }
```

**18 of 153 units currently have no questions.** Sign in as admin → **Content
bank** → *AP unit coverage* for the exact list; it is the authoring backlog.
Until a unit has items it is shown to students as "no items yet" and excluded
from unit practice, which is correct behaviour, not a bug to work around.

---

## Changing the subject mix

`C.MIX_BY_BAND` at the bottom of `src/subjects.js`. Each band's weights must sum
to 50.

```js
k2: [['Mathematics', 13], ['English Language Arts', 11], ...]
```

**Only list a subject for a band that actually has banks for it.** Listing one
without content leaves those slots empty; the engine backfills to keep the count
at 50, but the mix you intended is not what gets delivered. `test/content.test.js`
checks that every subject in a band's mix is reachable.

---

## Changing grade bands or level counts

- Bands: `C.BANDS` and `C.GRADE_TO_BAND` in `src/content.js`
- Levels per band, assessments per level, questions per assessment:
  the constants at the top of the assessment section in `src/engine.js`
- Pass mark and assessments-needed-to-clear are runtime settings, editable in the
  admin console — no code change needed

---

## What the test actually checks

`npm run test:content` will fail if a question has an unfilled `{placeholder}`,
is missing its correct answer, has duplicate or fewer than three options, contains
`NaN`, comes from the wrong grade band, or if an assessment is not exactly 50
questions. It also verifies that a re-ask never repeats the previous wording and
that the same assessment always generates the same questions.

It does **not** check whether a question is factually correct, age-appropriate, or
aligned to a standard. Only a human can do that.
