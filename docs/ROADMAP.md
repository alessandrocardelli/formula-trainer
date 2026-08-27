# Formula Trainer roadmap

_Last updated: 2026-08-27_

## Product direction

Formula Trainer is a mobile-first, local-first PWA for learning mathematical and electronics formulas through active recall, explanatory feedback and spaced repetition.

The intended long-term workflow is:

1. Save a formula once, together with its meaning and variable metadata.
2. Reuse the same symbolic formula to generate multiple exercise types.
3. Track performance separately for each formula and exercise type.
4. Let FSRS decide what is due instead of reviewing formulas in a fixed order.
5. Use errors as teaching moments by showing variable definitions and formula explanations.
6. Keep the core application usable offline and without a paid API or mandatory account.

The main navigation should remain focused on primary actions. Secondary actions and preferences belong in the app menu/settings rather than adding many permanent bottom tabs.

---

## Current baseline

The app currently supports:

- local IndexedDB formula storage;
- mobile-first `Practice / Library / Add` navigation;
- MathLive formula entry with manually opened mobile keyboard;
- symbolic parsing through CortexJS Compute Engine;
- variable detection and editable name/unit/definition metadata;
- optional formula-level explanation;
- editing and deleting saved formulas;
- Full recall practice;
- Missing term practice with shuffled gaps;
- rich explanatory feedback after correct, incorrect and revealed answers;
- persistent practice history;
- FSRS scheduling separately for each `formula + practice mode` card;
- due-first review queue;
- JSON backup/export and validated non-destructive import;
- practice-history backup and restore;
- app update prompt for new PWA versions;
- app menu/settings entry point;
- reset of learning history and FSRS state without deleting formulas;
- compact electronics-focused MathLive keyboard with a general alphabetic fallback and an advanced layer.

---

## Recommended next-session priorities

### Priority 1 — Test and refine the electronics keyboard

- [x] Replace the default general-purpose MathLive keyboard with an electronics-focused profile.
- [x] Keep a full alphabetic layout available so arbitrary formula symbols remain possible.
- [x] Keep less-common AC/calculus symbols in a separate Advanced layout.
- [x] Reduce virtual-keyboard height on mobile.
- [ ] Test the new layout on the target Android phone in Add, Full recall and Missing term.
- [ ] Adjust key order, key size and direct-access variables based on real use rather than assumptions.
- [ ] Consider different keyboard profiles per exercise type:
  - formula-entry/full-recall keyboard;
  - missing-term/variable keyboard;
  - numeric-only keyboard for future numerical exercises.
- [ ] Consider a Settings preference to restore the standard MathLive keyboard for non-electronics use.

### Priority 2 — Dedicated Statistics view

Add a proper Statistics screen once enough test history exists.

Initial statistics should include:

- [ ] total checks, correct checks, incorrect checks and revealed answers;
- [ ] overall accuracy;
- [ ] accuracy split by practice mode;
- [ ] attempts and accuracy per formula;
- [ ] average response time overall and per mode;
- [ ] due-now review count;
- [ ] formulas currently weakest by recent performance;
- [ ] formulas with the most lapses;
- [ ] FSRS stability/difficulty information translated into understandable labels rather than raw numbers only;
- [ ] activity over time, preferably with a compact mobile-friendly trend visualization;
- [ ] meaningful empty states when there is not enough data yet.

Later statistics may include review streaks, time spent, retention estimates and category-level performance, but only if they are genuinely useful for learning rather than decorative metrics.

### Priority 3 — Library usability at larger scale

The current Library works with a small number of formulas but needs to scale to tens or hundreds.

- [ ] Search by formula name, variable, category and possibly explanation text.
- [ ] Category filter.
- [ ] Sort by name, recently edited, weakest, or next due.
- [ ] Keep formula cards compact by default.
- [ ] Consider category management only after categories become numerous enough to justify it.

### Priority 4 — Selective learning-data reset

The current reset intentionally clears all learning history while preserving formulas.

- [x] Global reset of practice history/statistics/FSRS without deleting formulas.
- [ ] Reset one formula only.
- [ ] Reset one practice mode only.
- [ ] Reset one `formula + practice mode` card only.
- [ ] Show exactly what will be deleted before confirmation.

---

## Phase 0 — Foundation and mobile UX

- [x] Repository and MIT license.
- [x] React + TypeScript + Vite scaffold.
- [x] PWA foundation and GitHub Pages deployment.
- [x] Local IndexedDB storage.
- [x] Basic formula library.
- [x] Mobile-first Practice / Library / Add navigation.
- [x] Explicit mobile math-keyboard control so scrolling does not constantly reopen the keyboard.
- [x] PWA update prompt rather than silently leaving an already-open tab on an old bundle.
- [x] App menu/settings entry point for secondary actions and preferences.
- [x] Electronics-focused MathLive keyboard profile.
- [ ] Verify actual PWA installability and standalone behavior on Android.
- [ ] Review safe-area behavior, keyboard overlap and viewport scrolling on multiple mobile screen sizes.
- [ ] Accessibility pass for focus states, labels, dialog semantics and screen-reader announcements.

---

## Phase 1 — Formula model and library

### Completed

- [x] Parse LaTeX into a symbolic expression.
- [x] Validate equations before saving.
- [x] Detect variables and exclude known constants.
- [x] Normalize the currently supported simple Leibniz differential form such as `dq/dt` to learning variables `q` and `t`.
- [x] Store editable variable name and unit metadata.
- [x] Store optional per-variable definitions/descriptions.
- [x] Store optional formula-level explanation/meaning.
- [x] Edit variable metadata during the Add formula flow before saving.
- [x] Edit existing formulas.

### Future

- [ ] Search/filter the formula library.
- [ ] Formula aliases and alternate conventional names if needed.
- [ ] Optional tags beyond category if real usage demonstrates a need.
- [ ] Optional variable dimensions for future unit/dimensional checking.
- [ ] Optional numeric generation metadata per variable:
  - minimum/maximum values;
  - preferred magnitude ranges;
  - integer/decimal constraints;
  - positive-only constraints;
  - preferred engineering prefixes;
  - preferred E-series values for component variables.
- [ ] Expand differential parsing beyond the current narrow first-order ASCII case only after representative formulas/tests are collected.
- [ ] Support composite/subscripted derivative variables robustly, e.g. `dV_C/dt`.
- [ ] Investigate partial derivatives and higher derivatives only if they become relevant to the actual learning scope.

### Metadata policy

Variable definitions and formula explanations are treated as user-authoritative learning content. Safe local defaults may suggest common names/units, but the app should not silently invent conceptual definitions.

A future AI-assisted `Suggest definitions/explanation` feature is possible, but generated text must remain a proposal that the user reviews before saving. It must not become a requirement for the local/offline core.

---

## Phase 2 — Active practice

### Completed

- [x] Full recall exercise.
- [x] Limited symbolic comparison for Full recall.
- [x] Accept swapped equation sides in Full recall.
- [x] Missing-term exercise.
- [x] Randomized/shuffled missing-term challenge order.
- [x] Rich explanatory feedback using stored formula and variable metadata.
- [x] Different feedback density for correct versus incorrect/revealed answers.

### Full recall — current policy

Full recall checks the saved equation side-by-side and accepts equivalent expressions on each side plus swapped equation sides. It deliberately does **not** accept a formula rearranged to solve for another variable; that belongs to a separate exercise mode.

Example policy for saved `V = IR`:

- `IR = V` → should be accepted;
- `V = RI` → should be accepted if the symbolic engine verifies the side expression as equivalent;
- `R = V/I` → intentionally not accepted by Full recall even though it represents the same physical relationship.

### Missing term — current policy

The current generator hides a suitable variable appearing once on the right-hand side. Available gaps are shuffled so the same variable is not always asked first.

Future work:

- [ ] Generate useful gaps from symbolic MathJSON subexpressions rather than only single variables.
- [ ] Avoid pedagogically poor gaps such as hiding arbitrary punctuation or an unhelpful half-expression.
- [ ] Define rules for constants such as `π` and whether/when they should be trainable gaps.
- [ ] Extend gap handling for composite symbols and derivatives.

### New exercise types

- [ ] **General symbolic answer equivalence**
  - Define exactly which transformations should count as equivalent in each mode.
  - Add regression tests before broadening acceptance.
  - Avoid making Full recall accidentally accept Solve-for-variable answers.

- [ ] **Solve-for-variable / rearrangement**
  - Prompt with a saved formula and target variable.
  - Require the user to isolate that variable.
  - Verify equivalence symbolically.
  - Confirm Compute Engine solving/isolation APIs empirically before relying on them.

- [ ] **Numerical exercise generator**
  - Generate values from formula metadata.
  - Solve for a selected variable.
  - Support engineering notation and prefixes.
  - Avoid unrealistic values.
  - Record numerical performance separately from symbolic modes.

- [ ] **Unit-aware answer checking**
  - Accept equivalent scale prefixes where appropriate.
  - Distinguish numerical error from unit error.
  - Consider dimensional validation.

- [ ] **Variable/concept recall**
  - Ask what a symbol represents.
  - Ask for its unit.
  - Reuse the definitions already stored with formulas.

- [ ] **Formula-selection problems**
  - Give a short problem statement and ask which formula applies.
  - Later combine this with numerical solving.

---

## Phase 3 — Learning engine

### Completed

- [x] Persistent performance history per formula and exercise type.
- [x] Raw practice events rather than only aggregate counters.
- [x] Response time stored with attempts.
- [x] FSRS scheduling per formula and exercise type.
- [x] Due-first review queue.
- [x] Existing history replayed to reconstruct FSRS state.
- [x] Correct answer currently maps to FSRS `Good`.
- [x] Incorrect answer and `Show answer` currently map to FSRS `Again`.
- [x] Global learning-data reset without deleting formulas.

### Future

- [ ] Dedicated Statistics view.
- [ ] Weakness/progress statistics and trends.
- [ ] Selective reset per formula and/or practice mode.
- [ ] Review-session concept if useful, e.g. `10 reviews due` → focused session until queue is clear.
- [ ] Decide whether users should ever self-rate `Hard / Good / Easy` or whether objective exercise results remain preferable.
- [ ] Define how repeated wrong attempts within the same displayed challenge should influence scheduling.
- [ ] Consider recent-performance weighting for weakness ranking rather than lifetime accuracy alone.
- [ ] Category-level progress once enough formulas exist.

---

## Phase 4 — Advanced electronics exercises

- [ ] Formula relationship graph: connect formulas that share variables or can be chained.
- [ ] Multi-step generated problems requiring more than one formula.
- [ ] Realistic domain-specific value generators.
- [ ] E-series component values for resistors/capacitors where appropriate.
- [ ] AC/RLC-specific numerical scenarios.
- [ ] Power/energy scenarios.
- [ ] Thévenin/Norton and circuit-analysis exercise families only after the generic formula engine is stable enough to support them cleanly.

The goal is not to turn the app into a generic circuit simulator. Advanced exercises should remain tied to formula learning and retrieval practice.

---

## Phase 5 — Portability, backup and long-term data safety

### Completed

- [x] JSON backup/export.
- [x] JSON import with validation and non-destructive merge.
- [x] Back up and restore practice history.
- [x] Keep older version-1 backups importable after practice-history support was introduced.
- [x] GitHub Pages deployment.

### Future

- [ ] Document and test backup migrations whenever the format changes.
- [ ] Include future user preferences/settings in backups if they become meaningful.
- [ ] Provide a clear distinction between `merge import` and a possible future full restore/replace operation.
- [ ] Consider optional cloud/device sync only as a separate future layer; do not compromise the local-first core.
- [ ] Verify backup/export behavior in installed Android PWA mode.

---

## Engineering quality and technical debt

These items should be addressed incrementally rather than waiting for a large cleanup release.

### Automated tests

- [ ] Add a test framework and parser/comparison regression tests.
- [ ] Parser cases should include at least:
  - `X_C = 1/(2πfC)` → variables `X_C, f, C`, not `π`;
  - `V = RI` → `V, R, I`;
  - `P = VI` → `P, V, I`;
  - `I = dq/dt` → learning variables `I, q, t`;
  - MathLive-styled differential variants;
  - composite/subscript symbols when support is added.
- [ ] Full-recall comparison tests:
  - direct equation;
  - swapped equation sides;
  - commutative RHS when Compute Engine verifies it;
  - rearranged formula rejected in Full recall;
  - missing equals sign;
  - invalid expression.
- [ ] Missing-term generator tests.
- [ ] Backup validation/migration tests.
- [ ] FSRS history replay and queue-order tests.
- [ ] Learning-data reset test proving formulas remain untouched.

### Data integrity

- [ ] Ensure deleting a formula also cleans any associated practice logs and derived review cards.
- [ ] Periodically remove orphaned derived review data if a previous version left any behind.
- [ ] Keep review-card state derivable from practice history wherever practical.

### Dependency/build hygiene

- [ ] Commit and use a lockfile consistently so CI installs deterministic dependency versions.
- [ ] Review dependency ranges before major upgrades rather than upgrading automatically.
- [ ] Keep the vendored Compute Engine workaround documented; direct Vite bundling previously caused excessive memory use.
- [ ] Revisit bundle size/performance after core features stabilize.
- [ ] Remove the hard-coded `/formula-trainer/` vendor/base assumption if hosting becomes configurable.

---

## Known current limitations

1. **Derivative normalization is intentionally narrow.** It currently handles the tested simple first-order one-letter Leibniz form such as `dq/dt`; it is not a general calculus parser.
2. **Missing term is conservative.** It currently hides a suitable RHS variable rather than arbitrary symbolic subtrees.
3. **Full recall is not general equation solving.** Rearrangements are reserved for a future Solve-for-variable mode.
4. **FSRS uses two effective ratings today.** Correct → `Good`; incorrect/revealed → `Again`. There is no user-facing Hard/Easy grading yet.
5. **Statistics exist as stored data but not as a dedicated screen yet.**
6. **The electronics keyboard is newly introduced and still needs real Android ergonomic testing.** Direct-access keys should be changed based on usage data, not theory alone.
7. **No account/cloud sync exists.** Data remains local to the browser/PWA unless exported to JSON.
8. **Clearing site storage can erase local data.** Normal history/cache clearing is different, but users should keep backups before relying heavily on the library.

---

## Architecture and product decisions to preserve

- **Local-first by default.** No mandatory server, login or paid API for core use.
- **Symbolic source of truth.** Save a parseable equation, not only rendered LaTeX text.
- **One formula, multiple exercise modes.** Do not duplicate formulas just to train them differently.
- **Separate learning state per formula and mode.** FSRS scheduling for Full recall and Missing term must remain independent.
- **Explanatory feedback is part of learning, not decoration.** Wrong answers should teach what the missing/incorrect term means.
- **User-authored definitions are authoritative.** Automatic suggestions must remain editable and should not silently overwrite user content.
- **Secondary actions belong in Settings/menu.** Keep bottom navigation reserved for primary workflows.
- **Avoid over-permissive equivalence.** Each exercise mode needs a clear pedagogical definition of what counts as correct.
- **Mobile ergonomics have priority.** Keyboard size, scroll behavior and compact cards matter more than desktop density.

---

## Suggested development order after the current session

1. Test/refine electronics keyboard on Android.
2. Build the dedicated Statistics view.
3. Add Library search/filter for larger formula sets.
4. Add selective learning-data reset.
5. Add regression tests around parser, comparisons, missing-term generation and FSRS.
6. Implement Solve-for-variable after verifying symbolic APIs and correctness policy.
7. Implement numerical exercises with variable ranges and unit-aware checking.
8. Add formula-selection exercises.
9. Add realistic electronics value generation/E-series support.
10. Only then move toward multi-step problems and formula relationship graphs.
