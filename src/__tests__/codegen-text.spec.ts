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

  test('can examine all patterns', () => {
    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(jsonGrammar, codegenCtx);
    
    // Compile all to generate all patterns
    codegen.compileAll();
    
    console.log('All patterns:');
    for (const [name, pattern] of (codegen as any).patterns) {
      console.log(`  ${name}: ${pattern.type}`);
    }
    
    console.log('\nAll codegen objects:');
    for (const [name, codegenObj] of (codegen as any).codegenObjects) {
      console.log(`  ${name}: ${typeof codegenObj}`);
    }
  });

  test('can save and examine generated code', () => {
    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(jsonGrammar, codegenCtx);
    
    // Generate the full code
    const fullCode = codegen.generateFullCode();
      
    // Save to file for inspection
    const fs = require('fs');
    fs.writeFileSync('/tmp/generated-parser.js', fullCode);
    console.log('Generated code saved to /tmp/generated-parser.js');
    
    // Look for the error pattern
    const lines = fullCode.split('\n');
    const errorLines = lines.filter(line => line.includes('generated') && !line.includes('Generated parser'));
    console.log('Lines containing "generated":', errorLines);
    
    expect(fullCode.length).toBeGreaterThan(1000);
  });

  test('generated code can be evaluated and used', () => {
    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(jsonGrammar, codegenCtx);
    
    // Generate the full code
    const fullCode = codegen.generateFullCode();
    
    console.log('Generated full code length:', fullCode.length);
    
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
    
    console.log('Parser result:', result);
    
    // Test with a more complex JSON
    const jsonSrc = '{"key": "value"}';
    const jsonCtx = new ParseContext(jsonSrc, false);
    const jsonResult = parser(jsonCtx, 0);
    
    expect(jsonResult).toBeDefined();
    expect(jsonResult.pos).toBe(0);
    expect(jsonResult.end).toBe(jsonSrc.length);
    
    console.log('JSON result:', jsonResult);
  });
});