import {grammar as jsonGrammar} from '../grammars/json';
import {CodegenGrammar} from '../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../context';

describe('Codegen Text Generation', () => {
  test('can generate JavaScript code from grammar', () => {
    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(jsonGrammar, codegenCtx);
    
    // Generate the code
    const generated = codegen.generateCode();
    
    expect(generated.js).toBeDefined();
    expect(typeof generated.js).toBe('string');
    expect(generated.dependencies).toBeDefined();
    expect(typeof generated.dependencies).toBe('object');
    
    console.log('Generated JS length:', generated.js.length);
    console.log('Dependencies:', Object.keys(generated.dependencies));
  });

  test('can generate full JavaScript code', () => {
    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(jsonGrammar, codegenCtx);
    
    // Generate the full code
    const fullCode = codegen.generateFullCode();
    
    expect(fullCode).toBeDefined();
    expect(typeof fullCode).toBe('string');
    expect(fullCode.includes('// Generated parser with shared library')).toBe(true);
    expect(fullCode.includes('const sharedLib =')).toBe(true);
    
    console.log('Full code length:', fullCode.length);
    console.log('Full code preview:', fullCode.substring(0, 500));
  });

  test('can examine generated code', () => {
    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(jsonGrammar, codegenCtx);
    
    // Generate the code
    const generated = codegen.generateCode();
    
    console.log('Generated JS:');
    console.log(generated.js);
    console.log('\nDependencies:');
    console.log(generated.dependencies);
  });
});