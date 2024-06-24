import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {ParseContext} from '../../context';
import {grammar} from '../json';

const codegen = new CodegenGrammar(grammar);

const toAst = (src: string) => {
  const parser = codegen.compile();
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  const ast = cst.ptr.toAst(cst, src);
  return ast;
};

const toAstRule = (rule: string, src: string) => {
  const pattern = codegen.compileRule(rule);
  const ctx = new ParseContext(src, true);
  const cst = pattern.parser(ctx, 0)!;
  const ast = cst.ptr.toAst(cst, src);
  return ast;
};

describe('AST', () => {
  describe('literals', () => {
    test('can parse "null"', () => {
      expect(toAst(' null  ')).toEqual({
        type: 'Null',
        pos: 1,
        end: 5,
        raw: 'null',
      });
    });

    test('can parse booleans', () => {
      expect(toAst('true')).toEqual({
        type: 'Boolean',
        pos: 0,
        end: 4,
        raw: 'true',
        value: true,
      });
      expect(toAst(' false')).toEqual({
        type: 'Boolean',
        pos: 1,
        end: 6,
        raw: 'false',
        value: false,
      });
    });

    test('can parse numbers', () => {
      expect(toAst('123')).toEqual({
        type: 'Number',
        pos: 0,
        end: 3,
        raw: '123',
        value: 123,
      });
      expect(toAst(' -1.123')).toEqual({
        type: 'Number',
        pos: 1,
        end: 7,
        raw: '-1.123',
        value: -1.123,
      });
      expect(toAst(' 0')).toEqual({
        type: 'Number',
        pos: 1,
        end: 2,
        raw: '0',
        value: 0,
      });
    });

    test('can parse strings', () => {
      expect(toAst('""')).toEqual({
        type: 'String',
        pos: 0,
        end: 2,
        raw: '""',
        value: '',
      });
      expect(toAst('"abc"')).toEqual({
        type: 'String',
        pos: 0,
        end: 5,
        raw: '"abc"',
        value: 'abc',
      });
    });

    describe('arrays', () => {
      test('can parse an empty array', () => {
        const ast = toAst('[]');
        expect(ast).toEqual({
          type: 'Array',
          pos: 0,
          end: 2,
          children: [],
        });
      });

      test('can parse an empty array with whitespace', () => {
        const ast = toAst(' [  ] ');
        expect(ast).toEqual({
          type: 'Array',
          pos: 1,
          end: 5,
          children: [],
        });
      });

      test('can parse a single element array', () => {
        const ast = toAst('[true]');
        expect(ast).toEqual({
          type: 'Array',
          pos: 0,
          end: 6,
          children: [
            {
              type: 'Boolean',
              pos: 1,
              end: 5,
              raw: 'true',
              value: true,
            },
          ],
        });
      });

      test('can multiple element array array', () => {
        const ast = toAst('[ 1, 2, 3 ]');
        expect(ast).toEqual({
          type: 'Array',
          pos: 0,
          end: 11,
          children: [
            {
              type: 'Number',
              pos: 2,
              end: 3,
              raw: '1',
              value: 1,
            },
            {
              type: 'Number',
              pos: 5,
              end: 6,
              raw: '2',
              value: 2,
            },
            {
              type: 'Number',
              pos: 8,
              end: 9,
              raw: '3',
              value: 3,
            },
          ],
        });
      });

      test('can parse nested arrays', () => {
        const ast = toAst('[[true], 1, [1, [2], [[3]]]]');
        expect(ast).toEqual({
          type: 'Array',
          pos: 0,
          end: 28,
          children: [
            {
              type: 'Array',
              pos: 1,
              end: 7,
              children: [
                {
                  type: 'Boolean',
                  pos: 2,
                  end: 6,
                  raw: 'true',
                  value: true,
                },
              ],
            },
            {
              type: 'Number',
              pos: 9,
              end: 10,
              raw: '1',
              value: 1,
            },
            {
              type: 'Array',
              pos: 12,
              end: 27,
              children: [
                {
                  type: 'Number',
                  pos: 13,
                  end: 14,
                  raw: '1',
                  value: 1,
                },
                {
                  type: 'Array',
                  pos: 16,
                  end: 19,
                  children: [
                    {
                      type: 'Number',
                      pos: 17,
                      end: 18,
                      raw: '2',
                      value: 2,
                    },
                  ],
                },
                {
                  type: 'Array',
                  pos: 21,
                  end: 26,
                  children: [
                    {
                      type: 'Array',
                      pos: 22,
                      end: 25,
                      children: [
                        {
                          type: 'Number',
                          pos: 23,
                          end: 24,
                          raw: '3',
                          value: 3,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('objects', () => {
      test('can parse empty object', () => {
        const ast = toAst('{}');
        expect(ast).toEqual({
          type: 'Object',
          pos: 0,
          end: 2,
          children: [],
        });
      });

      test('can parse empty with spaces', () => {
        const ast = toAst(' { } ');
        expect(ast).toEqual({
          type: 'Object',
          pos: 1,
          end: 4,
          children: [],
        });
      });

      test('can parse an object with one key', () => {
        const ast = toAst('{"a":1}');
        expect(ast).toEqual({
          type: 'Object',
          pos: 0,
          end: 7,
          children: [
            {
              type: 'Entry',
              pos: 1,
              end: 6,
              key: {
                type: 'String',
                pos: 1,
                end: 4,
                raw: '"a"',
                value: 'a',
              },
              value: {
                type: 'Number',
                pos: 5,
                end: 6,
                raw: '1',
                value: 1,
              },
            },
          ],
        });
      });

      test('can parse an object with one key and whitespace', () => {
        const ast = toAst(' { "a" : 1 } ');
        expect(ast).toEqual({
          type: 'Object',
          pos: 1,
          end: 12,
          children: [
            {
              type: 'Entry',
              pos: 2,
              end: 11,
              key: {
                type: 'String',
                pos: 3,
                end: 6,
                raw: '"a"',
                value: 'a',
              },
              value: {
                type: 'Number',
                pos: 9,
                end: 10,
                raw: '1',
                value: 1,
              },
            },
          ],
        });
      });

      test('can parse an object with two keys and whitespace', () => {
        const ast = toAst(' { "a" : 1, "b" : 2 } ');
        expect(ast).toEqual({
          type: 'Object',
          pos: 1,
          end: 21,
          children: [
            {
              type: 'Entry',
              pos: 2,
              end: 10,
              key: {
                type: 'String',
                pos: 3,
                end: 6,
                raw: '"a"',
                value: 'a',
              },
              value: {
                type: 'Number',
                pos: 9,
                end: 10,
                raw: '1',
                value: 1,
              },
            },
            {
              type: 'Entry',
              pos: 11,
              end: 20,
              key: {
                type: 'String',
                pos: 12,
                end: 15,
                raw: '"b"',
                value: 'b',
              },
              value: {
                type: 'Number',
                pos: 18,
                end: 19,
                raw: '2',
                value: 2,
              },
            },
          ],
        });
      });

      test('can parse an object with three keys', () => {
        const ast = toAst(' {"a": 1, "b": 2, "c": 3} ');
        expect(ast).toEqual({
          type: 'Object',
          pos: 1,
          end: 25,
          children: [
            {
              type: 'Entry',
              pos: 2,
              end: 8,
              key: {
                type: 'String',
                pos: 2,
                end: 5,
                raw: '"a"',
                value: 'a',
              },
              value: {
                type: 'Number',
                pos: 7,
                end: 8,
                raw: '1',
                value: 1,
              },
            },
            {
              type: 'Entry',
              pos: 9,
              end: 16,
              key: {
                type: 'String',
                pos: 10,
                end: 13,
                raw: '"b"',
                value: 'b',
              },
              value: {
                type: 'Number',
                pos: 15,
                end: 16,
                raw: '2',
                value: 2,
              },
            },
            {
              type: 'Entry',
              pos: 17,
              end: 24,
              key: {
                type: 'String',
                pos: 18,
                end: 21,
                raw: '"c"',
                value: 'c',
              },
              value: {
                type: 'Number',
                pos: 23,
                end: 24,
                raw: '3',
                value: 3,
              },
            },
          ],
        });
      });

      test('can parse nested objects', () => {
        const ast = toAst('{"foo": {"bar": 1}, "baz": 2}');
        expect(ast).toEqual({
          type: 'Object',
          pos: 0,
          end: 29,
          children: [
            {
              type: 'Entry',
              pos: 1,
              end: 18,
              key: {
                type: 'String',
                pos: 1,
                end: 6,
                raw: '"foo"',
                value: 'foo',
              },
              value: {
                type: 'Object',
                pos: 8,
                end: 18,
                children: [
                  {
                    type: 'Entry',
                    pos: 9,
                    end: 17,
                    key: {
                      type: 'String',
                      pos: 9,
                      end: 14,
                      raw: '"bar"',
                      value: 'bar',
                    },
                    value: {
                      type: 'Number',
                      pos: 16,
                      end: 17,
                      raw: '1',
                      value: 1,
                    },
                  },
                ],
              },
            },
            {
              type: 'Entry',
              pos: 19,
              end: 28,
              key: {
                type: 'String',
                pos: 20,
                end: 25,
                raw: '"baz"',
                value: 'baz',
              },
              value: {
                type: 'Number',
                pos: 27,
                end: 28,
                raw: '2',
                value: 2,
              },
            },
          ],
        });
      });
    });
  });
});
