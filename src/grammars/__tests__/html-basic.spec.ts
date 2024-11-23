import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../../context';
import {GrammarPrinter, printCst, printTraceNode} from '../../print';
import {grammar} from '../html-basic';
import type {RootTraceNode} from '../../types';

const parse = (src: string) => {
  const debug = false;
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
    console.log(JSON.stringify(ast, null, 2));
  }
  return {cst, ast, parser};
};

describe('AST', () => {
  describe('fragments', () => {
    test('can parse plain text', () => {
      const {ast} = parse('the text');
      expect(ast).toMatchObject({
        type: 'Text',
        pos: 0,
        end: 8,
        raw: 'the text',
      });
    });

    test('can parse a simple element', () => {
      const {ast} = parse('<div>abc</div>');
      expect(ast).toMatchObject({
        type: 'Element',
        tag: 'div',
        pos: 0,
        end: 14,
        children: [
          {
            type: 'Text',
            pos: 5,
            end: 8,
            raw: 'abc',
          },
        ],
      });
    });
  });
});
