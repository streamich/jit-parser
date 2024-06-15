import {Rule} from '../../types';
import {CodegenRule} from '../CodegenRule';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenRule', () => {
  test('can parse a simple rule', () => {
    const rule: Rule = {
      match: ['foo', 'bar'],
    };
    const foo = CodegenTerminal.compile('foo');
    const bar = CodegenTerminal.compile('bar');
    const parse = CodegenRule.compile('FooOrBar', rule, [foo, bar]);
    expect(parse('.foo', 1)).toEqual({
      kind: 'FooOrBar',
      pos: 1,
      end: 4,
      children: [{end: 4, kind: 'Text', pos: 1, text: 'foo'}],
    });
    expect(parse('bar', 0)).toEqual({
      kind: 'FooOrBar',
      pos: 0,
      end: 3,
      children: [{end: 3, kind: 'Text', pos: 0, text: 'bar'}],
    });
  });
});
