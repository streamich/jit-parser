import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../../context';
import {grammar} from '../javascript';

const codegen = new CodegenGrammar(grammar, new CodegenContext(false, true));
const parser = codegen.compile();

const toAst = (src: string) => {
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  console.log(cst);
  return cst?.ast;
};

const toAstRule = (rule: string, src: string) => {
  const parser = codegen.compileRule(rule);
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  return cst.ast;
};

describe('AST', () => {
  test('...', () => {
    // const ast = toAst('FROM sample-index-* [METADATA _id]');
    const ast = toAst('1 + 2 * 3 + 4');
    console.log(JSON.stringify(ast, null, 2));
  });
});
