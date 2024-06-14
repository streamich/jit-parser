import {RegExpTerminalMatch, StringTerminalMatch} from '../../matches';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenTerminal', () => {
  describe('string', () => {
    test('can match a simple string', () => {
      const terminal = 'foo';
      const parser = CodegenTerminal.compile(terminal);
      expect(parser('bar', 0)).toBe(undefined);
      expect(parser('foo', 0)).toStrictEqual(new StringTerminalMatch('Text', 0, 3, 'foo'));
      // console.log(parser.toString());
    });

    test('can match a parent in the middle of text', () => {
      const str = 'var a = (foo) => {};';
      const terminal = '(';
      const parser = CodegenTerminal.compile(terminal, 'LeftParen');
      expect(parser(str, 0)).toBe(undefined);
      expect(parser(str, 8)).toStrictEqual(new StringTerminalMatch('LeftParen', 8, 9, '('));
      // console.log(parser.toString());
    });
  });

  describe('regexp', () => {
    test('can match a simple regexp', () => {
      const terminal = /(true|false)/;
      const parser = CodegenTerminal.compile(terminal, 'Boolean');
      expect(parser('foo', 0)).toBe(undefined);
      expect(parser('true', 0)).toStrictEqual(new RegExpTerminalMatch('Boolean', 0, 4));
      expect(parser('a = false', 4)).toStrictEqual(new RegExpTerminalMatch('Boolean', 4, 9));
      // console.log(parser.toString());
    });
  });
});
