import type {Grammar} from '../types';

/**
 * A simple math expression grammar.
 */
export const grammar: Grammar = {
  start: 'SingleExpression',

  cst: {
    Whitespace: {t: /\s*/, ast: null},

    SingleExpression: {
      p: [{r: 'Whitespace'}, {r: 'Expression'}, {r: 'Whitespace'}],
      ast: ['$', '/children/0'],
    },

    Expression: {
      u: [{r: 'AdditiveExpression'}, {r: 'Literal'}],
      ast: ['$', '/children/0'],
    },

    AdditiveExpression: {
      p: [{r: 'MultiplicativeExpression'}, {r: 'AdditiveExpressionCont'}],
      ast: ['?', ['==', ['len', ['$', '/children']], 1], ['$', '/children/0'],
        ['?', ['==', ['$', '/children/1/children/0'], '+'],
          ['+', ['$', '/children/0'], ['$', '/children/1/children/1', 1]],
          ['-', ['$', '/children/0'], ['$', '/children/1/children/1', 1]]
        ]
      ],
    },
    AdditiveExpressionCont: {
      u: [
        [
          {r: 'Whitespace'},
          {t: ['+', '-'], ast: ['$', '/raw']},
          {r: 'Whitespace'},
          {r: 'AdditiveExpression'},
          {r: 'AdditiveExpressionCont'},
        ],
        '',
      ],
      ast: ['$', '/children/0', 0],
    },

    MultiplicativeExpression: {
      p: [{r: 'Literal'}, {r: 'MultiplicativeExpressionCont'}],
      ast: ['?', ['==', ['len', ['$', '/children']], 1], ['$', '/children/0'],
        ['?', ['==', ['$', '/children/1/children/0'], '*'],
          ['*', ['$', '/children/0'], ['$', '/children/1/children/1', 1]],
          ['/', ['$', '/children/0'], ['$', '/children/1/children/1', 1]]
        ]
      ],
    },
    MultiplicativeExpressionCont: {
      u: [
        [
          {r: 'Whitespace'},
          {t: ['*', '/'], ast: ['$', '/raw']},
          {r: 'Whitespace'},
          {r: 'MultiplicativeExpression'},
          {r: 'MultiplicativeExpressionCont'},
        ],
        '',
      ],
      ast: ['$', '/children/0', 0],
    },

    Literal: {
      t: /\d+/,
      ast: ['num', ['$', '/raw']],
    },
  },
};
