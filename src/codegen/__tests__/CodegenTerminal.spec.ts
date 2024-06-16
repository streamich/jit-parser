import {LeafCsrMatch} from '../../matches';
import {ParseContext} from '../../ParseContext';
import {CodegenTerminal} from '../CodegenTerminal';

describe('CodegenTerminal', () => {
  describe('string', () => {
    test('can match a simple string', () => {
      const terminal = 'foo';
      const parser = CodegenTerminal.compile(terminal);
      expect(parser(new ParseContext('bar', false), 0)).toBe(undefined);
      expect(parser(new ParseContext('foo', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, 'foo'));
      // console.log(parser.toString());
    });

    test('can match a parent in the middle of text', () => {
      const str = 'var a = (foo) => {};';
      const terminal = '(';
      const parser = CodegenTerminal.compile(terminal, 'LeftParen');
      const ctx = new ParseContext(str, false);
      expect(parser(ctx, 0)).toBe(undefined);
      expect(parser(ctx, 8)).toStrictEqual(new LeafCsrMatch('LeftParen', 8, 9, '('));
      // console.log(parser.toString());
    });
  });

  describe('regexp', () => {
    test('can match a simple regexp', () => {
      const terminal = /(true|false)/;
      const parser = CodegenTerminal.compile(terminal, 'Boolean');
      expect(parser(new ParseContext('foo', false), 0)).toBe(undefined);
      expect(parser(new ParseContext('true', false), 0)).toStrictEqual(new LeafCsrMatch('Boolean', 0, 4, 'true'));
      expect(parser(new ParseContext('a = false', false), 4)).toStrictEqual(new LeafCsrMatch('Boolean', 4, 9, 'false'));
      // console.log(parser.toString());
    });
  });
});
