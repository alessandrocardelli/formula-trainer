# Product design notes

## Core principle

Formula Trainer should train more than recognition. A formula can be remembered in one context and still be difficult to manipulate or apply, so each formula will eventually track performance by exercise type.

## Formula lifecycle

1. User enters a formula visually.
2. The formula is parsed into a symbolic representation.
3. Variables and constants are identified.
4. The user can add names, units, realistic value ranges and notes.
5. Exercise generators create multiple practice modes from the same formula.
6. Each practice mode receives its own review history and scheduling state.

## Variable metadata reuse

Variable metadata saved with formulas remains user-authoritative learning content. The app may reuse metadata that the user has already saved for the same symbol when creating another formula, but it must not silently invent conceptual definitions.

The current reuse policy is field-by-field:

- saved formula metadata is indexed only as a derived in-memory view; formulas in IndexedDB remain the source of truth;
- when a newly detected symbol has one unambiguous previously saved value for a field, that value can be suggested automatically;
- repeated values that differ only by case, whitespace or line wrapping are treated as the same value;
- when multiple genuinely different saved values exist for the same symbol and field, that field is not reused automatically;
- for familiar symbols, built-in safe defaults may still provide a conventional name and unit when saved metadata is ambiguous or absent;
- once a suggestion appears in the current formula draft, the user's edits take precedence, including deliberately clearing a field.

This allows definitions such as `I = Electric current` to be reused across formulas without turning symbol meanings into globally fixed data. Symbols remain context-sensitive when the user's own library demonstrates that they are ambiguous.

## Planned exercise modes

### Recall

Given the formula name or meaning, reproduce the complete expression.

### Missing term

Hide one or more meaningful subexpressions and ask the user to reconstruct them.

### Solve for variable

Choose a variable and ask the user to algebraically isolate it. Equivalent symbolic answers should be accepted.

### Numerical application

Generate realistic values for known variables and ask the user to calculate the target quantity, including units.

### Formula selection

Describe a target and known quantities, then ask which formula or formulas can produce the target.

### Multi-step problem

Build a graph of compatible formulas and generate problems that require more than one relationship.

## Scheduling

Spaced repetition should eventually be tracked at the level of `(formula, exercise type)`, not only at the formula level. This prevents strong recall from hiding weaknesses in manipulation or application.

## Constraints for the first releases

- local-first;
- no mandatory account;
- no paid API dependency;
- deterministic math checking where possible;
- mobile-first interaction;
- usable offline after installation.
