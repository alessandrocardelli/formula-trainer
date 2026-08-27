# Local backup format

Formula Trainer stores its working data locally in the browser with IndexedDB.

`Export backup` in the Library downloads a versioned JSON snapshot of the formulas currently persisted in IndexedDB. The file contains:

- `app`: backup identifier (`formula-trainer`);
- `version`: backup schema version;
- `exportedAt`: ISO timestamp;
- `formulas`: the persisted formula records, including variable metadata and explanations.

The export is intended to protect local data before browser/site storage is cleared and to provide the source format for the future JSON import feature.
