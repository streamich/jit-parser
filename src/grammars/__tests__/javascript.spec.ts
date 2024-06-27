import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../../context';
import {grammar} from '../javascript';

const ctx = new CodegenContext(false, true);
const codegen = new CodegenGrammar(grammar, ctx);
const parser = codegen.compile();

const toAst = (src: string) => {
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  return cst?.ptr.toAst(cst, src);
};

const toAstStatement = (src: string) => {
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  const ast = cst?.ptr.toAst(cst, src);
  return (ast as any)?.body[0];
};

const toAstRule = (rule: string, src: string) => {
  const pattern = codegen.compileRule(rule);
  const ctx = new ParseContext(src, true);
  const cst = pattern.parser(ctx, 0)!;
  return cst?.ptr.toAst(cst, src);
};

describe('AST', () => {
  describe('ContinueStatement', () => {
    test('short form', () => {
      const ast = toAstStatement(`continue;`);
      expect(ast).toMatchObject({
        type: 'ContinueStatement',
        label: null,
      });
    });

    test('with separators', () => {
      const ast = toAstStatement(` continue /* foo */ ; // bar`);
      expect(ast).toMatchObject({
        type: 'ContinueStatement',
        label: null,
      });
    });

    test('with identifier', () => {
      const ast = toAstStatement(` continue /* foo */ abc /* asdf */ ; // bar`);
      expect(ast).toMatchObject({
        type: 'ContinueStatement',
        label: {
          type: 'Identifier',
          name: 'abc',
        },
      });
    });

    test('no ending semicolon', () => {
      const ast = toAstStatement(` /**/ continue /* foo */ _gg_wp /* asdf */ // bar`);
      expect(ast).toMatchObject({
        type: 'ContinueStatement',
        label: {
          type: 'Identifier',
          name: '_gg_wp',
        },
      });
    });
  });

  describe('ReturnStatement', () => {
    test('short form', () => {
      const ast = toAstStatement(`return;`);
      expect(ast).toMatchObject({
        type: 'ReturnStatement',
        argument: null,
      });
    });

    test('with literal expression return', () => {
      const ast = toAstStatement(`return 123;`);
      expect(ast).toMatchObject({
        type: 'ReturnStatement',
        argument: {
          type: 'Literal',
          value: 123,
        },
      });
    });

    test('with separators', () => {
      const ast = toAstStatement(`
        // Best return statement evah  
        return /* the number: 8 */ 7 /* the number: 8 */ ; // the number: 8
      `);
      expect(ast).toMatchObject({
        type: 'ReturnStatement',
        argument: {
          type: 'Literal',
          value: 7,
        },
      });
    });
  });
});
