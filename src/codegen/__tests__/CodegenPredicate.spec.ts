import {ParseContext} from '../../context';
import {CodegenGrammar} from '../CodegenGrammar';
import {CodegenPredicate} from '../CodegenPredicate';
import {CodegenTerminal} from '../CodegenTerminal';
import {Pattern} from '../Pattern';
import type {Grammar} from '../../types';

const notFoo = () => {
  const child = CodegenTerminal.compile('foo', new Pattern('Foo'));
  return CodegenPredicate.compile({not: 'foo'}, new Pattern('NotFoo'), child);
};

describe('CodegenPredicate', () => {
  test('negative lookahead succeeds with a zero-width match when the inner node does not match', () => {
    const parse = notFoo();
    expect(parse(new ParseContext('bar', false), 0)).toMatchObject({pos: 0, end: 0});
  });

  test('negative lookahead fails when the inner node matches', () => {
    const parse = notFoo();
    expect(parse(new ParseContext('foo', false), 0)).toBeUndefined();
  });

  test('consumes no input (end === pos), including at a non-zero position', () => {
    const parse = notFoo();
    expect(parse(new ParseContext('foo bar', false), 4)).toMatchObject({pos: 4, end: 4});
    expect(parse(new ParseContext('foo bar', false), 0)).toBeUndefined();
  });
});

describe('predicate inside a grammar', () => {
  test('negative lookahead enforces a keyword boundary (null vs nullish)', () => {
    const grammar: Grammar = {
      start: 'Kw',
      cst: {
        Kw: {p: ['null', {not: /[a-zA-Z0-9_]/}]},
      },
    };
    const parser = CodegenGrammar.compile(grammar);
    expect(parser(new ParseContext('null', false), 0)).toMatchObject({pos: 0, end: 4});
    expect(parser(new ParseContext('null!', false), 0)).toMatchObject({pos: 0, end: 4});
    expect(parser(new ParseContext('null ', false), 0)).toMatchObject({pos: 0, end: 4});
    expect(parser(new ParseContext('nullish', false), 0)).toBeUndefined();
    expect(parser(new ParseContext('null_x', false), 0)).toBeUndefined();
  });

  test('"not any character" (!.) enforces end-of-input', () => {
    const grammar: Grammar = {
      start: 'Doc',
      cst: {
        Doc: {p: [{r: 'Num'}, {not: /[\s\S]/}]},
        Num: /\d+/,
      },
    };
    const parser = CodegenGrammar.compile(grammar);
    expect(parser(new ParseContext('123', false), 0)).toMatchObject({pos: 0, end: 3});
    expect(parser(new ParseContext('123x', false), 0)).toBeUndefined();
  });

  test('positive lookahead {and} (sugar for !!) asserts without consuming', () => {
    const grammar: Grammar = {
      start: 'Doc',
      cst: {
        Doc: {p: [{and: '9'}, {r: 'Num'}]},
        Num: /\d+/,
      },
    };
    const parser = CodegenGrammar.compile(grammar);
    expect(parser(new ParseContext('911', false), 0)).toMatchObject({pos: 0, end: 3});
    expect(parser(new ParseContext('123', false), 0)).toBeUndefined();
  });

  test('a predicate contributes no AST node', () => {
    const grammar: Grammar = {
      start: 'Kw',
      cst: {
        Kw: {p: ['null', {not: /[a-zA-Z0-9_]/}]},
      },
    };
    const parser = CodegenGrammar.compile(grammar);
    const ctx = new ParseContext('null', true);
    const cst = parser(ctx, 0)!;
    const ast = cst.ptr.toAst(cst, 'null') as {type: string; children: unknown[]};
    expect(ast.type).toBe('Kw');
    expect(ast.children).toEqual([]);
  });
});
