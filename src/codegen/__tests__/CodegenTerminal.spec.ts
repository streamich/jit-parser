import {LeafCsrMatch} from '../../matches';
import {CodegenContext, ParseContext} from '../../context';
import {TerminalNode} from '../../types';
import {CodegenTerminal} from '../CodegenTerminal';

const ctx = new CodegenContext(true, false);

describe('CodegenTerminal', () => {
  describe('string', () => {
    test('can match a simple string', () => {
      const terminal = 'foo';
      const parser = CodegenTerminal.compile(terminal);
      expect(parser(new ParseContext('bar', false), 0)).toBe(undefined);
      expect(parser(new ParseContext('foo', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, 'foo'));
      expect(parser(new ParseContext('foo', false), 0)).toEqual({
        type: 'Text',
        pos: 0,
        end: 3,
        raw: 'foo',
      });
      // console.log(parser.toString());
    });

    test('can match a parent in the middle of text', () => {
      const str = 'var a = (foo) => {};';
      const parser = CodegenTerminal.compile({
        type: 'LeftParen',
        t: '(',
      });
      const ctx = new ParseContext(str, false);
      expect(parser(ctx, 0)).toBe(undefined);
      expect(parser(ctx, 8)).toStrictEqual(new LeafCsrMatch('LeftParen', 8, 9, '('));
      expect(parser(ctx, 8)).toEqual({
        type: 'LeftParen',
        pos: 8,
        end: 9,
        raw: '(',
      });
      // console.log(parser.toString());
    });

    test('does not generate AST by default', () => {
      const terminal = 'foo';
      const parser = CodegenTerminal.compile(terminal);
      expect(parser(new ParseContext('foo', false), 0)!.ast).toBe(undefined);
    });
  });

  describe('regexp', () => {
    test('can match a simple regexp', () => {
      const parser = CodegenTerminal.compile({
        type: 'Boolean',
        t: /(true|false)/,
      });
      expect(parser(new ParseContext('foo', false), 0)).toBe(undefined);
      expect(parser(new ParseContext('true', false), 0)).toStrictEqual(new LeafCsrMatch('Boolean', 0, 4, 'true'));
      expect(parser(new ParseContext('a = false', false), 4)).toStrictEqual(new LeafCsrMatch('Boolean', 4, 9, 'false'));
      expect(parser(new ParseContext('a = false', false), 4)).toEqual({
        type: 'Boolean',
        pos: 4,
        end: 9,
        raw: 'false',
      });
      // console.log(parser.toString());
    });
  });

  describe('string[]', () => {
    test('can match one of the strings', () => {
      const terminal = {
        t: ['foo', 'bar']
      }
      const parser = CodegenTerminal.compile(terminal);
      expect(parser(new ParseContext('bar', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, 'bar'));
      expect(parser(new ParseContext('foo', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, 'foo'));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(undefined);
    });

    test('can match terminals with repeat', () => {
      const terminal: TerminalNode = {
        t: ['foo', 'bar'],
        repeat: '+',
      }
      const parser = CodegenTerminal.compile(terminal);
      // console.log(parser.toString());
      expect(parser(new ParseContext('bar', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, 'bar'));
      expect(parser(new ParseContext('barbar', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 6, 'barbar'));
      expect(parser(new ParseContext('foo', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, 'foo'));
      expect(parser(new ParseContext('foobarfoofoobarbar', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 18, 'foobarfoofoobarbar'));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(undefined);
    });

    test('can match repeating whitespace', () => {
      const terminal: TerminalNode = {
        t: [' '],
        repeat: '+',
      }
      const parser = CodegenTerminal.compile(terminal);
      // console.log(parser.toString());
      expect(parser(new ParseContext(' ', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 1, ' '));
      expect(parser(new ParseContext('  ', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 2, '  '));
      expect(parser(new ParseContext('   ', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, '   '));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(undefined);
    });

    test('can match repeating union of whitespace chars', () => {
      const terminal: TerminalNode = {
        t: [' ', '\t', '\n'],
        repeat: '+',
      }
      const parser = CodegenTerminal.compile(terminal);
      // console.log(parser.toString());
      expect(parser(new ParseContext(' ', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 1, ' '));
      expect(parser(new ParseContext('\n', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 1, '\n'));
      expect(parser(new ParseContext('\t', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 1, '\t'));
      expect(parser(new ParseContext('\t\t', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 2, '\t\t'));
      expect(parser(new ParseContext(' \n\t', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, ' \n\t'));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(undefined);
    });

    test('can match repeating union of whitespace chars (allows empty match "*")', () => {
      const terminal: TerminalNode = {
        t: [' ', '\t', '\n'],
        repeat: '*',
      }
      const parser = CodegenTerminal.compile(terminal);
      expect(parser(new ParseContext(' ', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 1, ' '));
      expect(parser(new ParseContext('\n', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 1, '\n'));
      expect(parser(new ParseContext('\t', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 1, '\t'));
      expect(parser(new ParseContext('\t\t', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 2, '\t\t'));
      expect(parser(new ParseContext(' \n\t', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 3, ' \n\t'));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(new LeafCsrMatch('Text', 0, 0, ''));
    });
  });

  describe('AST', () => {
    test('creates default AST node if ".ast" not prop specified', () => {
      const terminal: TerminalNode = {
        t: /(true|false)/,
      };
      const parser = CodegenTerminal.compile(terminal);
      const ctx = new ParseContext('true', true);
      expect(parser(ctx, 0)!.ast).toEqual({
        type: 'Text',
        pos: 0,
        end: 4,
        raw: 'true',
      });
    });

    test('if ".ast" prop set to "null", no AST node is created', () => {
      const terminal: TerminalNode = {
        t: /(true|false)/,
        ast: null,
      };
      const parser = CodegenTerminal.compile(terminal);
      const ctx = new ParseContext('true', true);
      expect(parser(ctx, 0)!.ast).toBe(undefined);
    });

    test('can create an AST node', () => {
      const terminal: TerminalNode = {
        t: /(true|false)/,
        ast: ['+', 2, 2],
      };
      const parser = CodegenTerminal.compile(terminal);
      const ctx = new ParseContext('true', true);
      expect(parser(ctx, 0)!.ast).toBe(4);
    });

    test('can use CSR node to extract information for the AST node', () => {
      const terminal: TerminalNode = {
        t: /(true|false)/,
        ast: [
          'o.set',
          {},
          'type',
          'MyNode',
          'start',
          ['$', '/cst/pos'],
          'length',
          ['-', ['$', '/cst/end'], ['$', '/cst/pos']],
        ],
      };
      const parser = CodegenTerminal.compile(terminal);
      const ctx = new ParseContext('true', true);
      expect(parser(ctx, 0)!.ast).toEqual({
        type: 'MyNode',
        start: 0,
        length: 4,
      });
    });

    test('expression can reference the default AST node', () => {
      const terminal: TerminalNode = {
        t: /(true|false)/,
        ast: ['$', '/ast'],
      };
      const parser = CodegenTerminal.compile(terminal);
      const ctx = new ParseContext('true', true);
      expect(parser(ctx, 0)!.ast).toEqual({
        type: 'Text',
        pos: 0,
        end: 4,
        raw: 'true',
      });
    });

    test('can overwrite props of default AST node', () => {
      const terminal: TerminalNode = {
        t: /(true|false)/,
        ast: ['o.set', ['$', '/ast'], 'type', 'Boolean'],
      };
      const parser = CodegenTerminal.compile(terminal);
      const ctx = new ParseContext('true', true);
      expect(parser(ctx, 0)!.ast).toEqual({
        type: 'Boolean',
        pos: 0,
        end: 4,
        raw: 'true',
      });
    });
  });
});
