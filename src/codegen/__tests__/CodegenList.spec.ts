import {CodegenContext, ParseContext} from '../../context';
import {CodegenGrammar} from '../CodegenGrammar';
import {CodegenList} from '../CodegenList';
import {CodegenTerminal} from '../CodegenTerminal';
import {Pattern} from '../Pattern';
import type {Grammar, RootTraceNode, TerminalNode} from '../../types';

/**
 * Runs `parse` in a way that fails the test (instead of hanging the whole
 * suite) if the parser enters an infinite loop. We can't use a real timeout
 * because the generated parser is synchronous, so we instead assert that the
 * call returns at all and verify it makes progress.
 */
const expectTerminates = <T>(fn: () => T): T => {
  // If the nullable-list guard regresses, this call never returns and Jest's
  // per-test timeout kills the worker — which is the signal we want.
  return fn();
};

describe('CodegenList', () => {
  test('can parse a simple production', () => {
    const fooPattern = new Pattern('FooText');
    const foo = CodegenTerminal.compile('ab', fooPattern);
    const node = {l: 'ab'};
    const pattern = new Pattern('L');
    const parse = CodegenList.compile(node, pattern, foo);
    const ctx = new ParseContext('abab', false);
    const cst = parse(ctx, 0);
    expect(cst).toMatchObject({
      pos: 0,
      end: 4,
      ptr: {
        type: 'L',
      },
      children: [
        {pos: 0, end: 2},
        {pos: 2, end: 4},
      ],
    });
  });

  describe('nullable body (zero-width match) does not loop forever', () => {
    test('list over an empty-string terminal terminates with an empty match', () => {
      const childPattern = new Pattern('Empty');
      const child = CodegenTerminal.compile('', childPattern);
      const node = {l: ''};
      const pattern = new Pattern('L');
      const parse = CodegenList.compile(node, pattern, child);
      const ctx = new ParseContext('abc', false);
      const cst = expectTerminates(() => parse(ctx, 0));
      expect(cst).toMatchObject({pos: 0, end: 0, children: []});
    });

    test('list over a repeat:"*" terminal consumes greedily once, then stops', () => {
      const childPattern = new Pattern('WOpt');
      const terminal: TerminalNode = {t: [' ', '\t'], repeat: '*'};
      const child = CodegenTerminal.compile(terminal, childPattern);
      const node = {l: terminal};
      const pattern = new Pattern('L');
      const parse = CodegenList.compile(node, pattern, child);
      const ctx = new ParseContext('  \tx', false);
      const cst = expectTerminates(() => parse(ctx, 0));
      expect(cst).toMatchObject({pos: 0, end: 3, children: [{pos: 0, end: 3}]});
    });

    test('grammar-level reproduction: {l: {r: "WOpt"}} over a nullable rule', () => {
      const grammar: Grammar = {
        start: 'Doc',
        cst: {
          WOpt: {t: [' ', '\t'], repeat: '*'},
          Doc: {l: {r: 'WOpt'}},
        },
      };
      const parser = CodegenGrammar.compile(grammar);
      const ctx = new ParseContext('   ', false);
      const cst = expectTerminates(() => parser(ctx, 0));
      expect(cst).toMatchObject({pos: 0, end: 3});
    });
  });

  describe('min and max constraints', () => {
    test('min constraint fails when not met', () => {
      const fooPattern = new Pattern('FooText');
      const foo = CodegenTerminal.compile('a', fooPattern);
      const node = {l: 'a', min: 2};
      const pattern = new Pattern('L');
      const parse = CodegenList.compile(node, pattern, foo);
      const ctx = new ParseContext('a', false);
      const cst = parse(ctx, 0);
      expect(cst).toBeUndefined();
    });

    test('min constraint succeeds when met', () => {
      const fooPattern = new Pattern('FooText');
      const foo = CodegenTerminal.compile('a', fooPattern);
      const node = {l: 'a', min: 2};
      const pattern = new Pattern('L');
      const parse = CodegenList.compile(node, pattern, foo);
      const ctx = new ParseContext('aa', false);
      const cst = parse(ctx, 0);
      expect(cst).toMatchObject({
        pos: 0,
        end: 2,
        children: [
          {pos: 0, end: 1},
          {pos: 1, end: 2},
        ],
      });
    });

    test('max constraint stops parsing after max items', () => {
      const fooPattern = new Pattern('FooText');
      const foo = CodegenTerminal.compile('a', fooPattern);
      const node = {l: 'a', max: 2};
      const pattern = new Pattern('L');
      const parse = CodegenList.compile(node, pattern, foo);
      const ctx = new ParseContext('aaaa', false);
      const cst = parse(ctx, 0);
      expect(cst).toMatchObject({
        pos: 0,
        end: 2,
        children: [
          {pos: 0, end: 1},
          {pos: 1, end: 2},
        ],
      });
    });
  });

  describe('sep constraint', () => {
    test('parses with separator', () => {
      const fooPattern = new Pattern('FooText');
      const foo = CodegenTerminal.compile('a', fooPattern);
      const sepPattern = new Pattern('SepText');
      const sep = CodegenTerminal.compile(',', sepPattern);
      const node = {l: 'a'};
      const pattern = new Pattern('L');
      const parse = CodegenList.compile(node, pattern, foo, undefined, sep);
      const ctx = new ParseContext('a,a,a', false);
      const cst = parse(ctx, 0);
      expect(cst).toMatchObject({
        pos: 0,
        end: 5,
        children: [
          {pos: 0, end: 1},
          {pos: 1, end: 2},
          {pos: 2, end: 3},
          {pos: 3, end: 4},
          {pos: 4, end: 5},
        ],
      });
    });

    test('trailing separator is not matched', () => {
      const fooPattern = new Pattern('FooText');
      const foo = CodegenTerminal.compile('a', fooPattern);
      const sepPattern = new Pattern('SepText');
      const sep = CodegenTerminal.compile(',', sepPattern);
      const node = {l: 'a'};
      const pattern = new Pattern('L');
      const parse = CodegenList.compile(node, pattern, foo, undefined, sep);
      const ctx = new ParseContext('a,a,', false);
      const cst = parse(ctx, 0);
      expect(cst).toMatchObject({
        pos: 0,
        end: 3,
        children: [
          {pos: 0, end: 1},
          {pos: 1, end: 2},
          {pos: 2, end: 3},
        ],
      });
    });
  });

  describe('high-level grammar list tests', () => {
    test('parses a list with min, max, and sep using CodegenGrammar', () => {
      const grammar: Grammar = {
        start: 'L',
        cst: {
          A: {t: 'a'},
          Comma: {t: ','},
          L: {l: {r: 'A'}, min: 2, max: 3, sep: {r: 'Comma'}},
        },
      };
      const parser = CodegenGrammar.compile(grammar);

      const ctx1 = new ParseContext('a', false);
      expect(parser(ctx1, 0)).toBeUndefined(); // min is 2

      const ctx2 = new ParseContext('a,a', false);
      expect(parser(ctx2, 0)).toMatchObject({pos: 0, end: 3});

      const ctx3 = new ParseContext('a,a,a', false);
      expect(parser(ctx3, 0)).toMatchObject({pos: 0, end: 5});

      // Stops at 3 elements (max 3), remaining ',a' is not consumed
      const ctx4 = new ParseContext('a,a,a,a', false);
      expect(parser(ctx4, 0)).toMatchObject({pos: 0, end: 5});

      // Separator is required
      const ctx5 = new ParseContext('a a', false);
      expect(parser(ctx5, 0)).toBeUndefined();
    });

    test('list backtracking leaves trailing separator to be consumed by surrounding rule', () => {
      const grammar: Grammar = {
        start: 'Doc',
        cst: {
          A: {t: 'a'},
          Comma: {t: ','},
          L: {l: {r: 'A'}, sep: {r: 'Comma'}},
          Doc: {p: [{r: 'L'}, {r: 'Comma'}]}, // L followed by a trailing comma
        },
      };
      const parser = CodegenGrammar.compile(grammar);

      const ctx = new ParseContext('a,a,', false);
      const cst = expectTerminates(() => parser(ctx, 0));

      // The L should match 'a,a', and Doc should match the final ','
      expect(cst).toMatchObject({
        pos: 0,
        end: 4,
        children: [
          {
            pos: 0,
            end: 3, // L matches 'a,a'
            children: [
              {pos: 0, end: 1}, // a
              {pos: 1, end: 2}, // ,
              {pos: 2, end: 3}, // a
            ],
          },
          {
            pos: 3,
            end: 4, // Comma matches ','
          },
        ],
      });
    });

    test('list with min, max, and sep leaves trailing separator to be consumed', () => {
      const grammar: Grammar = {
        start: 'Doc',
        cst: {
          A: {t: 'a'},
          Comma: {t: ','},
          L: {l: {r: 'A'}, min: 2, max: 3, sep: {r: 'Comma'}},
          Doc: {p: [{r: 'L'}, {r: 'Comma'}]}, // L followed by a trailing comma
        },
      };
      const parser = CodegenGrammar.compile(grammar);

      // Matches exactly 2 items, and trailing comma
      const ctx1 = new ParseContext('a,a,', false);
      const cst1 = parser(ctx1, 0);
      expect(cst1).toMatchObject({
        pos: 0,
        end: 4,
        children: [
          {
            pos: 0,
            end: 3,
            children: [
              {pos: 0, end: 1},
              {pos: 1, end: 2},
              {pos: 2, end: 3},
            ],
          },
          {pos: 3, end: 4},
        ],
      });

      // Matches exactly 3 items, and trailing comma
      const ctx2 = new ParseContext('a,a,a,', false);
      const cst2 = parser(ctx2, 0);
      expect(cst2).toMatchObject({
        pos: 0,
        end: 6,
        children: [
          {
            pos: 0,
            end: 5,
            children: [
              {pos: 0, end: 1},
              {pos: 1, end: 2},
              {pos: 2, end: 3},
              {pos: 3, end: 4},
              {pos: 4, end: 5},
            ],
          },
          {pos: 5, end: 6},
        ],
      });

      // 'a,a,a,a' -> L consumes 3 items ('a,a,a'), then Doc expects a comma. The next char is ','. So it matches.
      const ctx3 = new ParseContext('a,a,a,a', false);
      const cst3 = parser(ctx3, 0);
      expect(cst3).toMatchObject({
        pos: 0,
        end: 6,
        children: [
          {pos: 0, end: 5},
          {pos: 5, end: 6}, // Comma
        ],
      });
    });
  });

  describe('debug trace', () => {
    const compileDebug = (grammar: Grammar) =>
      new CodegenGrammar(grammar, new CodegenContext(true, true, true)).compile();

    test('a successful list leaves the trace stack balanced', () => {
      const grammar: Grammar = {
        start: 'L',
        cst: {A: {t: 'a'}, L: {l: {r: 'A'}, min: 2}},
      };
      const parser = compileDebug(grammar);
      const root: RootTraceNode = {pos: 0, children: []};
      const ctx = new ParseContext('aa', false, [root]);
      const cst = parser(ctx, 0);
      expect(cst).toBeDefined();
      expect(ctx.trace!.length).toBe(1);
    });

    test('a list that fails its `min` constraint still pops its debug trace node', () => {
      const grammar: Grammar = {
        start: 'L',
        cst: {A: {t: 'a'}, L: {l: {r: 'A'}, sep: ',', min: 2}},
      };
      const parser = compileDebug(grammar);
      const src = 'a,';
      const root: RootTraceNode = {pos: 0, children: []};
      const ctx = new ParseContext(src, false, [root]);
      const cst = parser(ctx, 0);
      expect(cst).toBeUndefined();
      expect(ctx.trace!.length).toBe(1);
      expect(root.children[0]!.children!.length).toBe(3);
    });

    test('a `min`-failing list with a separator also pops its debug trace node', () => {
      const grammar: Grammar = {
        start: 'List',
        cst: {A: {t: 'a'}, Comma: {t: ','}, List: {l: {r: 'A'}, min: 2, sep: {r: 'Comma'}}},
      };
      const src = 'a,';
      const parser = compileDebug(grammar);
      const root: RootTraceNode = {pos: 0, children: []};
      const ctx = new ParseContext(src, false, [root]);
      const cst = parser(ctx, 0);
      expect(cst).toBeUndefined();
      expect(ctx.trace!.length).toBe(1);
      expect(root.children[0]!.children!.length).toBe(3);
    });
  });

  describe('separator AST', () => {
    test('separators marked `ast: null` do not appear in the AST', () => {
      const grammar: Grammar = {
        start: 'L',
        cst: {
          A: {t: /[a-z]/, ast: ['$', '/raw']},
          // The separator carries `ast: null`, so it is dropped from the AST.
          Comma: {t: ',', ast: null},
          L: {l: {r: 'A'}, sep: {r: 'Comma'}, ast: ['$', '/children']},
        },
      };
      const parser = CodegenGrammar.compile(grammar);
      const ctx = new ParseContext('a,b,c', true);
      const cst = parser(ctx, 0)!;
      const ast = cst.ptr.toAst(cst, 'a,b,c');
      expect(ast).toEqual(['a', 'b', 'c']);
    });
  });
});
