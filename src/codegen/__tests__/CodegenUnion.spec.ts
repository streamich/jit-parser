import {UnionNode} from '../../types';
import {CodegenUnion} from '../CodegenUnion';
import {CodegenTerminal} from '../CodegenTerminal';
import {ParseContext} from '../../context';

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
      pos: 1,
      end: 4,
      src: union,
      children: [
        {
          pos: 1,
          end: 4,
          src: {t: 'foo'},
        },
      ],
    });
    const ctx2 = new ParseContext('bar', false);
    expect(parse(ctx2, 0)).toMatchObject({
      pos: 0,
      end: 3,
      src: union,
      children: [
        {
          pos: 0,
          end: 3,
          src: {t: 'bar'},
        },
      ],
    });
  });

  // describe('AST', () => {
  //   test('can create an AST node', () => {
  //     const foo = CodegenTerminal.compile('foo');
  //     const bar = CodegenTerminal.compile('bar');
  //     const node = {
  //       u: ['foo', 'bar'],
  //       ast: ['.', 'a', 'bc'],
  //     };
  //     const parse = CodegenUnion.compile(node, [foo, bar]);
  //     const ctx = new ParseContext('.foo', true);
  //     const cst = parse(ctx, 1)!;
  //     expect(cst.ast).toBe('abc');
  //   });
  // });
});
