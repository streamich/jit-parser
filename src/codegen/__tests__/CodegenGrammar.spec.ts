import {grammar} from '../../grammars/json';
import {CodegenGrammar} from '../CodegenGrammar';
import {ParseContext} from '../../context';

describe('CodegenGrammar', () => {
  test('can parse JSON grammar to basic CST', () => {
    const codegen = new CodegenGrammar(grammar);
    const parser = codegen.compile();
    const ctx = new ParseContext(' 1  ', false);
    const cst = parser(ctx, 0)!;
    const ast = cst.ptr.toAst(cst);
    console.log(JSON.stringify(ast, null, 2));
    expect(cst).toMatchObject({
      pos: 0,
      end: 4,
      children: [
        {pos: 0, end: 1},
        {
          pos: 1,
          end: 2,
          children: [
            {
              ptr: {
                type: 'Number',
              },
              pos: 1,
              end: 2,
            },
          ],
        },
        {pos: 2, end: 4},
      ],
    });
  });
});
