import {grammar} from '../../grammars/json';
import {CodegenGrammar} from '../CodegenGrammar';
import {CodegenContext, ParseContext} from '../../context';

describe('CodegenGrammar', () => {
  test('can parse JSON grammar to basic CST', () => {
    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(grammar, codegenCtx);
    const parser = codegen.compile();
    const src = ' 1  ';
    const ctx = new ParseContext(src, false);
    const cst = parser(ctx, 0)!;
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
