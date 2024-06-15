import {Rule} from '../../types';
import {CodegenRule} from '../CodegenRule';
import {CodegenTerminal} from '../CodegenTerminal';
import {grammar} from '../../json';
import {CodegenGrammar} from '../CodegenGrammar';

describe('CodegenGrammar', () => {
  test('...', () => {
    const parser = CodegenGrammar.compile(grammar);
    const ast = parser('{"a": "b"}', 0);
    console.log(JSON.stringify(ast, null, 2));
  });
});
