# Testing JSON Grammars

A [JSON Grammar](../JSON-Grammar-spec.md) is portable data — a parser you can
ship as a `.json` file and run in any language. Its **tests should be just as
portable**. This page describes a small, standardized format for writing those
tests *as JSON*, so the same tests work everywhere the grammar does.

## Why tests-as-data?

Writing grammar tests as ordinary code (in Jest, Vitest, pytest, …) ties them to
one programming language and one test runner, and re-implements the same
"parse this, expect that" plumbing for every grammar.

Instead, write each test as a little JSON object: **an input, and what you
expect out**. Because the tests are plain data:

- ✅ **Portable across languages** — the same test files validate a TypeScript,
  Rust, Python, or Go implementation of the same grammar.
- ✅ **Portable across runners** — run them standalone, or plug them into
  whatever test framework you already use.
- ✅ **No boilerplate** — you edit two things only: the **grammar** and its
  **tests**. Nothing else.

You can — and generally should — write your grammar's tests in this schema.

## A first test

A test file is a JSON object with a list of `tests`. Each test gives an input
(`src`) and an expected output (here, the `ast`):

```json
{
  "describe": "JSON Expression",
  "tests": [
    { "name": "addition", "src": "(+ 1 2)", "ast": ["+", 1, 2] },
    { "name": "nesting",  "src": "(+ 1 (* 2 3))", "ast": ["+", 1, ["*", 2, 3]] }
  ]
}
```

That's the whole idea: **input in, expected tree out.** A test passes when
parsing `src` produces exactly the expected `ast`.

## Testing one rule at a time

By default a test runs the whole grammar (from its start rule). Add a `rule` to
test a single grammar rule **in isolation** — great for building a grammar up
piece by piece:

```json
{ "name": "number literal", "rule": "Number", "src": "-1.5e3", "ast": -1500 }
{ "name": "string literal", "rule": "String", "src": "\"hi\"",  "ast": "hi" }
```

## What you can check (output channels)

A grammar produces more than one artifact, and you can assert on any of them.
Each is an optional field on the test — include the ones you care about:

| Field      | Checks…                                                        |
| ---------- | -------------------------------------------------------------- |
| `ast`      | the **Abstract Syntax Tree** — the final, meaningful output    |
| `cst`      | the **Concrete Syntax Tree** as data `{type, pos, end, …}`     |
| `cstPrint` | the concrete tree as a printed, human-readable diagram         |
| `trace`    | a debug trace of how the parse proceeded                       |
| `end`      | how many characters were consumed                              |
| `parses`   | whether the input parses at all (`true` / `false`)             |
| `consumes` | `"all"` — assert the *entire* input was consumed               |

A field is checked only when you include it, so each test stays focused:

```json
{ "name": "rejects garbage",      "src": "@#$",        "parses": false }
{ "name": "must consume it all",  "src": "(+ 1 2)",    "consumes": "all" }
{ "name": "value and its span",   "src": "42",         "ast": 42, "end": 2 }
```

This presence-based rule also makes a tricky case natural — asserting an output
is literally `null`:

```json
{ "name": "null is preserved", "src": "(== \"x\" null)", "ast": ["==", "x", null] }
```

## Snapshots

For big or fiddly outputs (a whole concrete tree, a trace), you don't have to
hand-write the expected value. Mark the channel as a **snapshot** and let the
tooling fill it in the first time, then assert against it forever after:

```json
{ "name": "object tree", "src": "{\"a\": 1}", "snapshot": ["cstPrint"] }
```

After the first "update" run, the test gains its expected value inline:

```json
{
  "name": "object tree",
  "src": "{\"a\": 1}",
  "snapshot": ["cstPrint"],
  "cstPrint": [
    "Object 0:8",
    "├─ Entry 1:7",
    "│  ├─ key: String 1:4",
    "│  └─ value: Number 6:7",
    "└─ ..."
  ]
}
```

Snapshots live as plain JSON right in the test file — easy to read, easy to
review in a diff, and (because they're data) just as portable as everything
else. If a snapshot is requested but not yet recorded, the test fails until you
update it, so nothing silently goes unchecked.

## Generated inputs (round-trip checks)

Instead of a fixed `src`, you can ask the grammar to **generate** an input and
then check it parses back — a quick way to sanity-check a rule against itself:

```json
{ "name": "comments round-trip", "rule": "Comment",
  "generate": "sample", "consumes": "all" }
```

## Handy extras

```json
{ "name": "work in progress", "src": "...", "skip": true }
{ "name": "focus just this",  "src": "...", "ast": 1, "only": true }
```

`skip` ignores a test; if any test sets `only`, just those run — useful while
debugging.

## How it runs

A test runner needs only one small, grammar-runtime-specific helper: something
that takes an input and returns the parse outputs (the AST, the tree, etc.).
Everything else — reading the test files, comparing expected vs. actual,
updating snapshots, reporting pass/fail — is generic and the **same for every
grammar and every language**.

That's the payoff: write your tests once, as data, and they keep working no
matter what language your parser is implemented in or what test runner you use.
