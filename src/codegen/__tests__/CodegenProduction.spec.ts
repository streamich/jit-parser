import {ParseContext} from '../../context';
import {CodegenProduction} from '../CodegenProduction';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenProduction', () => {
  test('can parse a simple production', () => {
    const foo = CodegenTerminal.compile('foo');
    const bar = CodegenTerminal.compile('bar');
    const node = {p: ['foo', 'bar']};
    const parse = CodegenProduction.compile(node, [foo, bar]);
    const ctx = new ParseContext('foobar', false);
    expect(parse(ctx, 0)).toMatchObject({
      pos: 0,
      end: 6,
      src: node,
      children: [
        {pos: 0, end: 3, src: {t: 'foo'}},
        {pos: 3, end: 6, src: {t: 'bar'}},
      ],
    });
  });

  // describe('AST', () => {
  //   test('can create an AST node', () => {
  //     const foo = CodegenTerminal.compile('foo');
  //     const bar = CodegenTerminal.compile('bar');
  //     const parse = CodegenProduction.compile(
  //       {
  //         p: ['foo', 'bar'],
  //         ast: ['.', 'a', 'bc'],
  //       },
  //       [foo, bar],
  //     );
  //     const ctx = new ParseContext('foobar', true);
  //     const cst = parse(ctx, 0)!;
  //     expect(cst.ast).toBe('abc');
  //   });
  // });
});
