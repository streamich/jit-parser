import {ParseContext} from '../../ParseContext';
import {CodegenList} from '../CodegenList';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenList', () => {
  test('can parse a simple production', () => {
    const foo = CodegenTerminal.compile('ab');
    const parse = CodegenList.compile({l: 'ab'}, foo);
    const ctx = new ParseContext('abab', false);
    const cst = parse(ctx, 0);
    expect(cst).toMatchObject({
      type: 'List',
      pos: 0,
      end: 4,
      children: [
        {type: 'Text', pos: 0, end: 2, raw: 'ab'},
        {type: 'Text', pos: 2, end: 4, raw: 'ab'},
      ],
    });
  });
});
