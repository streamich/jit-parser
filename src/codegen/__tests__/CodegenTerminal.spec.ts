import {StringTerminalMatch} from '../../matches';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenTerminal', () => {
  test('can match a simple string', () => {
    const terminal = 'foo';
    const parser = CodegenTerminal.compile(terminal);
    expect(parser('bar', 0)).toBe(undefined);
    expect(parser('foo', 0)).toStrictEqual(new StringTerminalMatch('$Terminal', 0, 3, 'foo'));
    console.log(parser.toString());
  });

  test('can match a parent in the middle of text', () => {
    const str = 'var a = (foo) => {};';
    const terminal = '(';
    const parser = CodegenTerminal.compile(terminal, 'LeftParen');
    expect(parser(str, 0)).toBe(undefined);
    expect(parser(str, 8)).toStrictEqual(new StringTerminalMatch('LeftParen', 8, 9, '('));
    console.log(parser.toString());
  });
});
