import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {ParseContext} from '../../context';
import {grammar} from '../esql';

const codegen = new CodegenGrammar(grammar);
const parser = codegen.compile();

const toAst = (src: string) => {
  const ctx = new ParseContext(src, true);
  const cst = parser(ctx, 0)!;
  return cst?.ptr.toAst(cst, src);
};

describe('AST', () => {
  test('...', () => {
    // const ast = toAst('FROM sample-index-* [METADATA _id]');
    const ast = toAst('FROM a | ROW a.b.c = 1 | eval a | INLINESTATS a BY b');
    console.log(JSON.stringify(ast, null, 2));
  });
});
