import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../../context';
import {printCst, printTraceNode} from '../../print';
import {RootTraceNode} from '../../types';
import {grammar} from '../calculator';

const codegenCtx = new CodegenContext(true, true, true);
const codegen = new CodegenGrammar(grammar, codegenCtx);

const toCst = (src: string) => {
  const parser = codegen.compile();
  const trace: RootTraceNode = {pos: 0, children: []};
  const ctx = new ParseContext(src, true, [trace]);
  const cst = parser(ctx, 0)!;
  // console.log(printTraceNode(trace.children[0], '', src));
  // console.log(printCst(cst, '', src));
  return {cst, trace};
};

const toAst = (src: string) => {
  const cst = toCst(src);
  const ast = cst.cst.ptr.toAst(cst.cst, src);
  return {...cst, ast};
};

test('..', () => {
  const text = '2 * 2 + 4 * 3';
  const res = toAst(text);
  console.log(printTraceNode(res.trace, '', text));
  console.log(printCst(res.cst, '', text));
  console.log(res.ast);
  console.log(JSON.stringify(res.ast, null, 2));
  // console.log(cst);
  // console.log(res.ast);
  // expect(res.ast).toMatchSnapshot();
});
