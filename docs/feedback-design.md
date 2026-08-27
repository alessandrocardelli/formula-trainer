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

## Data dependency

Variable name and unit metadata already exist. Rich explanations should be implemented after optional variable definitions/descriptions are added to the formula model, so feedback is grounded in stored formula metadata rather than hard-coded prose.

## Practice integration

The explanatory block should appear primarily after wrong answers or `Show answer`, to avoid giving away the answer before retrieval. It should be reusable across Full recall, Missing term, numerical exercises, and future conceptual exercises.
