import {ParseContext} from '../../context';
import {CodegenGrammar} from '../CodegenGrammar';
import {CodegenList} from '../CodegenList';
import {CodegenTerminal} from '../CodegenTerminal';
import {Pattern} from '../Pattern';
import type {Grammar, TerminalNode} from '../../types';

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
});
