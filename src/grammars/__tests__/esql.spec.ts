import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../../context';
import {grammar} from '../esql';

const ctx = new CodegenContext(false, true);
const codegen = new CodegenGrammar(grammar, ctx);
const parser = codegen.compile();

const toAst = (src: string) => {
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  return cst?.ptr.toAst(cst, src);
};

const toAstRule = (rule: string, src: string) => {
  const pattern = codegen.compileRule(rule);
  const ctx = new ParseContext(src, true);
  const cst = pattern.parser(ctx, 0)!;
  return cst?.ptr.toAst(cst, src);
};

describe('AST', () => {
  test('...', () => {
    // const ast = toAst('FROM sample-index-* [METADATA _id]');
    const ast = toAst('ROW abc(*)');
    console.log(JSON.stringify(ast, null, 2));
  });

  // test('can parse a function', () => {
  //   // const ast = toAst('FROM sample-index-* [METADATA _id]');
  //   const ast = toAstRule('PrimaryExpression', 'abc()');
  //   console.log(JSON.stringify(ast, null, 2));
  // });
});
