import {grammar as jsonGrammar} from '../grammars/json';
import {CodegenGrammar} from '../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../context';

describe('Simple Code Generation', () => {
  test('can generate code for a simple terminal', () => {
    // Create a simple grammar with just one terminal rule
    const simpleGrammar = {
      start: 'Number',
      cst: {
        Number: {
          t: /\d+/,
          ast: null,
        }
      }
    };

    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(simpleGrammar, codegenCtx);
    
    // Generate the full code
    const fullCode = codegen.generateFullCode();
    
    console.log('Simple generated code:');
    console.log(fullCode);
    
    // Eval the generated code
    const parser = eval(fullCode);
    
    expect(typeof parser).toBe('function');
    
    // Test parsing with the generated parser
    const src = '123';
    const ctx = new ParseContext(src, false);
    const result = parser(ctx, 0);
    
    expect(result).toBeDefined();
    expect(result.pos).toBe(0);
    expect(result.end).toBe(3);
    
    console.log('Simple parser result:', result);
  });
});