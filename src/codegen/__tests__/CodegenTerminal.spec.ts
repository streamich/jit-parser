import {LeafCstMatch} from '../../matches';
import {ParseContext} from '../../context';
import {TerminalNode} from '../../types';
import {CodegenTerminal} from '../CodegenTerminal';
import {Pattern} from '../Pattern';

const createPattern = (node: TerminalNode) => {
  const pattern = new Pattern('Text');
  const parser = CodegenTerminal.compile(node, pattern);
  pattern.parser = parser;
  return pattern;
};

describe('CodegenTerminal', () => {
  describe('string', () => {
    test('can match a simple string', () => {
      const terminal = {t: 'foo'};
      const pattern = createPattern(terminal);
      const parser = pattern.parser;
      expect(parser(new ParseContext('bar', false), 0)).toBe(undefined);
      expect(parser(new ParseContext('foo', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('foo', false), 0)).toEqual({
        pos: 0,
        end: 3,
        ptr: pattern,
      });
    });

    test('can match a parent in the middle of text', () => {
      const str = 'var a = (foo) => {};';
      const node = {
        type: 'LeftParen',
        t: '(',
      };
      const pattern = createPattern(node);
      const ctx = new ParseContext(str, false);
      const parser = pattern.parser;
      expect(parser(ctx, 0)).toBe(undefined);
      expect(parser(ctx, 8)).toStrictEqual(new LeafCstMatch(8, 9, pattern));
      expect(parser(ctx, 8)).toEqual({
        pos: 8,
        end: 9,
        ptr: pattern,
      });
    });
  });

  describe('regexp', () => {
    test('can match a simple regexp', () => {
      const node = {
        type: 'Boolean',
        t: /(true|false)/,
      };
      const pattern = createPattern(node);
      const parser = pattern.parser;
      expect(parser(new ParseContext('foo', false), 0)).toBe(undefined);
      expect(parser(new ParseContext('true', false), 0)).toStrictEqual(new LeafCstMatch(0, 4, pattern));
      expect(parser(new ParseContext('a = false', false), 4)).toStrictEqual(new LeafCstMatch(4, 9, pattern));
      expect(parser(new ParseContext('a = false', false), 4)).toEqual({
        pos: 4,
        end: 9,
        ptr: pattern,
      });
    });

    describe('anchoring', () => {
      test('anchors every branch of a top-level alternation', () => {
        // The whole match must start at `pos`. Both branches of the alternation
        // must be anchored, not just the first.
        const node = {type: 'AB', t: /a|b/};
        const pattern = createPattern(node);
        const parser = pattern.parser;
        expect(parser(new ParseContext('abc', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
        expect(parser(new ParseContext('bcd', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
        expect(parser(new ParseContext('xb', false), 0)).toBe(undefined);
        expect(parser(new ParseContext('zzb', false), 0)).toBe(undefined);
      });

      test('a leading-caret source with alternation is still fully anchored', () => {
        const node = {type: 'AB', t: /^a|b/};
        const pattern = createPattern(node);
        const parser = pattern.parser;
        expect(parser(new ParseContext('abc', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
        expect(parser(new ParseContext('bcd', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
        expect(parser(new ParseContext('xb', false), 0)).toBe(undefined);
        expect(parser(new ParseContext('zzb', false), 0)).toBe(undefined);
      });

      test('matches at a non-zero position', () => {
        const node = {type: 'AB', t: /a|b/};
        const pattern = createPattern(node);
        const parser = pattern.parser;
        expect(parser(new ParseContext('xxb', false), 2)).toStrictEqual(new LeafCstMatch(2, 3, pattern));
        expect(parser(new ParseContext('xxb', false), 1)).toBe(undefined);
      });
    });
  });

  describe('{rx} object', () => {
    test('can match using rx object syntax', () => {
      const node = {type: 'Boolean', t: {rx: '(true|false)'}};
      const pattern = createPattern(node);
      const parser = pattern.parser;
      expect(parser(new ParseContext('foo', false), 0)).toBe(undefined);
      expect(parser(new ParseContext('true', false), 0)).toStrictEqual(new LeafCstMatch(0, 4, pattern));
      expect(parser(new ParseContext('a = false', false), 4)).toStrictEqual(new LeafCstMatch(4, 9, pattern));
    });

    test('supports flags via rx object', () => {
      const node = {type: 'Word', t: {rx: '[a-z]+', flags: 'i'}};
      const pattern = createPattern(node);
      const parser = pattern.parser;
      expect(parser(new ParseContext('Hello', false), 0)).toStrictEqual(new LeafCstMatch(0, 5, pattern));
      expect(parser(new ParseContext('WORLD', false), 0)).toStrictEqual(new LeafCstMatch(0, 5, pattern));
      expect(parser(new ParseContext('123', false), 0)).toBe(undefined);
    });

    test('anchors at current position', () => {
      const node = {type: 'Digit', t: {rx: '\\d+'}};
      const pattern = createPattern(node);
      const parser = pattern.parser;
      expect(parser(new ParseContext('abc123', false), 3)).toStrictEqual(new LeafCstMatch(3, 6, pattern));
      expect(parser(new ParseContext('abc123', false), 0)).toBe(undefined);
    });

    test('rx without flags defaults to no flags', () => {
      const node = {type: 'Lower', t: {rx: '[a-z]+'}};
      const pattern = createPattern(node);
      const parser = pattern.parser;
      expect(parser(new ParseContext('abc', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('ABC', false), 0)).toBe(undefined);
    });
  });

  describe('string[]', () => {
    test('can match one of the strings', () => {
      const terminal = {
        t: ['foo', 'bar'],
      };
      const pattern = createPattern(terminal);
      const parser = pattern.parser;
      expect(parser(new ParseContext('bar', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('foo', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(undefined);
    });

    test('can match terminals with repeat', () => {
      const terminal: TerminalNode = {
        t: ['foo', 'bar'],
        repeat: '+',
      };
      const pattern = createPattern(terminal);
      const parser = pattern.parser;
      expect(parser(new ParseContext('bar', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('barbar', false), 0)).toStrictEqual(new LeafCstMatch(0, 6, pattern));
      expect(parser(new ParseContext('foo', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('foobarfoofoobarbar', false), 0)).toStrictEqual(new LeafCstMatch(0, 18, pattern));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(undefined);
    });

    test('can match repeating whitespace', () => {
      const terminal: TerminalNode = {
        t: [' '],
        repeat: '+',
      };
      const pattern = createPattern(terminal);
      const parser = pattern.parser;
      expect(parser(new ParseContext(' ', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
      expect(parser(new ParseContext('  ', false), 0)).toStrictEqual(new LeafCstMatch(0, 2, pattern));
      expect(parser(new ParseContext('   ', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(undefined);
    });

    test('can match repeating union of whitespace chars', () => {
      const terminal: TerminalNode = {
        t: [' ', '\t', '\n'],
        repeat: '+',
      };
      const pattern = createPattern(terminal);
      const parser = pattern.parser;
      expect(parser(new ParseContext(' ', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
      expect(parser(new ParseContext('\n', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
      expect(parser(new ParseContext('\t', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
      expect(parser(new ParseContext('\t\t', false), 0)).toStrictEqual(new LeafCstMatch(0, 2, pattern));
      expect(parser(new ParseContext(' \n\t', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(undefined);
    });

    test('can match repeating union of whitespace chars (allows empty match "*")', () => {
      const terminal: TerminalNode = {
        t: [' ', '\t', '\n'],
        repeat: '*',
      };
      const pattern = createPattern(terminal);
      const parser = pattern.parser;
      expect(parser(new ParseContext(' ', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
      expect(parser(new ParseContext('\n', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
      expect(parser(new ParseContext('\t', false), 0)).toStrictEqual(new LeafCstMatch(0, 1, pattern));
      expect(parser(new ParseContext('\t\t', false), 0)).toStrictEqual(new LeafCstMatch(0, 2, pattern));
      expect(parser(new ParseContext(' \n\t', false), 0)).toStrictEqual(new LeafCstMatch(0, 3, pattern));
      expect(parser(new ParseContext('baz', false), 0)).toStrictEqual(new LeafCstMatch(0, 0, pattern));
    });
  });

  // describe('AST', () => {
  //   test('creates default AST node if ".ast" not prop specified', () => {
  //     const terminal: TerminalNode = {
  //       t: /(true|false)/,
  //     };
  //     const parser = CodegenTerminal.compile(terminal);
  //     const ctx = new ParseContext('true', true);
  //     expect(parser(ctx, 0)!.ast).toEqual({
  //       type: 'Text',
  //       pos: 0,
  //       end: 4,
  //       raw: 'true',
  //     });
  //   });

  //   test('if ".ast" prop set to "null", no AST node is created', () => {
  //     const terminal: TerminalNode = {
  //       t: /(true|false)/,
  //       ast: null,
  //     };
  //     const parser = CodegenTerminal.compile(terminal);
  //     const ctx = new ParseContext('true', true);
  //     expect(parser(ctx, 0)!.ast).toBe(undefined);
  //   });

  //   test('can create an AST node', () => {
  //     const terminal: TerminalNode = {
  //       t: /(true|false)/,
  //       ast: ['+', 2, 2],
  //     };
  //     const parser = CodegenTerminal.compile(terminal);
  //     const ctx = new ParseContext('true', true);
  //     expect(parser(ctx, 0)!.ast).toBe(4);
  //   });

  //   test('can use CSR node to extract information for the AST node', () => {
  //     const terminal: TerminalNode = {
  //       t: /(true|false)/,
  //       ast: [
  //         'o.set',
  //         {},
  //         'type',
  //         'MyNode',
  //         'start',
  //         ['$', '/cst/pos'],
  //         'length',
  //         ['-', ['$', '/cst/end'], ['$', '/cst/pos']],
  //       ],
  //     };
  //     const parser = CodegenTerminal.compile(terminal);
  //     const ctx = new ParseContext('true', true);
  //     expect(parser(ctx, 0)!.ast).toEqual({
  //       type: 'MyNode',
  //       start: 0,
  //       length: 4,
  //     });
  //   });

  //   test('expression can reference the default AST node', () => {
  //     const terminal: TerminalNode = {
  //       t: /(true|false)/,
  //       ast: ['$', '/ast'],
  //     };
  //     const parser = CodegenTerminal.compile(terminal);
  //     const ctx = new ParseContext('true', true);
  //     expect(parser(ctx, 0)!.ast).toEqual({
  //       type: 'Text',
  //       pos: 0,
  //       end: 4,
  //       raw: 'true',
  //     });
  //   });

  //   test('can overwrite props of default AST node', () => {
  //     const terminal: TerminalNode = {
  //       t: /(true|false)/,
  //       ast: ['o.set', ['$', '/ast'], 'type', 'Boolean'],
  //     };
  //     const parser = CodegenTerminal.compile(terminal);
  //     const ctx = new ParseContext('true', true);
  //     expect(parser(ctx, 0)!.ast).toEqual({
  //       type: 'Boolean',
  //       pos: 0,
  //       end: 4,
  //       raw: 'true',
  //     });
  //   });
  // });
});
