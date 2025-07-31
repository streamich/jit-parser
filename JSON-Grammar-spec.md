# JSON Grammar Specification

A comprehensive specification for defining PEG (Parsing Expression Grammar) parsers using JSON syntax. This specification provides a portable way of specifying grammars that can be easily implemented in different parsing libraries and programming languages.

## Table of Contents

1. [Introduction](#introduction)
2. [Rationale and Portability](#rationale-and-portability)
3. [Grammar File Structure](#grammar-file-structure)
4. [Grammar Node Types](#grammar-node-types)
5. [AST Conversion](#ast-conversion)
6. [Complete Examples](#complete-examples)
7. [Best Practices](#best-practices)

## Introduction

The JSON Grammar specification defines how to create parsing expression grammars using JSON syntax. This specification enables language-agnostic grammar definitions that can be serialized, shared, and processed across different platforms and programming languages.

A major advantage of JSON Grammar is that it can specify CST to AST transformation fully in JSON, which is "super" portable and does not require any code injections in the programming language where the parser is generated.

JSON-based grammars leverage the power of PEG (Parsing Expression Grammar) parsing, which provides top-down recursive descent backtracking capabilities. The grammars can be compiled into efficient parsing functions at runtime, generating both Concrete Syntax Trees (CST) and Abstract Syntax Trees (AST) from textual input.

## Rationale and Portability

### Why JSON-based Grammar?

1. **Language Agnostic**: JSON is universally supported across programming languages, making grammars portable between different implementations.

2. **Serialization**: Grammar definitions can be easily stored, transmitted, and version-controlled as standard JSON files.

3. **Tooling Support**: Leverage existing JSON validation, editing, and processing tools for grammar development.

4. **Interoperability**: Enable grammar sharing between different parser generators and language ecosystems.

5. **Runtime Configuration**: Dynamically load and modify grammar definitions without code changes.

## Grammar File Structure

A JSON grammar file defines a complete parsing grammar with the following top-level structure:

```js
interface Grammar {
  start: string;                             // Entry point rule name
  cst: Record<string, GrammarNode>;          // Concrete syntax rules
  ast?: Record<string, AstNodeExpression>;   // AST transformation rules
}
```

### Basic Example

```js
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
```js
type RefNode<Name extends string = string> = {
  r: Name;
};
```

#### Syntax
```js
{"r": "RuleName"}
```

#### Examples
```js
{
  "start": "Program",
  "cst": {
    "Program": {"r": "Statement"},
    "Statement": "return;"
  }
}

// Matches:
// return;
```

### 2. TerminalNode (Terminal Node)

Matches literal strings, regular expressions, or arrays of alternatives. Terminal nodes are leaf nodes in the parse tree.

#### Interface
```js
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
```js
"hello"  // Matches exactly: hello
```

**Regular Expression:**
```js
{"t": "/[a-z]+/"}  // Matches: abc, hello, test
```

Note: Regular expressions in JSON must be represented as objects with a `t` property containing the regex pattern as a string.

**Array of Alternatives:**
```js
{"t": ["true", "false"]}  // Matches: true OR false
```

**With Repetition:**
```js
{"t": [" ", "\t", "\n"], "repeat": "*"}  // Matches: any whitespace sequence
```

**Full Terminal Node:**
```js
{
  "t": "/\\d+/",           // Matches: 123, 456, 7890
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

```js
{
  "cst": {
    "Null": "null",                          // Matches: null
    "Number": "/\\-?\\d+(\\.\\d+)?/",       // Matches: 123, -45.67, 0.5
    "Boolean": {"t": ["true", "false"]},     // Matches: true OR false
    "Whitespace": {"t": [" ", "\t", "\n"], "repeat": "*"},  // Matches: any whitespace
    "Identifier": {
      "t": "/[a-zA-Z_][a-zA-Z0-9_]*/",      // Matches: varName, _temp, MY_CONST
      "type": "Identifier",
      "sample": "variable_name"
    }
  }
}
```

### 3. ProductionNode (Production Node)

Matches a sequence of grammar nodes in order. All nodes in the sequence must match for the production to succeed.

#### Interface
```js
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
```js
["{", {"r": "Content"}, "}"]  // Matches: { content }
```

#### Example
```js
{
  "cst": {
    "FunctionCall": ["identifier", "(", {"r": "Arguments"}, ")"],  // Matches: func(args)
    "Assignment": [{"r": "Variable"}, "=", {"r": "Expression"}]     // Matches: x = value
  }
}
```

**Full Production Node:**
```js
{
  "p": ["{", {"r": "Content"}, "}"],  // Matches: { content }
  "type": "Block",
  "children": {
    "1": "content"
  }
}
```

#### More Examples

```js
{
  "cst": {
    "FunctionCall": ["func", "(", ")"],                              // Matches: func()
    "Assignment": {
      "p": [{"r": "Identifier"}, "=", {"r": "Expression"}],        // Matches: x = 5
      "type": "Assignment",
      "children": {
        "0": "target",
        "2": "value"
      }
    },
    "IfStatement": {
      "p": ["if", "(", {"r": "Expression"}, ")", {"r": "Statement"}],  // Matches: if (x) stmt
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
```js
interface UnionNode {
  u: GrammarNode[];           // Array of alternative nodes
  type?: string;              // Type name (default: "Union")
  ast?: AstNodeExpression;    // AST transformation
}
```

#### Syntax
```js
{
  "u": ["pattern1", "pattern2", "pattern3"]  // Matches: pattern1 OR pattern2 OR pattern3
}
```

#### Examples

```js
{
  "cst": {
    "Literal": {
      "u": ["null", "true", "false", {"r": "Number"}, {"r": "String"}]  // Matches any literal type
    },
    "Statement": {
      "u": [                                                              // Matches any statement type
        {"r": "IfStatement"},
        {"r": "ReturnStatement"},
        {"r": "ExpressionStatement"}
      ]
    },
    "BinaryOperator": {
      "u": ["+", "-", "*", "/", "==", "!=", "<", ">"]                   // Matches any operator
    }
  }
}
```

### 5. ListNode (List Node)

Matches zero or more repetitions of a pattern.

#### Interface
```js
interface ListNode {
  l: GrammarNode;              // Node to repeat
  type?: string;               // Type name (default: "List")
  ast?: AstNodeExpression;     // AST transformation
}
```

#### Syntax
```js
{
  "l": "pattern"  // Matches: zero or more occurrences of pattern
}
```

#### Examples

```js
{
  "cst": {
    "Statements": {
      "l": {"r": "Statement"}                                           // Matches: multiple statements
    },
    "Parameters": {
      "l": {                                                            // Matches: param1, param2, param3
        "p": [",", {"r": "Parameter"}],
        "ast": ["$", "/children/1"]
      }
    },
    "Digits": {
      "l": "/[0-9]/",                                                   // Matches: 123456789
      "type": "DigitSequence"
    }
  }
}
```

## AST Conversion

The Abstract Syntax Tree (AST) conversion process transforms the detailed Concrete Syntax Tree (CST) into a simplified, semantically meaningful tree structure suitable for further processing. A major advantage is that all transformations are specified purely in JSON, making them completely portable without requiring any language-specific code injections.

### Default AST Generation

When no custom AST transformation is specified, the library generates a canonical AST node:

```js
interface CanonicalAstNode {
  type: string;                                    // Node type
  pos: number;                                     // Start position
  end: number;                                     // End position
  raw?: string;                                    // Raw matched text (the actual text that was matched)
  children?: (CanonicalAstNode | unknown)[];       // Child nodes
}
```

The `raw` property contains the actual text that was matched by the grammar node, providing access to the original input text for that specific node.

### Simplified AST Construction with `children`

The simplest way to customize AST generation is using the `children` property mapping in grammar nodes. This allows you to specify which child nodes should be included in the AST and assign them meaningful property names:

```js
{
  "cst": {
    "Assignment": {
      "p": [{"r": "Variable"}, "=", {"r": "Expression"}],
      "children": {
        "0": "target",    // First child becomes "target" property
        "2": "value"      // Third child becomes "value" property
      }
    }
  }
}
```

### AST Expression System

AST transformations use JSON Expression syntax for powerful, declarative tree transformations. This system is completely portable since it's all JSON - no language-specific transformations or code injections are needed.

#### JSON Expression Transformation Process

The transformation happens as follows:

1. **Default AST Creation**: First, a default (canonical) AST node is created from the CST
2. **JSON Expression Application**: Then a JSON Expression is applied to that node, allowing modification or extraction of specific parts
3. **Result Generation**: The resulting JSON from the JSON Expression evaluation becomes the final AST node
4. **Bottom-up Processing**: The process happens bottom-up, with resulting AST nodes supplied to parent node JSON Expression transformations as part of their `children` array
5. **Children Array**: The `children` array is the canonical way to specify all children in both CST and AST

#### Basic AST Expressions

**Skip Node:**
```js
{"ast": null}
```

**Use Child Node:**
```js
{"ast": ["$", "/children/0"]}
```

**Custom Object:**
```js
{
  "ast": {
    "type": "CustomType",
    "value": ["$", "/raw"]
  }
}
```

#### JSON Expression Operations

**Value Extraction:**
```js
["$", "/raw"]              // Get raw matched text
["$", "/children/0"]       // Get first child's AST
["$", "/pos"]              // Get start position
["$", "/end"]              // Get end position
```

**Type Conversion:**
```js
["num", ["$", "/raw"]]     // Convert to number
["bool", ["$", "/raw"]]    // Convert to boolean

// Example transformation:
// Input CST: {type: "Number", raw: "42", pos: 0, end: 2}
// Transform: ["num", ["$", "/raw"]]
// Output AST: 42
```

**String Operations:**
```js
["substr", ["$", "/raw"], 1, -1]  // Remove first and last character
["len", ["$", "/raw"]]            // Get string length

// Example transformation:
// Input CST: {type: "String", raw: "\"hello\"", pos: 0, end: 7}
// Transform: ["substr", ["$", "/raw"], 1, -1]
// Output AST: "hello"
```

**Array Operations:**
```js
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
```js
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

### Simple Calculator Parser

A basic calculator that handles addition and multiplication with proper precedence:

```js
{
  "start": "Expression",
  "cst": {
    "Expression": {
      "p": [{"r": "Term"}, {"l": {"p": [{"r": "AddOp"}, {"r": "Term"}]}}],
      "ast": ["foldl", ["$", "/children/0"], ["$", "/children/1"]]
    },
    "Term": {
      "p": [{"r": "Factor"}, {"l": {"p": [{"r": "MulOp"}, {"r": "Factor"}]}}],
      "ast": ["foldl", ["$", "/children/0"], ["$", "/children/1"]]
    },
    "Factor": {
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
    "Number": ["num", ["$", "/raw"]],
    "AddOp": ["$", "/raw"],
    "MulOp": ["$", "/raw"]
  }
}
```

### JSON Parser

A complete JSON parser grammar:

```js
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

Debug traces can be captured during grammar development to understand parsing behavior. Debug trace nodes typically form a tree structure that mirrors the grammar execution, allowing developers to:

- **Trace Execution**: Follow the parser's decision-making process through the grammar
- **Identify Failures**: Pinpoint where parsing fails and why certain rules don't match
- **Performance Analysis**: Understand which rules are expensive or cause excessive backtracking
- **Grammar Validation**: Verify that the grammar behaves as expected on test inputs

Debug trace nodes generally contain information about:
- Rule name being executed
- Input position and matched text
- Success or failure status
- Child trace nodes for nested rule calls
- Backtracking information

#### Grammar Inspection

Most JSON Grammar implementations provide utilities to:
- **Print Grammar Structure**: Display the grammar in a human-readable format
- **Visualize Parse Trees**: Show the concrete syntax tree structure
- **Export Grammar Metadata**: Generate documentation or schema information
- **Validate Grammar Rules**: Check for common issues like left recursion or unreachable rules

### Maintainability

1. **Documentation**: Include comments and examples in grammar files
2. **Modularity**: Break complex grammars into logical sections
3. **Version Control**: Track grammar evolution through version control
4. **Testing**: Maintain comprehensive test suites for grammar rules

### Common Patterns

#### Optional Elements
```js
{"u": [{"r": "Element"}, ""]}  // Matches: Element OR nothing
```

#### Comma-Separated Lists
```js
{
  "u": [
    {
      "p": [                                     // Matches: item1, item2, item3
        {"r": "Item"},
        {"l": {"p": [",", {"r": "Item"}], "ast": ["$", "/children/1"]}}
      ],
      "ast": ["concat", ["push", [[]], ["$", "/children/0"]], ["$", "/children/1"]]
    },
    ""                                           // OR empty list
  ]
}
```

#### Identifier with Keywords
```js
{
  "cst": {
    "Identifier": {
      "u": [                                     // Matches: any identifier except keywords
        {"r": "Keyword"},
        "/[a-zA-Z_][a-zA-Z0-9_]*/"
      ]
    },
    "Keyword": {
      "u": ["if", "else", "while", "for", "return"]  // Matches: reserved keywords
    }
  }
}
```