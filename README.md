# Formula Trainer

A local-first PWA for learning, recalling, manipulating, and applying mathematical formulas through active practice and spaced repetition.

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

The first scaffold is in place. The app currently provides:

- React + TypeScript + Vite;
- installable PWA foundation;
- MathLive visual formula editor;
- local formula storage with IndexedDB/Dexie;
- a simple personal formula library;
- offline-first architecture with no account or backend required.

All user data is intended to remain local by default. Backup/import can be added without requiring a server.

## Preview deployment

The current development build is configured for deployment to GitHub Pages from the `main` branch using GitHub Actions.

## Planned stack

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

## MVP roadmap

1. Personal formula library
2. Parse and validate formulas symbolically
3. Recall exercise
4. Missing-term exercise
5. Solve-for-variable exercise
6. Numerical exercise generator
7. Per-exercise performance tracking
8. FSRS scheduling
9. Backup/export and import
10. GitHub Pages deployment

## License

MIT
