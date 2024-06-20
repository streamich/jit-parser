import type {Grammar} from '../types';

/**
 * JSON grammar.
 */
export const grammar: Grammar = {
  start: 'Value',
  rules: {
    Value: {
      p: [{r: 'Ws'}, {r: 'TValue'}, {r: 'Ws'}],
      ast: ['$', '/cst/children/1/ast'],
    },

    Ws: { // Whitespace
      t: /\s*/,
      ast: null,
    },

    TValue: {
      u: [
        {r: 'Null'},
        {r: 'Boolean'},
        {r: 'Number'},
        {r: 'String'},
        {r: 'Array'},
        {r: 'Object'},
      ],
      ast: ['$', '/cst/children/0/ast'],
    },

    Null: 'null',

    Boolean: {
      u: ['true', 'false'],
      ast: ['o.set', ['$', '/ast'],
        'value', ['?', ['==', ['$', '/cst/children/0/raw'], 'true'], true, false],
      ],
    },

    Number: {
      t: /\-?0|(\-?[1-9][0-9]*)(\.[0-9]+)?/,
      ast: ['o.set', ['$', '/ast'],
        'value', ['num', ['$', '/cst/raw']],
      ],
    },

    String: {
      p: [{t: '"', ast: null}, /[^"]*/, {t: '"', ast: null}],
      ast: ['o.set', ['$', '/ast'],
        'value', ['$', '/cst/children/1/raw'],
      ],
    },

    Array: {
      p: ['[', {r: 'Elements'}, ']'],
      ast: ['o.set', ['$', '/ast'],
        'elements', ['$', '/cst/children/1/ast'],
      ],
    },
    Elements: {
      u: [
        {
          p: [
            {
              l: {
                p: [{r: 'Value'}, {t: ',', ast: null}],
                ast: ['$', '/ast/children/0']  
              },
              ast: ['$', '/ast/children']
            },
            {r: 'Value'}
          ],
          ast: ['concat', ['$', '/ast/children/0'], ['values',
            ['o.set', {}, 'child', ['$', '/ast/children/1']]
          ]],
        },
        '',
      ],
      ast: ['o.set', ['$', '/ast'],
        'children', ['$', '/ast/children/0']
      ],
    },

    Object: {
      p: ['{', {r: 'Members'}, '}'],
      // ast: {
      //   members: {},
      // },
    },
    Members: {
      u: [
        [{l: [{r: 'Pair'}, ',']}, {r: 'Pair'}],
        // [{r: 'Pair'}, ',', {r: 'Members'}],
        // {r: 'Pair'},
        '',
      ],
    },
    Pair: [{r: 'Ws'}, {r: 'String'}, {r: 'Ws'}, ':', {r: 'Value'}],
  }
};
