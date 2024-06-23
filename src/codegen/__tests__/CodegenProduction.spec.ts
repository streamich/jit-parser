import {ParseContext} from '../../context';
import {CodegenProduction} from '../CodegenProduction';
import {CodegenTerminal} from '../CodegenTerminal';
import {Pattern} from '../Pattern';

describe('CodegenProduction', () => {
  test('can parse a simple production', () => {
    const fooPattern = new Pattern('FooText');
    const foo = CodegenTerminal.compile('foo', fooPattern);
    const barPattern = new Pattern('BarText');
    const bar = CodegenTerminal.compile('bar', barPattern);
    const node = {p: ['foo', 'bar']};
    const pattern = new Pattern('Prod');
    const parse = CodegenProduction.compile(node, pattern, [foo, bar]);
    const ctx = new ParseContext('foobar', false);
    expect(parse(ctx, 0)).toMatchObject({
      pos: 0,
      end: 6,
      ptr: {
        type: 'Prod',
      },
      children: [
        {pos: 0, end: 3, ptr: {type: 'FooText'}},
        {pos: 3, end: 6, ptr: {type: 'BarText'}},
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
