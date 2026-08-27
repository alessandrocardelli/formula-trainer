# Roadmap

## Phase 0 — Foundation

- [x] Repository and license
- [x] React + TypeScript + Vite scaffold
- [x] PWA foundation
- [x] MathLive formula input
- [x] Local IndexedDB storage
- [x] Basic formula library
- [x] Mobile-first Practice / Library / Add navigation
- [x] Explicit mobile math-keyboard control
- [x] Continuous-integration build passing
- [ ] App menu/settings entry point for secondary actions and preferences
- [ ] Electronics-focused MathLive keyboard profiles with compact context-specific layouts

## Phase 1 — Formula model

- [x] Parse LaTeX into a symbolic expression
- [x] Validate equations before saving
- [x] Detect variables and constants
- [x] Store variable metadata and units
- [x] Optional per-variable definitions/descriptions, reusable as hints and conceptual exercises
- [x] Optional formula-level explanation/meaning
- [x] Edit variable metadata during the Add formula flow before saving
- [x] Edit existing formulas
- [ ] Search/filter the formula library

## Phase 2 — Active practice

- [x] Full recall exercise
- [x] Missing-term exercise
- [x] Randomized/shuffled missing-term challenge order
- [x] Rich explanatory feedback after correct, wrong, and revealed answers, using stored formula metadata
- [ ] General symbolic answer equivalence
- [ ] Solve-for-variable exercise
- [ ] Numerical exercise generator
- [ ] Unit-aware answer checking

## Phase 3 — Learning engine

- [x] Performance history per formula and exercise type
- [x] FSRS scheduling per formula and exercise type
- [x] Due-first review queue
- [ ] Dedicated Statistics view with overall, per-mode, and per-formula progress
- [ ] Weakness/progress statistics and trends
- [ ] Reset learning data (practice history, statistics, and FSRS state) without deleting formulas
- [ ] Optional selective reset per formula and/or practice mode

## Phase 4 — Advanced exercises

- [ ] Formula-selection problems
- [ ] Formula relationship graph
- [ ] Multi-step generated problems
- [ ] Realistic domain-specific value generators
- [ ] E-series component values for electronics

## Phase 5 — Portability

- [x] JSON backup/export
- [x] JSON import with validation and non-destructive merge
- [x] Back up and restore practice history
- [x] GitHub Pages deployment
- [ ] Installability verification on Android
