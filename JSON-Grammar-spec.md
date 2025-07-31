# JSON Grammar Specification

A comprehensive specification for defining PEG (Parsing Expression Grammar) parsers using JSON syntax with the `jit-parser` library.

## Table of Contents

1. [Introduction](#introduction)
2. [Rationale and Portability](#rationale-and-portability)
3. [Grammar File Structure](#grammar-file-structure)
4. [Grammar Node Types](#grammar-node-types)
5. [AST Conversion](#ast-conversion)
6. [Complete Examples](#complete-examples)
7. [Best Practices](#best-practices)

## Introduction

The JSON Grammar specification defines how to create parsing expression grammars using JSON syntax for the `jit-parser` library. This specification enables language-agnostic grammar definitions that can be serialized, shared, and processed across different platforms and programming languages.

The `jit-parser` library is a high-performance, top-down recursive descent backtracking PEG scanner-less JIT parser combinator generator. It compiles grammar definitions into efficient JavaScript parsing functions at runtime, generating both Concrete Syntax Trees (CST) and Abstract Syntax Trees (AST) from textual input.

## Rationale and Portability

### Why JSON-based Grammar?

1. **Language Agnostic**: JSON is universally supported across programming languages, making grammars portable between different implementations.

2. **Serialization**: Grammar definitions can be easily stored, transmitted, and version-controlled as standard JSON files.

3. **Tooling Support**: Leverage existing JSON validation, editing, and processing tools for grammar development.

4. **Interoperability**: Enable grammar sharing between different parser generators and language ecosystems.

5. **Runtime Configuration**: Dynamically load and modify grammar definitions without code changes.

### Portability Benefits

- **Cross-platform**: JSON grammars work identically across Node.js, browsers, and other JavaScript environments
- **Version Control**: Text-based format integrates seamlessly with Git and other VCS
- **Documentation**: Self-documenting structure with optional metadata fields
- **Validation**: JSON schema validation for grammar correctness
- **Transformation**: Programmatic grammar generation and modification

## Grammar File Structure

A JSON grammar file defines a complete parsing grammar with the following top-level structure:

```typescript
interface Grammar {
  start: string;                              // Entry point rule name
  cst: Record<string, GrammarNode>;          // Concrete syntax rules
  ast?: Record<string, AstNodeExpression>;   // AST transformation rules
}
```

### Basic Example

```json
{
  "start": "Value",
  "cst": {
    "Value": {"r": "Number"},
    "Number": {"t": "/\\d+/"}
  },
  "ast": {
    "Number": ["num", ["$", "/raw"]]
  }
}
```

### Structure Components

#### Start Symbol
- **`start`**: String specifying the root grammar rule name
- Must reference a rule defined in the `cst` section
- Determines the entry point for parsing

#### CST Rules
- **`cst`**: Object mapping rule names to grammar node definitions
- Contains all named grammar rules that can be referenced
- Supports all five grammar node types (Reference, Terminal, Production, Union, List)

#### AST Transformations
- **`ast`**: Optional object defining custom AST generation rules
- Maps rule names to JSON expressions for AST transformation
- Overrides default AST generation behavior

## Grammar Node Types

The JSON grammar specification supports five fundamental node types for defining parsing rules. Each type has a specific JSON representation with both full interface and shorthand syntax options.

### 1. RefNode (Reference Node)

References a named rule defined elsewhere in the grammar.

#### Interface
```typescript
type RefNode<Name extends string = string> = {
  r: Name;
};
```

#### Syntax
```json
{"r": "RuleName"}
```

#### Examples
```json
{
  "start": "Program",
  "cst": {
    "Program": {"r": "Statement"},
    "Statement": "return;"
  }
}
```

### 2. TerminalNode (Terminal Node)

Matches literal strings, regular expressions, or arrays of alternatives. Terminal nodes are leaf nodes in the parse tree.

#### Interface
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

#### Syntax Options

**String Literal:**
```json
"hello"
```

**Regular Expression:**
```json
{"t": "/[a-z]+/"}
```

Note: Regular expressions in JSON must be represented as objects with a `t` property containing the regex pattern as a string.

**Array of Alternatives:**
```json
{"t": ["true", "false"]}
```

**With Repetition:**
```json
{"t": [" ", "\t", "\n"], "repeat": "*"}
```

**Full Terminal Node:**
```json
{
  "t": "/\\d+/",
  "type": "Number",
  "sample": "123",
  "ast": ["num", ["$", "/raw"]]
}
```

#### Important Notes

**Regular Expression Syntax:**
- In TypeScript/JavaScript, regex can be written as `/pattern/flags`
- In JSON, regex must be a string: `{"t": "/pattern/flags"}`
- Escape characters must be double-escaped in JSON strings: `"\\d+"` instead of `\d+`

**Repetition Patterns:**
- `repeat: "*"` means zero or more matches (equivalent to regex `*`)
- `repeat: "+"` means one or more matches (equivalent to regex `+`)
- Only applicable when `t` is an array of strings

#### Examples

```json
{
  "cst": {
    "Null": "null",
    "Number": "/\\-?\\d+(\\.\\d+)?/",
    "Boolean": {"t": ["true", "false"]},
    "Whitespace": {"t": [" ", "\t", "\n"], "repeat": "*"},
    "Identifier": {
      "t": "/[a-zA-Z_][a-zA-Z0-9_]*/",
      "type": "Identifier",
      "sample": "variable_name"
    }
  }
}
```

### 3. ProductionNode (Production Node)

Matches a sequence of grammar nodes in order. All nodes in the sequence must match for the production to succeed.

#### Interface
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

#### Syntax Options

**Shorthand Array:**
```json
["{", {"r": "Content"}, "}"]
```

**Full Production Node:**
```json
{
  "p": ["{", {"r": "Content"}, "}"],
  "type": "Block",
  "children": {
    "1": "content"
  }
}
```

#### Examples

```json
{
  "cst": {
    "FunctionCall": ["func", "(", ")"],
    "Assignment": {
      "p": [{"r": "Identifier"}, "=", {"r": "Expression"}],
      "type": "Assignment",
      "children": {
        "0": "target",
        "2": "value"
      }
    },
    "IfStatement": {
      "p": ["if", "(", {"r": "Expression"}, ")", {"r": "Statement"}],
      "children": {
        "2": "condition",
        "4": "body"
      }
    }
  }
}
```

### 4. UnionNode (Union Node)

Matches one of several alternative patterns. The first matching alternative is selected (ordered choice).

#### Interface
```typescript
interface UnionNode {
  u: GrammarNode[];           // Array of alternative nodes
  type?: string;              // Type name (default: "Union")
  ast?: AstNodeExpression;    // AST transformation
}
```

#### Syntax
```json
{
  "u": ["pattern1", "pattern2", "pattern3"]
}
```

#### Examples

```json
{
  "cst": {
    "Literal": {
      "u": ["null", "true", "false", {"r": "Number"}, {"r": "String"}]
    },
    "Statement": {
      "u": [
        {"r": "IfStatement"},
        {"r": "ReturnStatement"},
        {"r": "ExpressionStatement"}
      ]
    },
    "BinaryOperator": {
      "u": ["+", "-", "*", "/", "==", "!=", "<", ">"]
    }
  }
}
```

### 5. ListNode (List Node)

Matches zero or more repetitions of a pattern.

#### Interface
```typescript
interface ListNode {
  l: GrammarNode;              // Node to repeat
  type?: string;               // Type name (default: "List")
  ast?: AstNodeExpression;     // AST transformation
}
```

#### Syntax
```json
{
  "l": "pattern"
}
```

#### Examples

```json
{
  "cst": {
    "Statements": {
      "l": {"r": "Statement"}
    },
    "Parameters": {
      "l": {
        "p": [",", {"r": "Parameter"}],
        "ast": ["$", "/children/1"]
      }
    },
    "Digits": {
      "l": "/[0-9]/",
      "type": "DigitSequence"
    }
  }
}
```

## AST Conversion

The Abstract Syntax Tree (AST) conversion process transforms the detailed Concrete Syntax Tree (CST) into a simplified, semantically meaningful tree structure suitable for further processing.

### Default AST Generation

When no custom AST transformation is specified, the library generates a canonical AST node:

```typescript
interface CanonicalAstNode {
  type: string;                                    // Node type
  pos: number;                                     // Start position
  end: number;                                     // End position
  raw?: string;                                    // Raw matched text
  children?: (CanonicalAstNode | unknown)[];      // Child nodes
}
```

### AST Expression System

AST transformations use JSON Expression syntax for powerful, declarative tree transformations. This leverages the `@jsonjoy.com/json-expression` library to provide a rich set of transformation operations.

#### Basic AST Expressions

**Skip Node:**
```json
{"ast": null}
```

**Use Child Node:**
```json
{"ast": ["$", "/children/0"]}
```

**Custom Object:**
```json
{
  "ast": {
    "type": "CustomType",
    "value": ["$", "/raw"]
  }
}
```

#### JSON Expression Operations

**Value Extraction:**
```json
["$", "/raw"]              // Get raw matched text
["$", "/children/0"]       // Get first child's AST
["$", "/pos"]              // Get start position
["$", "/end"]              // Get end position
```

**Type Conversion:**
```json
["num", ["$", "/raw"]]     // Convert to number
["bool", ["$", "/raw"]]    // Convert to boolean
```

**String Operations:**
```json
["substr", ["$", "/raw"], 1, -1]  // Remove first and last character
["len", ["$", "/raw"]]            // Get string length
```

**Array Operations:**
```json
["push", [[]], ["$", "/children/0"]]    // Create array with element
["concat", ["$", "/children/0"], ["$", "/children/1"]]  // Concatenate arrays
```

**Conditional Logic:**
```json
["?", ["==", ["$", "/raw"], "true"], true, false]  // Ternary operator
```

**Object Construction:**
```json
["o.set", ["$", ""], "key", ["$", "/children/0"]]  // Set object property
```

### Children Mapping

Use the `children` property to map CST child indices to AST properties:

```json
{
  "p": [{"r": "Key"}, ":", {"r": "Value"}],
  "children": {
    "0": "key",
    "2": "value"
  }
}
```

This creates an AST node with `key` and `value` properties instead of a `children` array.

### Complex AST Examples

#### Boolean Conversion
```json
{
  "cst": {
    "Boolean": {"t": ["true", "false"]}
  },
  "ast": {
    "Boolean": ["==", ["$", "/raw"], "true"]
  }
}
```

#### Number Conversion
```json
{
  "cst": {
    "Number": "/\\d+/"
  },
  "ast": {
    "Number": ["num", ["$", "/raw"]]
  }
}
```

#### String Unescaping
```json
{
  "cst": {
    "String": "/\"[^\"]*\"/"
  },
  "ast": {
    "String": ["substr", ["$", "/raw"], 1, -1]
  }
}
```

#### Array Collection
```json
{
  "cst": {
    "Array": ["[", {"r": "Elements"}, "]"]
  },
  "ast": {
    "Array": ["$", "/children/1"]
  }
}
```

#### List Flattening
```json
{
  "cst": {
    "CommaSeparated": {
      "p": [
        {"r": "Item"},
        {
          "l": {
            "p": [",", {"r": "Item"}],
            "ast": ["$", "/children/1"]
          }
        }
      ],
      "ast": ["concat", ["push", [[]], ["$", "/children/0"]], ["$", "/children/1"]]
    }
  }
}
```

## Complete Examples

### Simple Expression Parser

A basic arithmetic expression parser:

```json
{
  "start": "Expression",
  "cst": {
    "Expression": {"r": "Term"},
    "Term": {"r": "Number"},
    "Number": {
      "t": "/\\d+/",
      "type": "Number"
    }
  },
  "ast": {
    "Number": {
      "type": "Number",
      "value": ["num", ["$", "/raw"]]
    }
  }
}
```

### JSON Parser

A complete JSON parser grammar:

```json
{
  "start": "Value",
  "cst": {
    "WOpt": {"t": [" ", "\n", "\t", "\r"], "repeat": "*", "ast": null},
    "Value": [{"r": "WOpt"}, {"r": "TValue"}, {"r": "WOpt"}],
    "TValue": {
      "u": [
        {"r": "Null"},
        {"r": "Boolean"},
        {"r": "String"},
        {"r": "Object"},
        {"r": "Array"},
        {"r": "Number"}
      ]
    },
    "Null": "null",
    "Boolean": {"t": ["true", "false"]},
    "Number": "/\\-?(0|([1-9][0-9]*))(\\.\\d+)?([eE][\\+\\-]?\\d+)?/",
    "String": "/\"[^\"\\\\]*(?:\\\\.|[^\"\\\\]*)*\"/",
    "Array": ["[", {"r": "Elements"}, "]"],
    "Elements": {
      "u": [
        {
          "p": [
            {"r": "Value"},
            {
              "l": {
                "p": [",", {"r": "Value"}],
                "ast": ["$", "/children/1"]
              }
            }
          ],
          "ast": ["concat", ["push", [[]], ["$", "/children/0"]], ["$", "/children/1"]]
        },
        {"r": "WOpt"}
      ]
    },
    "Object": ["{", {"r": "Members"}, "}"],
    "Members": {
      "u": [
        {
          "p": [
            {"r": "Entry"},
            {
              "l": {
                "p": [",", {"r": "Entry"}],
                "ast": ["$", "/children/1"]
              }
            }
          ],
          "ast": ["concat", ["push", [[]], ["$", "/children/0"]], ["$", "/children/1"]]
        },
        {"r": "WOpt"}
      ]
    },
    "Entry": {
      "p": [{"r": "WOpt"}, {"r": "String"}, {"r": "WOpt"}, ":", {"r": "Value"}],
      "children": {
        "1": "key",
        "4": "value"
      }
    }
  },
  "ast": {
    "Value": ["$", "/children/1"],
    "Boolean": ["==", ["$", "/raw"], "true"],
    "Number": ["num", ["$", "/raw"]],
    "String": ["substr", ["$", "/raw"], 1, -1],
    "Array": ["$", "/children/1"],
    "Object": ["$", "/children/1"],
    "Elements": ["?", ["len", ["$", "/children"]], ["$", "/children/0"], [[]]],
    "Members": ["?", ["len", ["$", "/children"]], ["$", "/children/0"], [[]]]
  }
}
```

### Calculator with Operator Precedence

A calculator supporting basic arithmetic with proper operator precedence:

```json
{
  "start": "Expression",
  "cst": {
    "Expression": {"r": "AddExpr"},
    "AddExpr": {
      "p": [
        {"r": "MulExpr"},
        {
          "l": {
            "p": [{"r": "AddOp"}, {"r": "MulExpr"}],
            "children": {"0": "op", "1": "right"}
          }
        }
      ],
      "ast": ["foldl", ["$", "/children/0"], ["$", "/children/1"]]
    },
    "MulExpr": {
      "p": [
        {"r": "Primary"},
        {
          "l": {
            "p": [{"r": "MulOp"}, {"r": "Primary"}],
            "children": {"0": "op", "1": "right"}
          }
        }
      ],
      "ast": ["foldl", ["$", "/children/0"], ["$", "/children/1"]]
    },
    "Primary": {
      "u": [
        {"r": "Number"},
        {"p": ["(", {"r": "Expression"}, ")"], "ast": ["$", "/children/1"]}
      ]
    },
    "Number": "/\\d+/",
    "AddOp": {"u": ["+", "-"]},
    "MulOp": {"u": ["*", "/"]}
  },
  "ast": {
    "Number": ["num", ["$", "/raw"]]
  }
}
```

## Best Practices

### Grammar Design

1. **Start Simple**: Begin with basic rules and gradually add complexity
2. **Use Meaningful Names**: Choose descriptive rule names that reflect their purpose
3. **Leverage Shortcuts**: Use shorthand syntax where appropriate for cleaner grammars
4. **Whitespace Handling**: Create dedicated whitespace rules with `ast: null` for clean ASTs
5. **Left Recursion**: Avoid left-recursive rules; use right-recursion with lists instead

### Performance Optimization

1. **Order Alternatives**: Place most common alternatives first in union nodes
2. **Minimize Backtracking**: Design grammars to reduce ambiguity
3. **Atomic Groups**: Use terminal nodes for performance-critical patterns
4. **Sample Data**: Provide sample strings for testing and validation

### AST Design

1. **Semantic Focus**: Include only semantically meaningful information in ASTs
2. **Consistent Structure**: Maintain consistent AST node shapes across similar constructs
3. **Type Safety**: Use clear, descriptive type names for AST nodes
4. **Flatten Lists**: Transform complex nested structures into simpler forms

### Error Handling

1. **Debug Mode**: Use debug compilation for grammar development
2. **Incremental Testing**: Test grammar rules individually before combining
3. **Trace Analysis**: Leverage debug traces to understand parse failures
4. **Sample Validation**: Verify grammars against known good and bad inputs

### Debugging and Validation

#### Debug Mode
Enable debug mode during development to capture parsing traces:

```javascript
import {CodegenContext, ParseContext} from 'jit-parser';

// Enable debug during compilation
const debugCtx = new CodegenContext(true, true, true); // positions, ast, debug
const parser = CodegenGrammar.compile(grammar, debugCtx);

// Create trace collection
const rootTrace = {pos: 0, children: []};
const parseCtx = new ParseContext('input text', false, [rootTrace]);

// Parse with debug trace
const cst = parser(parseCtx, 0);

// Print debug trace
import {printTraceNode} from 'jit-parser';
console.log(printTraceNode(rootTrace, '', 'input text'));
```

#### Grammar Visualization
Use the built-in grammar printer to visualize grammar structure:

```javascript
import {GrammarPrinter} from 'jit-parser';

const grammarString = GrammarPrinter.print(grammar);
console.log(grammarString);
```

#### CST Inspection
Print concrete syntax trees for debugging:

```javascript
import {printCst} from 'jit-parser';

const parser = CodegenGrammar.compile(grammar);
const ctx = new ParseContext('input', false);
const cst = parser(ctx, 0);
console.log(printCst(cst, '', 'input'));
```

### Maintainability

1. **Documentation**: Include comments and examples in grammar files
2. **Modularity**: Break complex grammars into logical sections
3. **Version Control**: Track grammar evolution through version control
4. **Testing**: Maintain comprehensive test suites for grammar rules

### Common Patterns

#### Optional Elements
```json
{"u": [{"r": "Element"}, ""]}
```

#### Comma-Separated Lists
```json
{
  "u": [
    {
      "p": [
        {"r": "Item"},
        {"l": {"p": [",", {"r": "Item"}], "ast": ["$", "/children/1"]}}
      ],
      "ast": ["concat", ["push", [[]], ["$", "/children/0"]], ["$", "/children/1"]]
    },
    ""
  ]
}
```

#### Identifier with Keywords
```json
{
  "cst": {
    "Identifier": {
      "u": [
        {"r": "Keyword"},
        "/[a-zA-Z_][a-zA-Z0-9_]*/"
      ]
    },
    "Keyword": {
      "u": ["if", "else", "while", "for", "return"]
    }
  }
}
```

---

This specification provides a complete reference for creating PEG parsers using JSON grammar definitions with the `jit-parser` library. The JSON format ensures portability, maintainability, and interoperability while providing the full power of parsing expression grammars.