import type {Grammar} from '../types';

/**
 * A basic HTML grammar. This grammar is not intended to be complete or 100%
 * correct. Its purpose is to be small and simple.
 * 
 * It can be used in applications, which do not require a full and complete HTML
 * parser. For example, it can be used to parse HTML-like templates, or
 * rich-text clipboard buffers.
 */
export const grammar: Grammar = {
  start: 'Fragment',
  cst: {
    Fragment: {
      l: {r: 'Node'},
      ast: ['o.set', ['$', ''], 'type', 'Element'],
    },
    Node: {
      u: [{r: 'Element'}, {r: 'Text'}],
      ast: ['$', '/children/0'],
    },
    Element: {
      p: [{r: 'Element0'}, {u: [
        '/>',
        // {p: ['>', {r: 'Fragment'}, '</', {r: 'Tag'}, '>']},
        {p: ['>', {r: 'Fragment'}, /<\/[^>]+>/]},
      ]}],
      // ast: ['o.set', ['$', ''],
      //   'tag', ['$', '/children/0/raw'],
      //   'children', ['$', '/children/1/children'],
      // ],
    },
    Element0: {
      p: ['<', {r: 'Tag'}, {r: 'Attrs'}],
    },
    Tag: {t: /[^>\s]+/},
    Attrs: {l: {r: 'Attr'}},
    Attr: {
      p: [{r: 'WOpt'}, 'key', {r: 'WOpt'}, '=', {r: 'WOpt'}, '"', 'value', '"'],
    },
    Text: /[^<]+/,
    WOpt: {t: [' ', '\n', '\t', '\r'], repeat: '*', ast: null, sample: ' '},
  },
};
