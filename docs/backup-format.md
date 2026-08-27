# Local backup format

Formula Trainer stores its working data locally in the browser with IndexedDB.

`Export backup` in the Library downloads a versioned JSON snapshot of the data currently persisted in IndexedDB. Version 2 contains:

- `app`: backup identifier (`formula-trainer`);
- `version`: backup schema version;
- `exportedAt`: ISO timestamp;
- `formulas`: persisted formula records, including variable metadata and explanations;
- `practiceLogs`: raw practice-history events, including formula, exercise mode, check/reveal action, correctness, response time, and timestamp.

`Import backup` validates the complete file before changing IndexedDB. Version 1 backups remain supported and contain formulas only. Version 2 backups restore both formulas and practice history.

Formula merge rules:

- an equation with the same name, category, and LaTeX is treated as the same formula;
- a newer imported copy updates the existing record;
- an equal or older copy is skipped;
- a formula not already present is added with a fresh local IndexedDB id;
- imported symbolic data is reparsed with the current Formula Trainer parser instead of trusting cached parser output from the backup.

Practice-history events are remapped from backup formula ids to the matching local formula ids. Re-importing the same backup does not duplicate identical practice events.

The import runs in a single IndexedDB transaction after validation, so an invalid backup does not partially modify the library or practice history. Import does not delete data that already exists locally.
