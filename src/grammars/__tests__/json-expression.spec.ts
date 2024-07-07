import {CodegenGrammar} from '../../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../../context';
import {GrammarPrinter, printCst, printTraceNode} from '../../print';
import {RootTraceNode} from '../../types';
import {grammar} from '../json-expression';

const codegenCtx = new CodegenContext(true, true, true);
const codegen = new CodegenGrammar(grammar, codegenCtx);

console.log(GrammarPrinter.print(grammar));

const toCst = (src: string) => {
  const parser = codegen.compile();
  const trace: RootTraceNode = {pos: 0, children: []};
  const ctx = new ParseContext(src, true, [trace]);
  const cst = parser(ctx, 0)!;
  console.log(printTraceNode(trace.children[0], '', src));
  console.log(printCst(cst, '', src));
  return {cst, trace};
};

const toAst = (src: string) => {
  const cst = toCst(src);
  const ast = cst.cst.ptr.toAst(cst.cst, src);
  return {...cst, ast};
};

const toAstRule = (rule: string, src: string) => {
  const pattern = codegen.compileRule(rule);
  const ctx = new ParseContext(src, true);
  const cst = pattern.parser(ctx, 0)!;
  const ast = cst.ptr.toAst(cst, src);
  return ast;
};

describe('CST', () => {
  test('can parse two-level expression', () => {
    const {ast} = toAst('(add (mul 1 2 [123]) (. "a" "b"))');
    expect(ast).toMatchObject({
      type: 'Expression',
      operator: {
        type: 'Operator',
        raw: 'add',
      },
      operands: [
        {
          type: 'Expression',
          operator: {
            type: 'Operator',
            raw: 'mul',
          },
          operands: [
            {
              type: 'Number',
              raw: '1',
            },
            {
              type: 'Number',
              raw: '2',
            },
            {
              type: 'Array',
              children: [
                {
                  type: 'Number',
                  raw: '123',
                },
              ],
            },
          ],
        },
        {
          type: 'Expression',
          operator: {
            type: 'Operator',
            raw: '.',
          },
          operands: [
            {
              type: 'String',
              raw: '"a"',
            },
            {
              type: 'String',
              raw: '"b"',
            },
          ],
        },
      ],
    });
  });
});
