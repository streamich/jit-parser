import {CodegenGrammar} from '../codegen/CodegenGrammar';
import {ParseContext} from '../context';
import {grammar as jsonGrammar} from '../grammars/json';
import {GrammarPrinter, printCst} from '../print';
import {Grammar} from '../types';

describe('GrammarPrinter', () => {
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
        },
      },
    };
    const result = GrammarPrinter.print(grammar);
    expect(result).toBe(
      `Prod (production)
├─ Text (terminal): "{"
└─ Text (terminal): "}"`,
    );
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
└─ Text (terminal): "}"`,
    );
  });

  test('can print a union node', () => {
    const grammar: Grammar = {
      start: 'U',
      cst: {
        U: {
          u: ['{', '}'],
        },
      },
    };
    const result = GrammarPrinter.print(grammar);
    expect(result).toBe(
      `U (union)
├─ Text (terminal): "{"
└─ Text (terminal): "}"`,
    );
  });

  test('can print a list node', () => {
    const grammar: Grammar = {
      start: 'L',
      cst: {
        L: {
          l: 'a',
        },
      },
    };
    const result = GrammarPrinter.print(grammar);
    expect(result).toBe(
      `L (list)
└─ Text (terminal): "a"`,
    );
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
└─ ws (terminal): /\\s+/`,
    );
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
├─ WOpt (terminal): (" " | "\\n" | "\\t" | "\\r")*
├─ TValue (union)
│  ├─ Null (terminal): "null"
│  ├─ Boolean (terminal): ("true" | "false")
│  ├─ String (terminal): /"[^"\\\\]*(?:\\\\.|[^"\\\\]*)*"/
│  ├─ Object (production)
│  │  ├─ Text (terminal): "{"
│  │  ├─ Members (union)
│  │  │  ├─ Production (production)
│  │  │  │  ├─ Entry (production)
│  │  │  │  │  ├─ → WOpt
│  │  │  │  │  ├─ → String
│  │  │  │  │  ├─ → WOpt
│  │  │  │  │  ├─ Text (terminal): ":"
│  │  │  │  │  └─ → Value
│  │  │  │  └─ List (list)
│  │  │  │     └─ Production (production)
│  │  │  │        ├─ Text (terminal): ","
│  │  │  │        └─ → Entry
│  │  │  └─ → WOpt
│  │  └─ Text (terminal): "}"
│  ├─ Array (production)
│  │  ├─ Text (terminal): "["
│  │  ├─ Elements (union)
│  │  │  ├─ Production (production)
│  │  │  │  ├─ → Value
│  │  │  │  └─ List (list)
│  │  │  │     └─ Production (production)
│  │  │  │        ├─ Text (terminal): ","
│  │  │  │        └─ → Value
│  │  │  └─ → WOpt
│  │  └─ Text (terminal): "]"
│  └─ Number (terminal): /\\-?(0|([1-9][0-9]{0,25}))(\\.[0-9]{1,25})?([eE][\\+\\\-]?[0-9]{1,25})?/
└─ → WOpt`,
    );
  });
});

describe('printCst()', () => {
  test('can print JSON CST', () => {
    const parser = CodegenGrammar.compile(jsonGrammar);
    const json = ' {"foo": ["bar", 123]}';
    const ctx = new ParseContext(json, false);
    const cst = parser(ctx, 0);
    const formatted = printCst(cst!, '', json);
    expect(formatted).toBe(
      `Value 0:22 → ' {"foo": ["bar", 123]}'
├─ WOpt 0:1 → " "
├─ TValue 1:22 → '{"foo": ["bar", 123]}'
│  └─ Object 1:22 → '{"foo": ["bar", 123]}'
│     ├─ Text 1:2 → "{"
│     ├─ Members 2:21 → '"foo": ["bar", 123]'
│     │  └─ Production 2:21 → '"foo": ["bar", 123]'
│     │     ├─ Entry 2:21 → '"foo": ["bar", 123]'
│     │     │  ├─ WOpt 2:2 → ""
│     │     │  ├─ String 2:7 → '"foo"'
│     │     │  ├─ WOpt 7:7 → ""
│     │     │  ├─ Text 7:8 → ":"
│     │     │  └─ Value 8:21 → ' ["bar", 123]'
│     │     │     ├─ WOpt 8:9 → " "
│     │     │     ├─ TValue 9:21 → '["bar", 123]'
│     │     │     │  └─ Array 9:21 → '["bar", 123]'
│     │     │     │     ├─ Text 9:10 → "["
│     │     │     │     ├─ Elements 10:20 → '"bar", 123'
│     │     │     │     │  └─ Production 10:20 → '"bar", 123'
│     │     │     │     │     ├─ Value 10:15 → '"bar"'
│     │     │     │     │     │  ├─ WOpt 10:10 → ""
│     │     │     │     │     │  ├─ TValue 10:15 → '"bar"'
│     │     │     │     │     │  │  └─ String 10:15 → '"bar"'
│     │     │     │     │     │  └─ WOpt 15:15 → ""
│     │     │     │     │     └─ List 15:20 → ", 123"
│     │     │     │     │        └─ Production 15:20 → ", 123"
│     │     │     │     │           ├─ Text 15:16 → ","
│     │     │     │     │           └─ Value 16:20 → " 123"
│     │     │     │     │              ├─ WOpt 16:17 → " "
│     │     │     │     │              ├─ TValue 17:20 → "123"
│     │     │     │     │              │  └─ Number 17:20 → "123"
│     │     │     │     │              └─ WOpt 20:20 → ""
│     │     │     │     └─ Text 20:21 → "]"
│     │     │     └─ WOpt 21:21 → ""
│     │     └─ List 21:21 → ""
│     └─ Text 21:22 → "}"
└─ WOpt 22:22 → ""`,
    );
  });
});
