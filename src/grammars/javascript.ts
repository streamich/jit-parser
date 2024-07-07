import type {Grammar, RefNode} from '../types';

let r = 0;
const ref = (label: string = 'R' + r++) => {
  return {r: label, toString: () => label} as RefNode & string;
};

const EPSILON = '';
const Whitespace = ref();
const WhitespaceOpt = ref();
const ASI = ref();
const LineComment = ref('LineComment');
const BlockComment = ref('BlockComment');
const ShebangComment = ref('ShebangComment');
const Separator = ref();
const SeparatorOpt = ref();

const Identifier = ref('Identifier');
const Literal = ref('Literal');
const Expression = ref();
const AddExpression = ref();
const AddOperator = {t: /[\+\-]/, ast: ['$', '/raw']};
const AddExpressionCont = ref();
const MulExpression = ref();
const MulOperator = {t: /[\*\/]/, ast: ['$', '/raw']};
const MulExpressionCont = ref();
const Statement = ref();
const VariableStatement = ref('VariableStatement');
const VariableStatementKind = ref();
const ReservedWord = ref('ReservedWord');
const ReturnStatement = ref('ReturnStatement');
const ContinueStatement = ref('ContinueStatement');
const BreakStatement = ref('BreakStatement');
const BlockStatement = ref('BlockStatement');
const StatementList = ref('StatementList');

const AstBinaryExpression = [
  '?',
  ['$', '/children/1/children/0', ''],
  [
    'o.del',
    [
      'o.set',
      ['$', ''],
      'left',
      ['$', '/children/0'],
      'operator',
      ['$', '/children/1/children/0', ''],
      'right',
      ['$', '/children/1/children/1', null],
    ],
    'children',
  ],
  ['$', '/children/0'],
];
const AstBinaryExpressionCont = ['?', ['len', ['$', '/children']], ['$', '/children/0'], null];

const keywords = [
  'await',
  'break',
  'case',
  'class',
  'catch',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
];

/**
 * JavaScript grammar.
 */
export const grammar: Grammar = {
  start: 'Program',

  cst: {
    Program: {
      p: [StatementList, SeparatorOpt, /$/],
      ast: ['o.del', ['o.set', ['$', ''], 'body', ['$', '/children/0/children', [[]]]], 'children'],
    },

    [Whitespace]: /\s+/,
    [WhitespaceOpt]: /\s*/,
    [ASI]: {
      t: /;|\n|$/,
      ast: null,
    },
    [LineComment]: /\/\/.*(\n|$)/,
    [BlockComment]: /\/\*.*?\*\//,
    [ShebangComment]: /#!.*(\n|$)/,
    [Separator]: {
      l: {
        u: [Whitespace, LineComment, BlockComment],
      },
      ast: null,
    },
    [SeparatorOpt]: {
      u: [Separator, EPSILON],
      ast: null,
    },

    [BlockStatement]: {
      p: ['{', StatementList, SeparatorOpt, '}'],
      ast: ['o.del', ['o.set', ['$', ''], 'body', ['$', '/children/0/children', [[]]]], 'children'],
    },

    [StatementList]: {
      l: {
        p: [
          SeparatorOpt,
          {
            u: [Statement],
            ast: ['$', '/children/0'],
          },
        ],
        ast: ['$', '/children/0'],
      },
    },

    [Statement]: {
      u: [BlockStatement, ReturnStatement, ContinueStatement, BreakStatement, VariableStatement],
      ast: ['$', '/children/0'],
    },

    [VariableStatement]: {
      p: [VariableStatementKind, Separator, Identifier, SeparatorOpt, '=', SeparatorOpt, Expression, SeparatorOpt, ASI],
      ast: [
        'o.del',
        [
          'o.set',
          ['$', ''],
          'kind',
          ['$', '/children/0'],
          'id',
          ['$', '/children/1'],
          'declarations',
          ['$', '/children/2'],
        ],
        'children',
      ],
    },
    [VariableStatementKind]: {
      t: /var|let|const/,
      ast: ['$', '/raw'],
    },

    [ReturnStatement]: {
      p: [
        'return',
        {
          u: [
            {
              p: [Separator, Expression],
              ast: ['$', '/children/0'],
            },
            EPSILON,
          ],
          ast: ['$', '/children/0', null],
        },
        SeparatorOpt,
        ASI,
      ],
      children: {
        0: 'argument',
      },
    },

    [ContinueStatement]: {
      p: [
        {t: 'continue', ast: null /* tags: ['keyword'] */},
        {
          u: [
            {
              p: [Separator, Identifier],
              ast: ['$', '/children/0'],
            },
            EPSILON,
          ],
          ast: ['$', '/children/0', null],
        },
        SeparatorOpt,
        ASI,
      ],
      children: {
        0: 'label',
      },
    },

    [BreakStatement]: {
      p: ['break', Separator, {u: [Identifier, '']}, SeparatorOpt, ASI],
    },

    [Expression]: {
      type: 'Expression',
      u: [AddExpression, Literal],
      ast: ['$', '/children/0'],
    },

    [AddExpression]: {
      type: 'AdditiveExpression',
      p: [MulExpression, AddExpressionCont],
      ast: AstBinaryExpression,
    },
    [AddExpressionCont]: {
      u: [[WhitespaceOpt, AddOperator, WhitespaceOpt, AddExpression, AddExpressionCont], EPSILON],
      ast: AstBinaryExpressionCont,
    },

    [MulExpression]: {
      type: 'MultiplicativeExpression',
      p: [Literal, MulExpressionCont],
      ast: AstBinaryExpression,
    },
    [MulExpressionCont]: {
      u: [[WhitespaceOpt, MulOperator, WhitespaceOpt, MulExpression, MulExpressionCont], EPSILON],
      ast: AstBinaryExpressionCont,
    },

    [Identifier]: {
      t: /[a-zA-Z_]+/,
      ast: ['o.del', ['o.set', ['$', ''], 'name', ['$', '/raw']], 'raw'],
    },

    [Literal]: {
      u: [
        {r: 'NullLiteral'},
        {r: 'BooleanLiteral'},
        {r: 'NumericLiteral'},
        // {r: 'StringLiteral'},
      ],
      ast: ['o.del', ['o.set', ['$', ''], 'value', ['$', '/children/0/value']], 'children'],
    },

    NullLiteral: 'null',
    BooleanLiteral: /true|false/,
    NumericLiteral: {
      t: /\d+/,
      ast: ['o.set', ['$', ''], 'value', ['num', ['$', '/raw']]],
    },

    // See: https://tc39.es/ecma262/#prod-ReservedWord
    [ReservedWord]: {
      t: keywords,
    },
  },
};
