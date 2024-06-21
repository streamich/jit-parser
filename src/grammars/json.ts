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
      leaf: true,
      ast: ['o.set', ['$', '/ast'],
        'value', ['?', ['==', ['$', '/cst/children/0/raw'], 'true'], true, false],
      ],
    },

    Number: {
      t: /\-?0|(\-?[1-9][0-9]*)(\.[0-9]+)?/,
      // leaf: true,
      ast: ['o.set', ['$', '/ast'],
        'value', ['num', ['$', '/cst/raw']],
      ],
    },

    String: {
      p: [{t: '"', ast: null}, /[^"]*/, {t: '"', ast: null}],
      leaf: true,
      ast: ['o.set', ['$', '/ast'],
        'value', ['$', '/cst/children/1/raw'],
      ],
    },

    Array: {
      p: ['[', {r: 'Elements'}, ']'],
      ast: ['o.set', ['$', '/ast'],
        'children', ['$', '/ast/children/1/children'],
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
        {r: 'Ws'},
      ],
      ast: ['o.set', ['$', '/ast'],
        'children', ['?', ['len', ['$', '/ast/children']],
          ['$', '/ast/children/0'], [[]]]
      ],
    },

    Object: {
      p: ['{', {r: 'Members'}, '}'],
      ast: ['o.set', ['$', '/ast'],
        'children', ['$', '/ast/children/1'],
      ],
    },
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
          ast: ['concat', ['$', '/ast/children/0'], ['values',
            ['o.set', {}, 'child', ['$', '/ast/children/1']]
          ]],
        },
        {r: 'Ws'},
      ],
      ast: ['?', ['len', ['$', '/ast/children']],
        ['$', '/ast/children/0'], [[]]]
    },
    Entry: {
      p: [{r: 'Ws'}, {r: 'String'}, {r: 'Ws'}, ':', {r: 'Value'}],
      ast: ['o.del',
        ['o.set', ['$', '/ast'],
          'key', ['$', '/ast/children/0'],
          'value', ['$', '/ast/children/2'],
        ],
        'children',
      ],
    },
  }
};
