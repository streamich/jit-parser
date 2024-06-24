import type {Grammar} from '../types';

/**
 * JSON grammar.
 */
export const grammar: Grammar = {
  start: 'Value',

  cst: {
    Value: [{r: 'Ws'}, {r: 'TValue'}, {r: 'Ws'}],

    Ws: {t: [' ', '\n', '\t', '\r'], repeat: '*', ast: null},

    TValue: {
      u: [{r: 'Null'}, {r: 'Boolean'}, {r: 'String'}, {r: 'Object'}, {r: 'Array'}, {r: 'Number'}],
    },

    Null: 'null',
    Boolean: {t: ['true', 'false']},
    Number: /\-?(0|([1-9][0-9]{0,25}))(\.[0-9]{1,25})?([eE][\+\-]?[0-9]{1,25})?/,
    // String: /"((\\["\\/bfnrt])|(\\u[0-9a-fA-F]{4})|[^"\\])*"/,
    String: /"[^"\\]*(?:\\.|[^"\\]*)*"/,

    Array: ['[', {r: 'Elements'}, ']'],
    Elements: {
      u: [
        {
          p: [
            {r: 'Value'},
            {
              l: {
                p: [',', {r: 'Value'}],
                ast: ['$', '/children/0'],
              },
              ast: ['$', '/children'],
            },
          ],
          ast: ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']],
        },
        {r: 'Ws'},
      ],
    },

    Object: ['{', {r: 'Members'}, '}'],
    Members: {
      u: [
        {
          p: [
            {r: 'Entry'},
            {
              l: {
                p: [{t: ',', ast: null}, {r: 'Entry'}],
                ast: ['$', '/children/0'],
              },
              ast: ['$', '/children'],
            },
          ],
          ast: ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']],
        },
        {r: 'Ws'},
      ],
    },
    Entry: [{r: 'Ws'}, {r: 'String'}, {r: 'Ws'}, ':', {r: 'Value'}],
  },

  ast: {
    Value: ['$', '/children/0'],
    TValue: ['$', '/children/0'],
    Boolean: ['o.set', ['$', ''], 'value', ['?', ['==', ['$', '/raw'], 'true'], true, false]],
    Number: ['o.set', ['$', ''], 'value', ['num', ['$', '/raw']]],
    String: ['o.set', ['$', ''], 'value', ['substr', ['$', '/raw'], 1, ['-', ['len', ['$', '/raw']], 1]]],
    Array: ['o.set', ['$', ''], 'children', ['$', '/children/0/children/0', [[]]]],
    Object: ['o.set', ['$', ''], 'children', ['$', '/children/0', [[]]]],
    Members: ['?', ['len', ['$', '/children']], ['$', '/children/0'], [[]]],
    Entry: ['o.del', ['o.set', ['$', ''], 'key', ['$', '/children/0'], 'value', ['$', '/children/1']], 'children'],
  },
};
