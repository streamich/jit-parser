import type {Grammar} from './types';

/**
 * JSON grammar.
 */
export const grammar: Grammar = {
  start: 'Value',
  rules: {
    Value: [
      [{r: 'Ws'}, {r: 'TrimmedValue'}, {r: 'Ws'}],
    ],

    Ws: { // Whitespace
      t: /\s*/,
      ast: null,
    },

    TrimmedValue: {
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
    },

    Number: {
      t: /\-?0|(\-?[1-9][0-9]*)(\.[0-9]+)?/,
      // ast: {
      //   type: 'Number',
      //   // value: ['num', ['$', '/value']],
      // },
    },

    String: ['"', /[^"]*/, '"'],

    Array: ['[', {r: 'Elements'}, ']'],
    Elements: {
      u: [
        [{r: 'Value'}, ',', {r: 'Elements'}],
        {r: 'Value'},
        '',
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
        [{r: 'Pair'}, ',', {r: 'Members'}],
        {r: 'Pair'},
        '',
      ],
    },
    Pair: [{r: 'Ws'}, {r: 'String'}, {r: 'Ws'}, ':', {r: 'Value'}],
  }
};
