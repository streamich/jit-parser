import type {Grammar} from '../types';

const EPSILON = {t: '', ast: null};
const W = {r: 'Whitespace'};

/**
 * JavaScript grammar.
 */
export const grammar: Grammar = {
  start: 'Program',

  cst: {
    Whitespace: {t: /\s*/, ast: null},
    Program: {r: 'Expression'},

    Expression: {
      u: [
        {r: 'BinaryExpression'},
        {r: 'Literal'},
      ]
    },
    BinaryExpression: {
      p: [{r: 'Literal'}, {r: 'BinaryExpressionCont'}],
      ast: ['?', ['$', '/ast/children/1/children/0', ''],
        ['o.del', ['o.set', ['$', '/ast'],
          'left', ['$', '/ast/children/0'],
          'operator', ['$', '/ast/children/1/children/0', ''],
          'right', ['$', '/ast/children/1/children/1', null],
        ], 'children'],
        ['$', '/ast/children/0']
      ],
    },
    BinaryExpressionCont: {
      u: [
        [W, {r: 'BinaryArithmeticOperator'}, W, {r: 'BinaryExpression'}, {r: 'BinaryExpressionCont'}],
        EPSILON,
      ],
      ast: ['?', ['len', ['$', '/ast/children']], ['$', '/ast/children/0'], null],
    },

    BinaryArithmeticOperator: {t: /[\+\-\*\/]/, ast: ['$', '/ast/raw']},

    Literal: {
      u: [
        {r: 'NullLiteral'},
        {r: 'BooleanLiteral'},
        // {r: 'NumericLiteral'},
        // {r: 'StringLiteral'},
      ],
      // ast: ['o.del', ['o.set', ['$', '/ast'], 'value', ['$', '/ast/children/0']], 'children'],
      ast: ['$', '/ast/children/0'],
    },
    NullLiteral: 'null',
    BooleanLiteral: /true|false/,
  },

  ast: {
  },
};
