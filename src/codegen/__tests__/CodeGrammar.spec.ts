import {grammar} from '../../json';
import {CodegenGrammar} from '../CodegenGrammar';
import {ParseContext} from '../../ParseContext';

describe('CodegenGrammar', () => {
  test('...', () => {
    const parser = CodegenGrammar.compile(grammar);
    const ctx = new ParseContext(' []  ', true);
    const cst = parser(ctx, 0)!;
    // console.log(JSON.stringify(cst.ast, null, 2));
    console.log(cst.ast);
  });
});
