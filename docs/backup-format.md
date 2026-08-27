# Local backup format

Formula Trainer stores its working data locally in the browser with IndexedDB.

`Export backup` in the Library downloads a versioned JSON snapshot of the formulas currently persisted in IndexedDB. The file contains:

- `app`: backup identifier (`formula-trainer`);
- `version`: backup schema version;
- `exportedAt`: ISO timestamp;
- `formulas`: the persisted formula records, including variable metadata and explanations.

`Import backup` validates the complete file before changing IndexedDB. Version 1 imports are merged with the existing library:

- an equation with the same name, category, and LaTeX is treated as the same formula;
- a newer imported copy updates the existing record;
- an equal or older copy is skipped;
- a formula not already present is added with a fresh local IndexedDB id;
- imported symbolic data is reparsed with the current Formula Trainer parser instead of trusting cached parser output from the backup.

The import runs in a single IndexedDB transaction after validation, so an invalid backup does not partially modify the library. Import does not delete formulas that already exist locally.
