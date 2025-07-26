# JIT Parser

Top-down recursive descent backtracking PEG scanner-less JIT parser combinator generator.

A high-performance parser library that compiles grammar definitions into efficient JavaScript parsing functions at runtime. It generates both Concrete Syntax Trees (CST) and Abstract Syntax Trees (AST) from textual input.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Grammar Node Types](#grammar-node-types)
- [Tree Types](#tree-types)
- [Grammar Compilation](#grammar-compilation)
- [Debug Mode](#debug-mode)
- [Examples](#examples)
- [API Reference](#api-reference)

## Installation

```bash
npm install jit-router
```

## Quick Start

```typescript
import {CodegenGrammar} from 'jit-router';
import {ParseContext} from 'jit-router';

// Define a simple grammar
const grammar = {
  start: 'Value',
  cst: {
    Value: 'hello'
  }
};

// Compile the grammar to JavaScript
const parser = CodegenGrammar.compile(grammar);

// Parse input
const ctx = new ParseContext('hello', false);
const cst = parser(ctx, 0);
console.log(cst); // CST node representing the parse result
```

## Grammar Node Types

JIT Parser supports five main grammar node types for defining parsing rules:

### 1. RefNode (Reference Node)

References a named node defined elsewhere in the grammar.

**Interface:**
```typescript
type RefNode<Name extends string = string> = {r: Name};
```

**Syntax:**
```typescript
{r: 'NodeName'}
```

**Example:**
```typescript
const grammar = {
  start: 'Program',
  cst: {
    Program: {r: 'Statement'},
    Statement: 'return;'
  }
};
```

### 2. TerminalNode (Terminal Node)

Matches literal strings, regular expressions, or arrays of strings. Terminal nodes are leaf nodes in the parse tree.

**Interface:**
```typescript
interface TerminalNode {
  type?: string;                           // Type name (default: "Text")
  t: RegExp | string | '' | string[];      // Pattern(s) to match
  repeat?: '*' | '+';                      // Repetition (only for string arrays)
  sample?: string;                         // Sample text for generation
  ast?: AstNodeExpression;                 // AST transformation
}

// Shorthand: string, RegExp, or empty string
type TerminalNodeShorthand = RegExp | string | '';
```

**Syntax:**
```typescript
// String literal
'hello'

// Regular expression  
/[a-z]+/

// Array of alternatives
{t: ['true', 'false']}

// With repetition
{t: [' ', '\t', '\n'], repeat: '*'}

// Full terminal node
{
  t: /\d+/,
  type: 'Number',
  sample: '123'
}
```

**Examples:**
```typescript
// Simple string terminal
Value: 'null'

// RegExp terminal  
Number: /\-?\d+(\.\d+)?/

// Alternative strings
Boolean: {t: ['true', 'false']}

// Repeating whitespace
WS: {t: [' ', '\t', '\n'], repeat: '*'}
```

### 3. ProductionNode (Production Node)

Matches a sequence of grammar nodes in order. All nodes in the sequence must match for the production to succeed.

**Interface:**
```typescript
interface ProductionNode {
  p: GrammarNode[];                    // Sequence of nodes to match
  type?: string;                       // Type name (default: "Production")
  children?: Record<number, string>;   // Child index to property mapping
  ast?: AstNodeExpression;             // AST transformation
}

// Shorthand: array of grammar nodes
type ProductionNodeShorthand = GrammarNode[];
```

**Syntax:**
```typescript
// Shorthand array
['{', {r: 'Content'}, '}']

// Full production node
{
  p: ['{', {r: 'Content'}, '}'],
  type: 'Block',
  children: {
    1: 'content'  // Maps index 1 to 'content' property
  }
}
```

**Examples:**
```typescript
// Function call: func()
FunctionCall: ['func', '(', ')']

// Object with named children
Object: {
  p: ['{', {r: 'Members'}, '}'],
  children: {
    1: 'members'
  }
}
```

### 4. UnionNode (Union Node)

Matches one of several alternative patterns. The first matching alternative is selected (ordered choice).

**Interface:**
```typescript
interface UnionNode {
  u: GrammarNode[];           // Array of alternative nodes
  type?: string;              // Type name (default: "Union")
  ast?: AstNodeExpression;    // AST transformation
}
```

**Syntax:**
```typescript
{
  u: [pattern1, pattern2, pattern3]
}
```

**Examples:**
```typescript
// Literal values
Literal: {
  u: ['null', 'true', 'false', {r: 'Number'}, {r: 'String'}]
}

// Statement types
Statement: {
  u: [
    {r: 'IfStatement'},
    {r: 'ReturnStatement'}, 
    {r: 'ExpressionStatement'}
  ]
}
```

### 5. ListNode (List Node)

Matches zero or more repetitions of a pattern.

**Interface:**  
```typescript
interface ListNode {
  l: GrammarNode;              // Node to repeat
  type?: string;               // Type name (default: "List")
  ast?: AstNodeExpression;     // AST transformation
}
```

**Syntax:**
```typescript
{
  l: pattern
}
```

**Examples:**
```typescript
// Zero or more statements
Statements: {
  l: {r: 'Statement'}
}

// Comma-separated list
Arguments: {
  l: {
    p: [',', {r: 'Expression'}],
    ast: ['$', '/children/1']  // Extract the expression, ignore comma
  }
}
```

## Tree Types

JIT Parser works with three types of tree structures:

### 1. Grammar Nodes

The grammar definition that describes the parsing rules. These are the node types described above that define how to parse input text.

### 2. CST (Concrete Syntax Tree)

The parse tree that contains every matched token and maintains the complete structure of the parsed input.

**Interface:**
```typescript
interface CstNode {
  ptr: Pattern;         // Reference to grammar pattern
  pos: number;          // Start position in input
  end: number;          // End position in input  
  children?: CstNode[]; // Child nodes
}
```

**Example CST:**
```typescript
// For input: '{"foo": 123}'
{
  ptr: ObjectPattern,
  pos: 0,
  end: 13,
  children: [
    {ptr: TextPattern, pos: 0, end: 1},      // '{'
    {ptr: MembersPattern, pos: 1, end: 12,   // '"foo": 123'
      children: [...]
    },
    {ptr: TextPattern, pos: 12, end: 13}     // '}'
  ]
}
```

### 3. AST (Abstract Syntax Tree) 

A simplified tree structure derived from the CST, typically containing only semantically meaningful nodes.

**Default AST Interface:**
```typescript
interface CanonicalAstNode {
  type: string;                                    // Node type
  pos: number;                                     // Start position
  end: number;                                     // End position
  raw?: string;                                    // Raw matched text
  children?: (CanonicalAstNode | unknown)[];      // Child nodes
}
```

**Example AST:**
```typescript
// For input: '{"foo": 123}' 
{
  type: 'Object',
  pos: 0,
  end: 13,
  children: [
    {
      type: 'Entry',
      key: {type: 'String', value: 'foo'},
      value: {type: 'Number', value: 123}
    }
  ]
}
```

### CST to AST Conversion Rules

1. **Default Conversion**: Each CST node becomes an AST node with `type`, `pos`, `end`, and `children` properties.

2. **AST Expressions**: Use `ast` property in grammar nodes to customize AST generation:
   - `ast: null` - Skip this node in AST
   - `ast: ['$', '/children/0']` - Use first child's AST
   - `ast: {...}` - Custom JSON expression for transformation

3. **Children Mapping**: Use `children` property to map CST child indices to AST properties:
   ```typescript
   {
     children: {
       0: 'key',      // CST child 0 -> AST property 'key'
       2: 'value'     // CST child 2 -> AST property 'value'  
     }
   }
   ```

4. **Type Override**: Specify custom `type` property instead of default node type names.

## Grammar Compilation

Grammars are compiled to efficient JavaScript functions that can parse input strings rapidly.

### Basic Compilation

```typescript
import {CodegenGrammar} from 'jit-router';

const grammar = {
  start: 'Value',
  cst: {
    Value: {r: 'Number'},
    Number: /\d+/
  }
};

// Compile to parser function  
const parser = CodegenGrammar.compile(grammar);
```

### Compilation Options

```typescript
import {CodegenContext} from 'jit-router';

const ctx = new CodegenContext(
  true,  // positions: Include pos/end in AST
  true,  // astExpressions: Process AST transformations
  false  // debug: Generate debug trace code
);

const parser = CodegenGrammar.compile(grammar, ctx);
```

### Viewing Compiled Grammar

You can print the grammar structure by converting it to a string:

```typescript
import {GrammarPrinter} from 'jit-router';

const grammarString = GrammarPrinter.print(grammar);
console.log(grammarString);
```

**Example output:**
```
Value (reference)
└─ Number (terminal): /\d+/
```

### Complex Grammar Example

```typescript
const jsonGrammar = {
  start: 'Value',
  cst: {
    WOpt: {t: [' ', '\n', '\t', '\r'], repeat: '*', ast: null},
    Value: [{r: 'WOpt'}, {r: 'TValue'}, {r: 'WOpt'}],
    TValue: {
      u: ['null', {r: 'Boolean'}, {r: 'Number'}, {r: 'String'}, {r: 'Object'}, {r: 'Array'}]
    },
    Boolean: {t: ['true', 'false']},  
    Number: /\-?\d+(\.\d+)?([eE][\+\-]?\d+)?/,
    String: /"[^"\\]*(?:\\.[^"\\]*)*"/,
    Object: ['{', {r: 'Members'}, '}'],
    Members: {
      u: [
        {
          p: [{r: 'Entry'}, {l: {p: [',', {r: 'Entry'}], ast: ['$', '/children/1']}}],
          ast: ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']]
        },
        {r: 'WOpt'}
      ]
    },
    Entry: {
      p: [{r: 'String'}, ':', {r: 'Value'}],
      children: {0: 'key', 2: 'value'}
    },
    Array: ['[', {r: 'Elements'}, ']']
    // ... more rules
  },
  ast: {
    Value: ['$', '/children/1'],      // Extract middle child (TValue)  
    Boolean: ['==', ['$', '/raw'], 'true'],  // Convert to boolean
    Number: ['num', ['$', '/raw']]    // Convert to number
  }
};

const parser = CodegenGrammar.compile(jsonGrammar);
console.log(GrammarPrinter.print(jsonGrammar));
```

## Debug Mode

Debug mode captures a trace of the parsing process, showing which grammar rules were attempted at each position.

### Enabling Debug Mode

```typescript
import {CodegenContext, ParseContext} from 'jit-router';

// Enable debug during compilation
const debugCtx = new CodegenContext(true, true, true); // debug = true
const parser = CodegenGrammar.compile(grammar, debugCtx);

// Create trace collection  
const rootTrace = {pos: 0, children: []};
const parseCtx = new ParseContext('input text', false, [rootTrace]);

// Parse with debug trace
const cst = parser(parseCtx, 0);

// Print debug trace
import {printTraceNode} from 'jit-router';
console.log(printTraceNode(rootTrace, '', 'input text'));
```

### Debug Trace Output

The debug trace shows:
- Which grammar rules were attempted
- At what positions in the input
- Whether each attempt succeeded or failed
- The hierarchical structure of rule attempts

**Example trace output:**
```
Root
└─ Value 0:22 → ' {"foo": ["bar", 123]}'
   ├─ WOpt 0:1 → " "
   ├─ TValue 1:22 → '{"foo": ["bar", 123]}'
   │  ├─ Null
   │  ├─ Boolean  
   │  ├─ String
   │  └─ Object 1:22 → '{"foo": ["bar", 123]}'
   │     ├─ Text 1:2 → "{"
   │     ├─ Members 2:21 → '"foo": ["bar", 123]'
   │     │  └─ Production 2:21 → '"foo": ["bar", 123]'
   │     │     ├─ Entry 2:21 → '"foo": ["bar", 123]'
   │     │     │  ├─ String 2:7 → '"foo"'
   │     │     │  ├─ Text 7:8 → ":"
   │     │     │  └─ Value 8:21 → ' ["bar", 123]' 
   │     │     │     └─ ...
   │     │     └─ List 21:21 → ""
   │     └─ Text 21:22 → "}"
   └─ WOpt 22:22 → ""
```

## Examples

### 1. Simple Expression Parser

```typescript
const exprGrammar = {
  start: 'Expression',
  cst: {
    Expression: {r: 'Number'},
    Number: {
      t: /\d+/,
      type: 'Number'
    }
  }
};

const parser = CodegenGrammar.compile(exprGrammar);
const ctx = new ParseContext('42', true);
const cst = parser(ctx, 0);
const ast = cst.ptr.toAst(cst, '42');
console.log(ast); // {type: 'Number', pos: 0, end: 2, raw: '42'}
```

### 2. JSON Parser

```typescript
import {grammar as jsonGrammar} from 'jit-router/lib/grammars/json';

const parser = CodegenGrammar.compile(jsonGrammar);
const json = '{"name": "John", "age": 30}';
const ctx = new ParseContext(json, true);
const cst = parser(ctx, 0);
const ast = cst.ptr.toAst(cst, json);
console.log(ast);
```

### 3. Custom AST Transformation

```typescript
const grammar = {
  start: 'KeyValue', 
  cst: {
    KeyValue: {
      p: [{r: 'Key'}, '=', {r: 'Value'}],
      children: {0: 'key', 2: 'value'},
      type: 'Assignment'
    },
    Key: /[a-zA-Z]+/,
    Value: /\d+/
  },
  ast: {
    KeyValue: {
      type: 'Assignment',
      key: ['$', '/children/0/raw'],
      value: ['num', ['$', '/children/2/raw']]
    }
  }
};
```

### 4. List Parsing

```typescript
const listGrammar = {
  start: 'List',
  cst: {
    List: ['[', {r: 'Items'}, ']'],
    Items: {
      u: [
        {
          p: [{r: 'Item'}, {l: {p: [',', {r: 'Item'}], ast: ['$', '/children/1']}}],
          ast: ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']]
        },
        ''  // Empty list
      ]
    },
    Item: /\w+/
  }
};
```

## API Reference

### Core Classes

#### `CodegenGrammar`
- `static compile(grammar: Grammar, ctx?: CodegenContext): Parser`
- `compileRule(ruleName: string): Pattern`

#### `ParseContext`  
- `constructor(str: string, ast: boolean, trace?: RootTraceNode[])`

#### `CodegenContext`
- `constructor(positions: boolean, astExpressions: boolean, debug: boolean)`

#### `GrammarPrinter`
- `static print(grammar: Grammar, tab?: string): string`

### Utility Functions

#### `printCst(cst: CstNode, tab: string, src: string): string`
Print a formatted CST tree

#### `printTraceNode(trace: RootTraceNode | ParseTraceNode, tab: string, src: string): string`  
Print a formatted debug trace

### Type Definitions

See the [Grammar Node Types](#grammar-node-types) section for complete interface definitions.

---

This parser generator provides a powerful and efficient way to build custom parsers with minimal code while maintaining high performance through JIT compilation.
