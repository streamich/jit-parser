import {grammar} from '../../grammars/json';
import {CodegenGrammar} from '../CodegenGrammar';
import {ParseContext} from '../../ParseContext';

describe('CodegenGrammar', () => {
  test('can parse JSON grammar to basic CST', () => {
    const parser = CodegenGrammar.compile(grammar);
    const ctx = new ParseContext(' 1  ', false);
    const cst = parser(ctx, 0)!;
    expect(cst).toMatchObject({
      type: 'Value',
      pos: 0,
      end: 4,
      children: [
        {type: 'Ws', pos: 0, end: 1},
        {
          type: 'TValue',
          pos: 1,
          end: 2,
          children: [
            {
              type: 'Number',
            },
          ],
        },
        {type: 'Ws', pos: 2, end: 4},
      ],
    });
  });
});
