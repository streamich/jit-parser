import {UnionNode} from '../../types';
import {CodegenUnion} from '../CodegenUnion';
import {CodegenTerminal} from '../CodegenTerminal';
import {ParseContext} from '../../ParseContext';

describe('CodegenUnion', () => {
  test('can parse a simple rule', () => {
    const union: UnionNode = {
      u: ['foo', 'bar'],
      type: 'FooOrBar',
    };
    const foo = CodegenTerminal.compile('foo');
    const bar = CodegenTerminal.compile('bar');
    const parse = CodegenUnion.compile(union, [foo, bar]);
    const ctx = new ParseContext('.foo', false);
    expect(parse(ctx, 1)).toMatchObject({
      type: 'FooOrBar',
      pos: 1,
      end: 4,
      children: [
        {
          type: 'Text',
          pos: 1,
          end: 4,
          raw: 'foo',
        },
      ],
    });
    const ctx2 = new ParseContext('bar', false);
    expect(parse(ctx2, 0)).toMatchObject({
      type: 'FooOrBar',
      pos: 0,
      end: 3,
      children: [
        {
          type: 'Text',
          pos: 0,
          end: 3,
          raw: 'bar',
        },
      ],
    });
  });

  describe('AST', () => {
    test('can create an AST node', () => {
      const foo = CodegenTerminal.compile('foo');
      const bar = CodegenTerminal.compile('bar');
      const node = {
        u: ['foo', 'bar'],
        ast: ['.', 'a', 'bc'],
      };
      const parse = CodegenUnion.compile(node, [foo, bar]);
      const ctx = new ParseContext('.foo', true);
      const cst = parse(ctx, 1)!;
      expect(cst.ast).toBe('abc');
    });
  });
});
