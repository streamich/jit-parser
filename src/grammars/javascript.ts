import type {Grammar, RefNode} from '../types';

let r = 0;
const ref = () => {
  const label = 'R' + r++;
  return {r: label, toString: () => label} as RefNode & string;
};

const EPSILON = {t: '', ast: null};
const W = ref();
const Literal = ref();
const Expression = ref();
const AddExpression = ref();
const AddOperator = {t: /[\+\-]/, ast: ['$', '/ast/raw']};
const AddExpressionCont = ref();
const MulExpression = ref();
const MulOperator = {t: /[\*\/]/, ast: ['$', '/ast/raw']};
const MulExpressionCont = ref();

const AstBinaryExpression = [
  '?',
  ['$', '/ast/children/1/children/0', ''],
  [
    'o.del',
    [
      'o.set',
      ['$', '/ast'],
      'left',
      ['$', '/ast/children/0'],
      'operator',
      ['$', '/ast/children/1/children/0', ''],
      'right',
      ['$', '/ast/children/1/children/1', null],
    ],
    'children',
  ],
  ['$', '/ast/children/0'],
];
const AstBinaryExpressionCont = ['?', ['len', ['$', '/ast/children']], ['$', '/ast/children/0'], null];

/**
 * JavaScript grammar.
 */
export const grammar: Grammar = {
  start: 'Program',

  cst: {
    [W.r]: {t: /\s*/, ast: null},
    Program: Expression,

    [Expression.r]: {
      type: 'Expression',
      u: [AddExpression, Literal],
    },

    [AddExpression]: {
      type: 'AdditiveExpression',
      p: [MulExpression, AddExpressionCont],
      ast: AstBinaryExpression,
    },
    [AddExpressionCont.r]: {
      u: [[W, AddOperator, W, AddExpression, AddExpressionCont], EPSILON],
      ast: AstBinaryExpressionCont,
    },

    [MulExpression.r]: {
      type: 'MultiplicativeExpression',
      p: [Literal, MulExpressionCont],
      ast: AstBinaryExpression,
    },
    [MulExpressionCont.r]: {
      u: [[W, MulOperator, W, MulExpression, MulExpressionCont], EPSILON],
      ast: AstBinaryExpressionCont,
    },

    [Literal.r]: {
      type: 'Literal',
      u: [
        {r: 'NullLiteral'},
        {r: 'BooleanLiteral'},
        {r: 'NumericLiteral'},
        // {r: 'StringLiteral'},
      ],
      // ast: ['o.del', ['o.set', ['$', '/ast'], 'value', ['$', '/ast/children/0']], 'children'],
      ast: ['$', '/ast/children/0'],
    },

    NullLiteral: 'null',
    BooleanLiteral: /true|false/,
    NumericLiteral: /\d+/,
  },
};
