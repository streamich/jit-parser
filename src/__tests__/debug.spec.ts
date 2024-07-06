import {CodegenGrammar} from '../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../context';
import {Grammar, RootTraceNode} from '../types';

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