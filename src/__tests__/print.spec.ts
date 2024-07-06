import {grammar as jsonGrammar} from '../grammars/json';
import {GrammarPrinter} from '../print';
import {Grammar} from '../types';

test('can print a terminal node', () => {
  const grammar: Grammar = {
    start: 'Value',
    cst: {
      Value: {t: 'value'},
    },
  };
  const result = GrammarPrinter.print(grammar);
  expect(result).toBe('Value (terminal): "value"');
});

test('can print a terminal shorthand node', () => {
  const grammar: Grammar = {
    start: 'Value',
    cst: {
      Value: 'value',
    },
  };
  const result = GrammarPrinter.print(grammar);
  expect(result).toBe('Value (terminal): "value"');
});

test('can print a production node', () => {
  const grammar: Grammar = {
    start: 'Prod',
    cst: {
      Prod: {
        p: ['{', '}'],
      }
    },
  };
  const result = GrammarPrinter.print(grammar);
  expect(result).toBe(
`Prod (production)
├─ Text (terminal): "{"
└─ Text (terminal): "}"`);
});

test('can print a production shorthand node', () => {
  const grammar: Grammar = {
    start: 'Prod',
    cst: {
      Prod: ['{', '}'],
    },
  };
  const result = GrammarPrinter.print(grammar);
  expect(result).toBe(
`Prod (production)
├─ Text (terminal): "{"
└─ Text (terminal): "}"`);
});

test('can print a union node', () => {
  const grammar: Grammar = {
    start: 'U',
    cst: {
      U: {
        u: ['{', '}']
      }
    },
  };
  const result = GrammarPrinter.print(grammar);
  expect(result).toBe(
`U (union)
├─ Text (terminal): "{"
└─ Text (terminal): "}"`);
});

test('can print a list node', () => {
  const grammar: Grammar = {
    start: 'L',
    cst: {
      L: {
        l: 'a',
      }
    },
  };
  const result = GrammarPrinter.print(grammar);
  expect(result).toBe(
`L (list)
└─ Text (terminal): "a"`);
});

test('can print a reference node', () => {
  const grammar: Grammar = {
    start: 'Start',
    cst: {
      Start: {r: 'ws'},
      ws: /\s+/,
    },
  };
  const result = GrammarPrinter.print(grammar);
  expect(result).toBe(
`Start (reference)
└─ ws (terminal): /\\s+/`);
});

test('can print recursive grammar', () => {
  const grammar: Grammar = {
    start: 'Start',
    cst: {
      Start: {r: 'Start'},
    },
  };
  const result = GrammarPrinter.print(grammar);
  expect(result).toBe(`Start (reference) →`);
});

test('JSON', () => {
  const result = GrammarPrinter.print(jsonGrammar);
  expect(result).toBe(
`Value (production)
├─ Ws (terminal): (" " | "\\n" | "\\t" | "\\r")*
├─ TValue (union)
│  ├─ Null (terminal): "null"
│  ├─ Boolean (terminal): ("true" | "false")
│  ├─ String (terminal): /"[^"\\\\]*(?:\\\\.|[^"\\\\]*)*"/
│  ├─ Object (production)
│  │  ├─ Text (terminal): "{"
│  │  ├─ Members (union)
│  │  │  ├─ Production (production)
│  │  │  │  ├─ Entry (production)
│  │  │  │  │  ├─ Ws →
│  │  │  │  │  ├─ String →
│  │  │  │  │  ├─ Ws →
│  │  │  │  │  ├─ Text (terminal): ":"
│  │  │  │  │  └─ Value →
│  │  │  │  └─ List (list)
│  │  │  │     └─ Production (production)
│  │  │  │        ├─ Text (terminal): ","
│  │  │  │        └─ Entry →
│  │  │  └─ Ws →
│  │  └─ Text (terminal): "}"
│  ├─ Array (production)
│  │  ├─ Text (terminal): "["
│  │  ├─ Elements (union)
│  │  │  ├─ Production (production)
│  │  │  │  ├─ Value →
│  │  │  │  └─ List (list)
│  │  │  │     └─ Production (production)
│  │  │  │        ├─ Text (terminal): ","
│  │  │  │        └─ Value →
│  │  │  └─ Ws →
│  │  └─ Text (terminal): "]"
│  └─ Number (terminal): /\\-?(0|([1-9][0-9]{0,25}))(\\.[0-9]{1,25})?([eE][\\+\\\-]?[0-9]{1,25})?/
└─ Ws →`);
});

