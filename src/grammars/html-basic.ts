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
      l: {p: ['WOpt', {r: 'Node'}]}
    },
    Node: {u: [{r: 'Element'}, {r: 'Text'}]},
    Element: {
      p: ['<', '...', '>', {r: 'Fragment'}, '<', '/', '...', '>',],
    },
    WOpt: {t: [' ', '\n', '\t', '\r'], repeat: '*', ast: null, sample: ' '},
  },

  ast: {
  },
};
