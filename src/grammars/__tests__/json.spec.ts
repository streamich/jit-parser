import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {ParseContext} from '../../ParseContext';
import {grammar} from '../json';

const codegen = new CodegenGrammar(grammar);

const toAst = (src: string) => {
  const parser = codegen.compile();
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  return cst.ast;
};

const toAstRule = (rule: string, src: string) => {
  const parser = codegen.compileRule(rule);
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  return cst.ast;
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
        value: true,
      });
      expect(toAst(' false')).toEqual({
        type: 'Boolean',
        pos: 1,
        end: 6,
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
        value: '',
      });
      expect(toAst('"abc"')).toEqual({
        type: 'String',
        pos: 0,
        end: 5,
        value: 'abc',
      });
    });

    describe('arrays', () => {
      test('can parse array elements', () => {
        const ast = toAstRule('Elements', '1,2,3');
        expect(ast).toEqual({
          type: 'Elements',
          pos: 0,
          end: 5,
          children: [
            {
              type: 'Number',
              pos: 0,
              end: 1,
              raw: '1',
              value: 1,
            },
            {
              type: 'Number',
              pos: 2,
              end: 3,
              raw: '2',
              value: 2,
            },
            {
              type: 'Number',
              pos: 4,
              end: 5,
              raw: '3',
              value: 3,
            },
          ],
        });
      });
    });
  });
});
