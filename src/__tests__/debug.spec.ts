import {CodegenGrammar} from '../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../context';
import {Grammar, RootTraceNode} from '../types';
import {grammar as jsonGrammar} from '../grammars/json';
import {json1} from '../__bench__/data/jsons';
import {printTraceNode} from '../print';

test('can capture terminal debug information', () => {
  const grammar: Grammar = {
    start: 'Value',
    cst: {
      Value: {t: 'value'},
    },
  };
  const codegen = new CodegenGrammar(grammar, new CodegenContext(true, true, true));
  const parser = codegen.compile();
  const rootTraceNode: RootTraceNode = {pos: 0, children: []}
  const ctx = new ParseContext('value', false, [rootTraceNode]);
  parser(ctx, 0);
  expect(rootTraceNode).toMatchObject({
    pos: 0,
    children: [
      {
        pos: 0,
        ptr: expect.any(Object),
        match: {pos: 0, end: 5},
      },
    ],
  });
});

test('can capture debug trace in production node', () => {
  const grammar: Grammar = {
    start: 'Value',
    cst: {
      Value: ['{', 'value', '}'],
    },
  };
  const codegen = new CodegenGrammar(grammar, new CodegenContext(true, true, true));
  const parser = codegen.compile();
  const rootTraceNode: RootTraceNode = {pos: 0, children: []}
  const ctx = new ParseContext('{value}', false, [rootTraceNode]);
  parser(ctx, 0);
  expect(rootTraceNode).toMatchObject({
    pos: 0,
    children: [{
      pos: 0,
      children: [
        {
          pos: 0,
          match: {pos: 0, end: 1},
        },
        {
          pos: 1,
          match: {pos: 1, end: 6},
        },
        {
          pos: 6,
          match: {pos: 6, end: 7},
        },
      ],
    }],
  });
});

test('can capture debug trace in union node', () => {
  const grammar: Grammar = {
    start: 'Value',
    cst: {
      Value: {
        u: [
          'var',
          'let',
          'const',
        ],
      },
    },
  };
  const codegen = new CodegenGrammar(grammar, new CodegenContext(true, true, true));
  const parser = codegen.compile();
  const rootTraceNode: RootTraceNode = {pos: 0, children: []}
  const ctx = new ParseContext('const', false, [rootTraceNode]);
  parser(ctx, 0);
  expect(rootTraceNode).toMatchObject({
    pos: 0,
    children: [{
      pos: 0,
      children: [
        {
          pos: 0,
        },
        {
          pos: 0,
        },
        {
          pos: 0,
          match: {pos: 0, end: 5},
        },
      ],
    }],
  });
});

test('can capture debug trace in list node', () => {
  const grammar: Grammar = {
    start: 'Value',
    cst: {
      Value: {
        l: 'a',
      },
    },
  };
  const codegen = new CodegenGrammar(grammar, new CodegenContext(true, true, true));
  const parser = codegen.compile();
  const rootTraceNode: RootTraceNode = {pos: 0, children: []}
  const ctx = new ParseContext('aaa', false, [rootTraceNode]);
  parser(ctx, 0);
  expect(rootTraceNode).toMatchObject({
    pos: 0,
    children: [{
      pos: 0,
      children: [
        {
          pos: 0,
          match: {pos: 0, end: 1},
        },
        {
          pos: 1,
          match: {pos: 1, end: 2},
        },
        {
          pos: 2,
          match: {pos: 2, end: 3},
        },
        {
          pos: 3,
        },
      ],
      match: {pos: 0, end: 3},
    }],
  });
});

test('can capture JSON grammar trace', () => {
  const codegen = new CodegenGrammar(jsonGrammar, new CodegenContext(true, true, true));
  const parser = codegen.compile();
  const rootTraceNode: RootTraceNode = {pos: 0, children: []}
  const json = ' {"foo": ["bar", 123]}';
  const ctx = new ParseContext(json, false, [rootTraceNode]);
  parser(ctx, 0);
  const formatted = printTraceNode(rootTraceNode, '', json);
  expect(formatted).toBe(
`Root
└─ Value 0:22 → ' {"foo": ["bar", 123]}'
   ├─ WOpt 0:1 → " "
   ├─ TValue 1:22 → '{"foo": ["bar", 123]}'
   │  ├─ Null
   │  ├─ Boolean
   │  ├─ String
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
   │     │     │     │  ├─ Null
   │     │     │     │  ├─ Boolean
   │     │     │     │  ├─ String
   │     │     │     │  ├─ Object
   │     │     │     │  │  └─ Text
   │     │     │     │  └─ Array 9:21 → '["bar", 123]'
   │     │     │     │     ├─ Text 9:10 → "["
   │     │     │     │     ├─ Elements 10:20 → '"bar", 123'
   │     │     │     │     │  └─ Production 10:20 → '"bar", 123'
   │     │     │     │     │     ├─ Value 10:15 → '"bar"'
   │     │     │     │     │     │  ├─ WOpt 10:10 → ""
   │     │     │     │     │     │  ├─ TValue 10:15 → '"bar"'
   │     │     │     │     │     │  │  ├─ Null
   │     │     │     │     │     │  │  ├─ Boolean
   │     │     │     │     │     │  │  └─ String 10:15 → '"bar"'
   │     │     │     │     │     │  └─ WOpt 15:15 → ""
   │     │     │     │     │     └─ List 15:20 → ", 123"
   │     │     │     │     │        ├─ Production 15:20 → ", 123"
   │     │     │     │     │        │  ├─ Text 15:16 → ","
   │     │     │     │     │        │  └─ Value 16:20 → " 123"
   │     │     │     │     │        │     ├─ WOpt 16:17 → " "
   │     │     │     │     │        │     ├─ TValue 17:20 → "123"
   │     │     │     │     │        │     │  ├─ Null
   │     │     │     │     │        │     │  ├─ Boolean
   │     │     │     │     │        │     │  ├─ String
   │     │     │     │     │        │     │  ├─ Object
   │     │     │     │     │        │     │  │  └─ Text
   │     │     │     │     │        │     │  ├─ Array
   │     │     │     │     │        │     │  │  └─ Text
   │     │     │     │     │        │     │  └─ Number 17:20 → "123"
   │     │     │     │     │        │     └─ WOpt 20:20 → ""
   │     │     │     │     │        └─ Production
   │     │     │     │     │           └─ Text
   │     │     │     │     └─ Text 20:21 → "]"
   │     │     │     └─ WOpt 21:21 → ""
   │     │     └─ List 21:21 → ""
   │     │        └─ Production
   │     │           └─ Text
   │     └─ Text 21:22 → "}"
   └─ WOpt 22:22 → ""`);
});

test('can capture two partial routes', () => {
  const grammar: Grammar = {
    start: 'Program',
    cst: {
      Program: {
        u: [
          {r: 'Object'},
          {r: 'BlockStatement'},
        ],
      },
      Whitespace: {t: [' '], repeat: '*'},
      Object: ['{', {r: 'Whitespace'}, {r: 'Key'}, {r: 'Whitespace'}, ':', {r: 'Whitespace'}, {r: 'Value'}, {r: 'Whitespace'}, '}', ';'],
      Key: 'abc',
      Value: '123',
      BlockStatement: ['{', {r: 'Whitespace'}, {r: 'ID'}, '()', ';', {r: 'Whitespace'}, '}'],
      ID: /[a-zA-Z_][a-zA-Z0-9_]*/,
    },
  };
  const codegen = new CodegenGrammar(grammar, new CodegenContext(true, true, true));
  const parser = codegen.compile();
  const rootTraceNode: RootTraceNode = {pos: 0, children: []}
  const text = '{ abc: 123 bd };';
  const ctx = new ParseContext(text, false, [rootTraceNode]);
  parser(ctx, 0);
  const trace = printTraceNode(rootTraceNode.children[0], '', text);
  expect(trace).toBe(
`Program
├─ Object
│  ├─ Text 0:1 → "{"
│  ├─ Whitespace 1:2 → " "
│  ├─ Key 2:5 → "abc"
│  ├─ Whitespace 5:5 → ""
│  ├─ Text 5:6 → ":"
│  ├─ Whitespace 6:7 → " "
│  ├─ Value 7:10 → "123"
│  ├─ Whitespace 10:11 → " "
│  └─ Text
└─ BlockStatement
   ├─ Text 0:1 → "{"
   ├─ Whitespace 1:2 → " "
   ├─ ID 2:5 → "abc"
   └─ Text`);
});
