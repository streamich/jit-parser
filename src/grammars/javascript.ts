import type {Grammar, RefNode} from '../types';

let r = 0;
const ref = (label: string = 'R' + r++) => {
  return {r: label, toString: () => label} as RefNode & string;
};

const EPSILON = '';
const W = ref();
const WOpt = ref();
const Identifier = ref('Identifier');
const Literal = ref();
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

/**
 * JavaScript grammar.
 */
export const grammar: Grammar = {
  start: 'Program',

  cst: {
    [W]: {t: /\s+/, ast: null},
    [WOpt]: {t: /\s*/, ast: null},
    Program: {
      u: [
          Statement,
      ],
    },

    [Statement]: {
      u: [
        VariableStatement,
      ],
    },

    [VariableStatement]: {
      p: [VariableStatementKind, W, Identifier, WOpt, '=', WOpt, Expression, /;|\n|$/],
      ast: ['o.del', ['o.set', ['$', ''],
        'kind', ['$', '/children/0'],
        'id', ['$', '/children/1'],
        'declarations', ['$', '/children/2'],
      ], 'children'],
    },
    [VariableStatementKind]: {
      t: /var|let|const/,
      ast: ['$', '/raw'],
    },

    [Expression]: {
      type: 'Expression',
      u: [AddExpression, Literal],
    },

    [AddExpression]: {
      type: 'AdditiveExpression',
      p: [MulExpression, AddExpressionCont],
      ast: AstBinaryExpression,
    },
    [AddExpressionCont]: {
      u: [[WOpt, AddOperator, WOpt, AddExpression, AddExpressionCont], EPSILON],
      ast: AstBinaryExpressionCont,
    },

    [MulExpression]: {
      type: 'MultiplicativeExpression',
      p: [Literal, MulExpressionCont],
      ast: AstBinaryExpression,
    },
    [MulExpressionCont]: {
      u: [[WOpt, MulOperator, WOpt, MulExpression, MulExpressionCont], EPSILON],
      ast: AstBinaryExpressionCont,
    },

    [Identifier]: {
      t: /[a-zA-Z_]+/
    },

    [Literal]: {
      type: 'Literal',
      u: [
        {r: 'NullLiteral'},
        {r: 'BooleanLiteral'},
        {r: 'NumericLiteral'},
        // {r: 'StringLiteral'},
      ],
      // ast: ['o.del', ['o.set', ['$', '/ast'], 'value', ['$', '/ast/children/0']], 'children'],
      // ast: ['$', '/ast/children/0'],
    },

    NullLiteral: 'null',
    BooleanLiteral: /true|false/,
    NumericLiteral: {
      t: /\d+/,
      ast: ['o.set', ['$', ''], 'value', ['num', ['$', '/raw']]],
    },
  },
};
