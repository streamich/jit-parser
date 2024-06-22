import type {Grammar} from '../types';

/**
 * JSON grammar.
 */
export const grammar: Grammar = {
  start: 'Value',

  cst: {
    Value: [{r: 'Ws'}, {r: 'TValue'}, {r: 'Ws'}],

    Ws: /\s*/, // Whitespace

    TValue: {
      u: [
        {r: 'Null'},
        {r: 'Boolean'},
        {r: 'Number'},
        {r: 'String'},
        {r: 'Array'},
        {r: 'Object'},
      ],
    },

    Null: 'null',

    Boolean: {
      u: ['true', 'false'],
      leaf: true,
    },

    Number: /\-?0|(\-?[1-9][0-9]*)(\.[0-9]+)?/,

    String: {
      p: [{t: '"', ast: null}, /[^"]*/, {t: '"', ast: null}],
      leaf: true,
    },

    Array: ['[', {r: 'Elements'}, ']'],
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
          ast: ['push', ['$', '/ast/children/0'], ['$', '/ast/children/1']],
        },
        {r: 'Ws'},
      ],
    },

    Object: ['{', {r: 'Members'}, '}'],
    Members: {
      u: [
        {
          p: [
            {
              l: {
                p: [{r: 'Entry'}, {t: ',', ast: null}],
                ast: ['$', '/ast/children/0'],
              },
              ast: ['$', '/ast/children']
            },
            {r: 'Entry'}
          ],
          ast: ['push', ['$', '/ast/children/0'], ['$', '/ast/children/1']],
        },
        {r: 'Ws'},
      ],
    },
    Entry: [{r: 'Ws'}, {r: 'String'}, {r: 'Ws'}, ':', {r: 'Value'}],
  },

  ast: {
    Value: ['$', '/cst/children/1/ast'],
    Ws: null,
    TValue: ['$', '/cst/children/0/ast'],
    Boolean: ['o.set', ['$', '/ast'],
      'value', ['?', ['==', ['$', '/cst/children/0/raw'], 'true'], true, false],
    ],
    Number: ['o.set', ['$', '/ast'],
      'value', ['num', ['$', '/cst/raw']],
    ],
    String: ['o.set', ['$', '/ast'],
      'value', ['$', '/cst/children/1/raw'],
    ],
    Array: ['o.set', ['$', '/ast'],
      'children', ['$', '/ast/children/1/children'],
    ],
    Elements: ['o.set', ['$', '/ast'],
      'children', ['?', ['len', ['$', '/ast/children']],
        ['$', '/ast/children/0'], [[]]]
    ],
    Object: ['o.set', ['$', '/ast'],
      'children', ['$', '/ast/children/1'],
    ],
    Members: ['?', ['len', ['$', '/ast/children']],
      ['$', '/ast/children/0'], [[]]],
    Entry: ['o.del',
      ['o.set', ['$', '/ast'],
        'key', ['$', '/ast/children/0'],
        'value', ['$', '/ast/children/2'],
      ],
      'children',
    ],
  },
};
