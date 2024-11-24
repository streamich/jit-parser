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
      expect(ast).toBe('the text');
    });

    test('can parse a simple element', () => {
      const {ast} = parse('<div>abc</div>');
      expect(ast).toMatchObject(['div', null, 'abc']);
    });

    test('can parse one attribute', () => {
      const {ast} = parse('<span id="asdf">abc</span>');
      expect(ast).toMatchObject(['span', {id: 'asdf'}, 'abc']);
    });

    test('can parse two attributes', () => {
      const {ast} = parse('<span id="asdf" style=\'color: red\'>abc</span>');
      expect(ast).toMatchObject([
        "span",
        {
          "id": "asdf",
          "style": "color: red"
        },
        "abc"
      ]);
    });
  });
});
