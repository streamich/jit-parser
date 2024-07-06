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
  const json = JSON.stringify(json1);
  // const json = JSON.stringify([1]);
  const ctx = new ParseContext(json, false, [rootTraceNode]);
  parser(ctx, 0);
  // console.log(JSON.stringify(rootTraceNode, null, 2));
  // console.log(JSON.stringify([1], null, 2));
  console.log(printTraceNode(rootTraceNode, '', json));
  // expect(rootTraceNode).toMatchObject({
  //   pos: 0,
  //   children: [{
  //     pos: 0,
  //     children: [
  //       {
  //         pos: 0,
  //         match: {pos: 0, end: 1},
  //       },
  //       {
  //         pos: 1,
  //         match: {pos: 1, end: 2},
  //       },
  //       {
  //         pos: 2,
  //         match: {pos: 2, end: 3},
  //       },
  //       {
  //         pos: 3,
  //       },
  //     ],
  //     match: {pos: 0, end: 3},
  //   }],
  // });
});
