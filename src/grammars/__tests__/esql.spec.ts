import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {ParseContext} from '../../ParseContext';
import {grammar} from '../esql';

const codegen = new CodegenGrammar(grammar);
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
    const ast = toAst('ROW a = "b", asdf');
    console.log(JSON.stringify(ast, null, 2));
  });
});
