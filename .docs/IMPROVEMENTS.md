# Improvements & Known Limitations

This document tracks known gaps and limitations in the parser generator that are
worth addressing or, at minimum, documenting for users. These are design-level
issues rather than outright bugs (the outright bugs have been fixed and covered
by tests).

## No end-of-input enforcement

`parser(ctx, 0)` returns the first match without requiring full consumption, so
the shipped JSON parser silently accepts garbage:

```
"123 garbage here"  => matched [0..3], "garbage here" ignored, ast = 123
"[1,2,3] {\"x\":1}" => returns just the array, drops the rest
```

The JavaScript grammar works around this by manually appending `/$/` to
`Program`; the JSON grammar does not. There is no top-level "must consume all
input" option.

**Suggested fix:** add an opt-in check that the top-level match consumed the
entire input (i.e. `cst.end === ctx.str.length`) and surface a failure when it
did not.

## No error reporting

On failure the parser returns a bare `undefined` — no position, no
expected-token information. Standard PEG practice is to track the *furthest
failure position* for diagnostics; nothing here does. For a parser library this
is a major usability gap.

**Suggested fix:** record the furthest position reached during parsing (and
optionally the set of rules/terminals expected there) so callers can produce
"unexpected token at line:col, expected X" style messages.

## No memoization (packrat)

It is a backtracking PEG with no memo table, so it has no linear-time guarantee —
nested unions/productions can re-parse the same sub-rule at the same position
many times, going super-linear on adversarial grammars.

**Suggested fix:** add an opt-in memo cache keyed by `(rule, pos)` (packrat
parsing) to recover the linear-time guarantee, or at least document the
limitation and its worst-case behavior.

## No left-recursion support (inherent to PEG)

Every shipped grammar hand-rolls the `Expr → Mul Cont` continuation dance to
avoid left recursion; a directly left-recursive rule stack-overflows.

**Suggested fix:** this is an inherent property of PEG parsing and should be
documented as a known limitation, with the continuation-style rewrite shown as
the recommended pattern. (Supporting left recursion would require a more
involved technique such as bounded left-recursion / seed-growing.)
