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
      ast: ['?', ['==', ['len', ['$', '/children']], 1],
        ['$', '/children/0'],
        ['concat', [['', null]], ['$', '/children']],
      ],
    },
    Node: {
      u: [{r: 'Element'}, {r: 'Text'}],
      ast: ['$', '/children/0'],
    },
    Element: {
      p: [
        '<',
        {r: 'Tag'},
        {r: 'Attrs'},
        {
          u: [
            '/>',
            {
              p: ['>', {r: 'Fragment'}, /<\/[^>]+>/],
              ast: ['$', '/children/0'],
            },
          ],
          ast: ['$', '/children/0'],
        },
      ],
      ast: ['push', [[]],
        ['$', '/children/0'],
        ['?', ['==', ['len', ['$', '/children/1']], 0],
          null,
          ['$', '/children/1'],
        ],
        ['$', '/children/2']
      ],
    },
    Tag: {
      t: /[^>\s]+/,
      ast: ['$', '/raw'],
    },
    Attrs: {
      l: {r: 'Attr'},
      ast: ['fromEntries', ['$', '/children']],
    },
    Attr: {
      p: [
        {r: 'WOpt'},
        {t: /[^\s=]+/},
        {r: 'WOpt'},
        '=',
        {r: 'WOpt'},
        {t: ['"', "'"], ast: null},
        {t: /[^"']+/},
        {t: ['"', "'"], ast: null},
      ],
      ast: ['push', [[]], ['$', '/children/0/raw'], ['$', '/children/1/raw']],
    },
    Text: {
      t: /[^<]+/,
      ast: ['$', '/raw'],
    },
    WOpt: {t: [' ', '\n', '\t', '\r'], repeat: '*', ast: null, sample: ' '},
  },
};
