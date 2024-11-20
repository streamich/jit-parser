import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../../context';
import {GrammarPrinter, printCst, printTraceNode} from '../../print';
import {grammar} from '../html-basic';
import type {RootTraceNode} from '../../types';


const parse = (src: string) => {
  const debug = true;
  const codegenContext = new CodegenContext(true, true, debug);
  const codegen = new CodegenGrammar(grammar, codegenContext);
  const parser = codegen.compile();
  const trace: RootTraceNode = {pos: 0, children: []};
  const ctx = new ParseContext(src, true, debug ? [trace] : void 0);
  const cst = parser(ctx, 0)!;
  const ast = cst.ptr.toAst(cst, src);
  if (debug) {
    console.log('Grammar:\n' + GrammarPrinter.print(grammar));
    console.log('CST:\n' + printCst(cst));
    console.log('Debug trace:\n' + printTraceNode(trace));
  }
  return {cst, ast, parser};
};

describe('AST', () => {
  describe('fragments', () => {
    test('can parse plain text', () => {
      const {ast, cst, parser} = parse('the text');
      
      console.log(ast);
      expect(ast).toEqual({
        type: 'Text',
        pos: 0,
        end: 8,
        raw: 'the text',
      });
    });
  });
});
