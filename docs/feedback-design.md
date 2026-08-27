# Practice feedback design

## Goal

Practice feedback should teach the formula, not only mark an answer as correct or incorrect.

## Planned behaviour

After an incorrect answer or an explicit reveal, show a compact explanation that can include:

- the correct missing term or formula;
- the meaning of the requested variable;
- the meaning and unit of the other variables in the formula;
- a short explanation of what the formula expresses physically or mathematically;
- optional per-variable definitions as hints or follow-up conceptual questions.

Example for `I = dq/dt`:

- `q`: electric charge, measured in coulombs (C);
- `t`: time, measured in seconds (s);
- `I`: electric current, measured in amperes (A);
- explanation: current describes how quickly electric charge changes or flows with time.

## Data source

The formula model now stores variable name, unit and an optional user-approved definition, plus an optional formula-level explanation. These fields are collected directly in the Add formula flow and remain editable in the Library.

Rich practice feedback should use only this stored metadata as its authoritative source. Familiar symbols may receive name/unit suggestions, but definitions and formula explanations are user-editable and are not silently generated or treated as correct by the app.

## Practice integration

The explanatory block should appear primarily after wrong answers or `Show answer`, to avoid giving away the answer before retrieval. It should be reusable across Full recall, Missing term, numerical exercises, and future conceptual exercises.
