import {CodegenProduction} from '../CodegenProduction';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenProduction', () => {
  test('can parse a simple production', () => {
    const foo = CodegenTerminal.compile('foo');
    const bar = CodegenTerminal.compile('bar');
    const parse = CodegenProduction.compile([foo, bar]);
    expect(parse('foobar', 0)).toEqual([
      {end: 3, kind: 'Text', pos: 0, text: 'foo'},
      {end: 6, kind: 'Text', pos: 3, text: 'bar'},
    ]);
  });
});
