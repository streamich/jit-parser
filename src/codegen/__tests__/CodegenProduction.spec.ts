import {ParseContext} from '../../ParseContext';
import {CodegenProduction} from '../CodegenProduction';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenProduction', () => {
  test('can parse a simple production', () => {
    const foo = CodegenTerminal.compile('foo');
    const bar = CodegenTerminal.compile('bar');
    const parse = CodegenProduction.compile(['foo', 'bar'], [foo, bar]);
    const ctx = new ParseContext('foobar', false);
    expect(parse(ctx, 0)).toMatchObject({
      type: 'Production',
      pos: 0,
      end: 6,
      children: [
        {type: 'Text', pos: 0, end: 3, raw: 'foo'},
        {type: 'Text', pos: 3, end: 6, raw: 'bar'},
      ],
    });
  });

  describe('AST', () => {
    test('can create an AST node', () => {
      const foo = CodegenTerminal.compile('foo');
      const bar = CodegenTerminal.compile('bar');
      const parse = CodegenProduction.compile({
        p: ['foo', 'bar'],
        ast: ['.', 'a', 'bc']
      }, [foo, bar]);
      const ctx = new ParseContext('foobar', true);
      const cst = parse(ctx, 0)!;
      expect(cst.ast).toBe('abc');
    });
  });
});
