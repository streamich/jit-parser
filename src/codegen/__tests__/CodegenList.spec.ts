import {ParseContext} from '../../context';
import {CodegenList} from '../CodegenList';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenList', () => {
  test('can parse a simple production', () => {
    const foo = CodegenTerminal.compile('ab');
    const node = {l: 'ab'};
    const parse = CodegenList.compile(node, foo);
    const ctx = new ParseContext('abab', false);
    const cst = parse(ctx, 0);
    expect(cst).toMatchObject({
      pos: 0,
      end: 4,
      src: node,
      children: [
        {pos: 0, end: 2, src: {t: 'ab'}},
        {pos: 2, end: 4, src: {t: 'ab'}},
      ],
    });
  });
});
