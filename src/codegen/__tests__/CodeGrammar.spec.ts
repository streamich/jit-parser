import {grammar} from '../../json';
import {CodegenGrammar} from '../CodegenGrammar';
import {ParseContext} from '../../ParseContext';

describe('CodegenGrammar', () => {
  test('...', () => {
    const parser = CodegenGrammar.compile(grammar);
    const ctx = new ParseContext('null', false);
    const cst = parser(ctx, 0);
    console.log(JSON.stringify(cst, null, 2));
  });
});
