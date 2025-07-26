# JavaScript Code Generation

This directory contains the functionality to generate JavaScript code from jit-parser grammars, as requested in issue #18.

## Features

- **Shared Library**: A self-contained library of functions used by generated parsers
- **Code Generation**: Ability to generate JavaScript code instead of just JIT-compiled functions  
- **Text Output**: Generated parsers can be saved as standalone JavaScript files
- **Dependency Handling**: Automatic resolution and linking of parser dependencies

## Usage

### Basic Code Generation

```typescript
import {CodegenGrammar} from './codegen/CodegenGrammar';
import {CodegenContext} from './context';

const grammar = {
  start: 'Number',
  cst: {
    Number: {
      t: /\d+/,
      ast: null,
    }
  }
};

const codegenCtx = new CodegenContext(false, true);
const codegen = new CodegenGrammar(grammar, codegenCtx);

// Generate JavaScript code
const fullCode = codegen.generateFullCode();

// Save to file
fs.writeFileSync('generated-parser.js', fullCode);

// Or eval directly
const parser = eval(fullCode);
```

### Shared Library

The shared library provides common functions used by all generated parsers:

```typescript
import {sharedLibrary, library, sharedLibraryText} from './sharedLibrary';

// For JIT compilation (runtime)
const pattern = new library.Pattern('MyType');

// For text generation (build time)
const libraryCode = sharedLibraryText;
```

## Implementation Status

- ✅ **Shared library creation**: Self-contained functions without external dependencies
- ✅ **Basic code generation**: Simple grammars work correctly
- ✅ **Text output methods**: `generateCode()` and `generateFullCode()` 
- ✅ **Dependency inlining**: Literal values and library functions are properly inlined
- 🔄 **Complex grammar support**: Multi-rule grammars have dependency resolution issues
- ✅ **Testing**: Comprehensive tests for working functionality

## Current Limitations

- Complex grammars with multiple interdependent rules may have dependency resolution issues
- Some advanced parser features may not be fully supported in text generation mode
- The generated code is optimized for correctness over performance

## Files

- `sharedLibrary.ts`: Contains the shared library implementation
- `codegen/CodegenGrammar.ts`: Main code generation logic (extended with `generateCode()` and `generateFullCode()`)
- `__tests__/javascript-codegen.spec.ts`: Tests for the new functionality
- `__tests__/simple-codegen.spec.ts`: Tests for simple use cases

## Architecture

The code generation works by:

1. Compiling all grammar rules to collect codegen objects
2. Extracting JavaScript code from each codegen object 
3. Resolving dependencies between parsers
4. Generating a self-contained JavaScript file with the shared library
5. Creating proper variable mappings for all dependencies

The shared library is designed to be completely self-contained and includes:
- Pattern class for parser metadata
- CstMatch and LeafCstMatch for parse results
- Helper functions like scrub for identifier cleanup
- AST factory functions for tree generation