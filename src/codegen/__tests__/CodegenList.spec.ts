import {ParseContext} from '../../context';
import {CodegenList} from '../CodegenList';
import {CodegenTerminal} from '../CodegenTerminal';
import {Pattern} from '../Pattern';

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
});
