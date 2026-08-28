# Formula Trainer

A local-first PWA for learning, recalling, manipulating, and applying mathematical and electronics formulas through active practice and spaced repetition.

## Goal

Formula Trainer is not intended to be a traditional flashcard app. The long-term goal is to let the user enter a formula once and automatically generate different kinds of practice around it:

- full formula recall;
- missing-term reconstruction;
- solving for a different variable;
- numerical exercises;
- choosing the right formula for a problem;
- multi-step problems using more than one formula;
- spaced repetition based on performance for each skill.

## Current state

The project has moved beyond the initial scaffold and now includes a complete first learning loop:

- React + TypeScript + Vite PWA;
- local IndexedDB/Dexie formula storage;
- MathLive formula entry with a compact electronics-focused virtual keyboard;
- symbolic parsing and validation through CortexJS Compute Engine;
- automatic variable detection with editable name, unit and definition metadata;
- optional formula explanations;
- formula editing and deletion;
- Full recall practice;
- Missing term practice with shuffled gaps;
- explanatory feedback for correct, incorrect and revealed answers;
- persistent practice history including response time;
- FSRS scheduling independently for each formula and practice mode;
- due-first review queue;
- JSON backup/export and validated non-destructive import;
- app update prompt for new PWA versions;
- settings/menu entry point and learning-history reset without deleting formulas;
- GitHub Actions CI and GitHub Pages deployment.

The app remains local-first: no account, backend or paid API is required for the core experience.

## Current development focus

The project is currently in a core hardening and usability phase.

The immediate order is:

1. Test and refine the electronics keyboard and recent MathLive menu fixes on the target Android device.
2. Build a dedicated Statistics view from the practice-history and FSRS data already stored.
3. Add Library search/filter for larger formula collections.
4. Add selective learning-data reset.
5. Introduce regression tests for parsing, symbolic comparison, Missing term, backup and FSRS behavior.
6. Then move to Solve-for-variable and numerical exercises.

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the detailed current status, design decisions, known limitations and development order.

## Preview deployment

The development build is deployed to GitHub Pages from the `main` branch using GitHub Actions.

## Stack

- **React + TypeScript** — interface and application logic
- **MathLive** — visual mathematical input
- **CortexJS Compute Engine** — symbolic parsing, equivalence and manipulation
- **Dexie / IndexedDB** — local data storage
- **FSRS** — spaced-repetition scheduling
- **Vite PWA** — installable/offline web app

## Development

Requirements: Node.js 22 or later.

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

The current CI workflow installs dependencies and runs the production build. Automated tests are planned but are not yet part of CI.

## License

MIT
