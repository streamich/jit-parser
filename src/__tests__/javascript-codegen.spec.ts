import {grammar as jsonGrammar} from '../grammars/json';
import {CodegenGrammar} from '../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../context';

describe('JavaScript Code Generation', () => {
  test('can generate working code for simple grammars', () => {
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
    
    // Verify the code contains expected elements
    expect(fullCode).toContain('// Generated parser with shared library');
    expect(fullCode).toContain('const sharedLib =');
    expect(fullCode).toContain('const library = sharedLib();');
    expect(fullCode).toContain('const parser =');
    expect(fullCode).toContain('module.exports = parser;');
    
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
    expect(result.ptr.type).toBe('Number');
  });

  test('can generate code for terminal with string literal', () => {
    const literalGrammar = {
      start: 'Keyword',
      cst: {
        Keyword: 'function'
      }
    };

    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(literalGrammar, codegenCtx);
    
    // Generate the full code
    const fullCode = codegen.generateFullCode();
    
    // Eval the generated code
    const parser = eval(fullCode);
    
    // Test parsing
    const src = 'function';
    const ctx = new ParseContext(src, false);
    const result = parser(ctx, 0);
    
    expect(result).toBeDefined();
    expect(result.pos).toBe(0);
    expect(result.end).toBe(8); // length of 'function'
  });

  test('can generate JavaScript code structure from complex grammar', () => {
    const codegenCtx = new CodegenContext(false, true);
    const codegen = new CodegenGrammar(jsonGrammar, codegenCtx);
    
    // Test that the code generation methods exist and work
    const codeInfo = codegen.generateCode();
    expect(codeInfo.js).toBeDefined();
    expect(typeof codeInfo.js).toBe('string');
    expect(codeInfo.dependencies).toBeDefined();
    
    const fullCode = codegen.generateFullCode();
    expect(fullCode).toBeDefined();
    expect(typeof fullCode).toBe('string');
    expect(fullCode.length).toBeGreaterThan(1000);
    
    // Verify it contains the expected structure
    expect(fullCode).toContain('// Generated parser with shared library');
    expect(fullCode).toContain('const sharedLib =');
    expect(fullCode).toContain('SharedPattern');
    expect(fullCode).toContain('SharedCstMatch');
    expect(fullCode).toContain('SharedLeafCstMatch');
  });

  test('shared library contains expected functions', () => {
    const {sharedLibrary, library, sharedLibraryText} = require('../sharedLibrary');
    
    expect(library).toBeDefined();
    expect(library.scrub).toBeDefined();
    expect(library.Pattern).toBeDefined();
    expect(library.CstMatch).toBeDefined();
    expect(library.LeafCstMatch).toBeDefined();
    
    expect(sharedLibraryText).toBeDefined();
    expect(typeof sharedLibraryText).toBe('string');
    expect(sharedLibraryText.length).toBeGreaterThan(100);
  });
});