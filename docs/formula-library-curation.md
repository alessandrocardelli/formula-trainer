# Curated formula library workflow

This document defines the required process for every curated Formula Trainer formula batch.

## Source policy

Each electronics formula added to a curated batch must be checked against both primary references used by the project:

- Boylestad, *Introductory Circuit Analysis*, 14th Edition;
- Horowitz and Hill, *The Art of Electronics*, 3rd Edition.

The books are used to verify the relationship, notation, conditions of validity, terminology and pedagogical context. Explanations and variable definitions should be concise project-authored paraphrases rather than copied textbook prose.

## Batch completion checklist

A curated batch is not ready to import until all of the following checks pass:

1. **Formula coverage** — verify that the batch contains the useful canonical relationships for the intended topic, including general forms and important special cases where both are worth memorizing.
2. **No artificial formulas** — do not turn procedures or qualitative principles into invented equations merely to fit the data model.
3. **Parser/import validation** — every saved LaTeX equation must be accepted by the current parser and backup importer.
4. **Variable metadata** — every parser-detected learning variable must have matching normalized metadata where curated metadata is supplied.
5. **Keyboard coverage audit** — every symbol, operator, delimiter and mathematical construction required to reproduce the formulas must be enterable with the current Formula Trainer keyboard.
6. **Practice audit** — review Full recall and Missing term behavior for pedagogically poor, impossible or misleading prompts.
7. **Category review** — confirm that every formula belongs to the intended study category and that the batch still fits the project's category taxonomy.
8. **Mobile usability** — if the keyboard changes, preserve a compact layout suitable for the target Android device and avoid increasing height or row density without a concrete need.

## Mandatory keyboard coverage audit

Keyboard review is part of formula-library curation, not a separate optional UI task.

For every new or revised formula batch:

1. extract every variable, constant, Greek letter, digit, operator, relation, delimiter and structural construct used by every formula in the batch;
2. treat delimiter families separately: round parentheses `()`, square brackets `[]`, braces when mathematically required, and any later absolute-value/norm delimiters;
3. compare the required input set with the current `Electronics`, `Alphabetic` and `Advanced` keyboard coverage;
4. verify that a real user can reproduce each formula from an empty field without relying on hidden or accidental MathLive behavior;
5. identify anything that cannot be entered directly or through the intended fallback layout;
6. update the keyboard before the batch is considered complete;
7. place frequently used electronics symbols on direct-access keys and keep less-common constructs in `Advanced`;
8. remove, demote or move rarely used direct-access keys to variants when necessary to keep the mobile keyboard compact;
9. re-check Add, Full recall and Missing term after a keyboard change.

Examples of constructs that must be checked explicitly include fractions, `+`, `-`, equality/relations, round parentheses, square brackets, subscripts, superscripts, Greek symbols, square roots, exponentials, sums, integrals and derivatives. A generic statement such as “parentheses are covered” is not sufficient when the batch also contains a different delimiter family.

The long-term engineering goal is to automate this coverage check so a curated library fixture or batch can fail validation when it introduces an unsupported symbol or construct.

## Current core-library audit

The first 44-formula core library uses, beyond ordinary Latin letters and digits:

- equality, addition and subtraction;
- fractions;
- round parentheses `()`;
- square brackets `[]`;
- subscripts and superscripts;
- summation;
- `rho` (ρ);
- `alpha` (α);
- `eta` (η).

The first September 2026 audit was incomplete: it correctly found the missing η key but failed to count square brackets as a separate required delimiter even though the resistance-versus-temperature formula already uses them.

The corrected audit results are:

- η is available in the `Advanced` layout;
- a paired square-brackets key is available in `Advanced` and inserts `\left[...\right]` around a placeholder;
- `≈` remains available as a long-press/variant of the equality key, so adding square brackets does not increase the seven-key mobile row width;
- the remaining constructs used by the 44 formulas are already covered by the direct electronics keys or the alphabetic fallback.

## Definition of done for a curated batch

A batch is complete only when its source review, parser/import validation, metadata audit, keyboard coverage audit and practice audit have all passed. Importing the JSON into the app is the final verification step, not the first place missing keyboard symbols or parser incompatibilities should be discovered.
