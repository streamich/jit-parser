import type {AstNodeExpression, Grammar} from '../types';

/**
 * A Lisp-like, round-bracket surface syntax for
 * [JSON Expression](https://jsonjoy.com/specs/json-expression).
 *
 * Each expression is a parenthesized list `(<operator> ...<operands>)`:
 *
 * - the first member is the *operator* — an unquoted symbol (e.g. `+`, `get`,
 *   `o.set`) or a quoted JSON string when it contains spaces/special chars;
 * - the remaining members are *operands*, each of which is either a nested
 *   expression or a literal JSON value.
 *
 * The parser produces the canonical JSON Expression form — a JSON array whose
 * first element is the operator string and whose tail are the operand values.
 *
 * ```
 * (+ 1 2)              =>  ["+", 1, 2]
 * (+ 1 (* 2 3))        =>  ["+", 1, ["*", 2, 3]]
 * (get "/foo")         =>  ["get", "/foo"]
 * (== (get "/a") null) =>  ["==", ["get", "/a"], null]
 * 42                   =>  42
 * {"a": 1}             =>  {"a": 1}
 * ```
 *
 * Note: in JSON Expression an array in operand position is itself an
 * expression, so a *literal* array operand is wrapped in a nullary operator
 * (double brackets) — this is the correct, evaluable encoding:
 *
 * ```
 * (in (get "/x") ["a", "b"])  =>  ["in", ["get", "/x"], [["a", "b"]]]
 * [1, 2, 3]                   =>  [[1, 2, 3]]
 * ```
 *
 * Single-line `// ...` comments are allowed anywhere whitespace is, and run to
 * the end of the line:
 *
 * ```
 * // pick the larger value
 * (max (get "/a") // left
 *      (get "/b")) // right
 * ```
 */

// JSON literal terminals (borrowed from the JSON grammar).
const NUMBER = /\-?(0|([1-9][0-9]{0,25}))(\.[0-9]{1,25})?([eE][\+\-]?[0-9]{1,25})?/;
const STRING = /"(?:[^"\\]|\\.)*"/;

// Strips the surrounding quotes off a matched JSON string's raw text. Note: it
// does not interpret escape sequences — the inner text is taken verbatim.
const UNQUOTE: AstNodeExpression = ['substr', ['$', '/raw'], 1, ['-', ['len', ['$', '/raw']], 1]];

export const grammar: Grammar = {
  start: 'Root',

  cst: {
    // ----------------------------------------------- whitespace & comments
    // A `// ...` single-line comment runs to the end of the line (or input) and
    // is treated exactly like whitespace anywhere `WOpt`/`W` are allowed.
    WsChar: {t: [' ', '\n', '\t', '\r'], repeat: '+', sample: ' '},
    Comment: {t: /\/\/[^\n]*(\n|$)/, sample: '// comment\n'},
    WsUnit: {u: [{r: 'WsChar'}, {r: 'Comment'}]},
    // Optional run of whitespace/comments.
    WOpt: {l: {r: 'WsUnit'}, ast: null, sample: ' '},
    // Mandatory whitespace/comments (at least one unit).
    W: {p: [{r: 'WsUnit'}, {r: 'WOpt'}], ast: null, sample: ' '},

    // ------------------------------------------------------------------- root
    // A single operand (expression or literal), surrounded by optional
    // whitespace, that must consume the entire input.
    Root: {
      p: [{r: 'WOpt'}, {r: 'Operand'}, {r: 'WOpt'}, {r: 'End'}],
      ast: ['$', '/children/0', null],
    },
    End: {t: /$/, ast: null},

    // ------------------------------------------------------------- expression
    // (operator operand*) -> [operator, ...operands]
    Expression: {
      p: ['(', {r: 'WOpt'}, {r: 'Operator'}, {r: 'OperandList'}, {r: 'WOpt'}, ')'],
      ast: ['concat', ['push', [[]], ['$', '/children/0', null]], ['$', '/children/1', [[]]]],
    },

    // Operator: an unquoted symbol or a quoted JSON string; always a string.
    Operator: {
      u: [{r: 'Symbol'}, {r: 'QuotedSymbol'}],
      ast: ['$', '/children/0', null],
    },
    Symbol: {t: /[^\s()\[\]{}",]+/, ast: ['$', '/raw']},
    QuotedSymbol: {t: STRING, ast: UNQUOTE},

    // Zero or more whitespace-separated operands -> flat array of values.
    OperandList: {
      l: {p: [{r: 'W'}, {r: 'Operand'}], ast: ['$', '/children/0', null]},
      ast: ['$', '/children'],
    },
    Operand: {
      u: [{r: 'Expression'}, {r: 'ArrayOperand'}, {r: 'Value'}],
      ast: ['$', '/children/0', null],
    },
    // A literal array in operand position must be wrapped in a nullary operator
    // (`[[...]]`) so the JSON Expression evaluator treats it as a literal value
    // rather than an expression (where the array's first element would be read
    // as the operator). Scalars and objects are passed through as-is — only
    // arrays are ambiguous with expressions. (`ArrayOperand` precedes `Value`
    // in `Operand`, so every operand array is boxed here; arrays nested inside
    // literal arrays/objects go through `Value` and stay raw.)
    ArrayOperand: {
      u: [{r: 'Array'}],
      ast: ['push', [[]], ['$', '/children/0', [[]]]],
    },

    // --------------------------------------------------------- literal values
    Value: {
      u: [{r: 'Null'}, {r: 'Boolean'}, {r: 'Number'}, {r: 'String'}, {r: 'Array'}, {r: 'Object'}],
      ast: ['$', '/children/0', null],
    },
    Null: {t: 'null', ast: [null]},
    Boolean: {t: ['true', 'false'], ast: ['==', ['$', '/raw'], 'true']},
    Number: {t: NUMBER, sample: '123', ast: ['num', ['$', '/raw']]},
    String: {t: STRING, sample: '"abc"', ast: UNQUOTE},

    // [v1, v2, ...] -> raw array (null elements preserved)
    Array: {
      p: ['[', {r: 'WOpt'}, {r: 'ArrayElements'}, {r: 'WOpt'}, ']'],
      ast: ['$', '/children/0', [[]]],
    },
    ArrayElements: {
      u: [{r: 'NonEmptyArray'}, {r: 'WOpt'}],
      ast: ['$', '/children/0', [[]]],
    },
    NonEmptyArray: {
      p: [{r: 'Value'}, {r: 'ArrayTail'}],
      ast: ['concat', ['push', [[]], ['$', '/children/0', null]], ['$', '/children/1', [[]]]],
    },
    ArrayTail: {
      l: {p: [{r: 'WOpt'}, ',', {r: 'WOpt'}, {r: 'Value'}], ast: ['$', '/children/0', null]},
      ast: ['$', '/children'],
    },

    // {"k": v, ...} -> raw object (null values preserved)
    Object: {
      p: ['{', {r: 'WOpt'}, {r: 'ObjectMembers'}, {r: 'WOpt'}, '}'],
      ast: ['fromEntries', ['$', '/children/0', [[]]]],
    },
    ObjectMembers: {
      u: [{r: 'NonEmptyObject'}, {r: 'WOpt'}],
      ast: ['$', '/children/0', [[]]],
    },
    NonEmptyObject: {
      p: [{r: 'Entry'}, {r: 'ObjectTail'}],
      ast: ['concat', ['push', [[]], ['$', '/children/0', [[]]]], ['$', '/children/1', [[]]]],
    },
    ObjectTail: {
      l: {p: [{r: 'WOpt'}, ',', {r: 'WOpt'}, {r: 'Entry'}], ast: ['$', '/children/0', [[]]]},
      ast: ['$', '/children'],
    },
    // "key": value -> [key, value] pair
    Entry: {
      p: [{r: 'WOpt'}, {r: 'String'}, {r: 'WOpt'}, ':', {r: 'WOpt'}, {r: 'Value'}],
      ast: ['$', '/children'],
    },
  },
};
