import type {Grammar, NonTerminal, TerminalShorthand} from './types';

const t = (name: TemplateStringsArray): TerminalShorthand => name[0] as TerminalShorthand;
const n = <Name extends string>(name: TemplateStringsArray): NonTerminal<Name> => [name[0] as Name];

/**
 * JSON grammar.
 */
export const grammar: Grammar = {
  start: 'Value',
  rules: {
    Value: [
      [n`Whitespace`, n`TrimmedValue`, n`Whitespace`],
    ],
    Whitespace: [
      /\s*/,
    ],

    TrimmedValue: [
      n`Null`,
      n`Boolean`,
      n`Number`,
      n`String`,
      n`Array`,
      n`Object`,
    ],

    Null: [
      'null',
    ],

    Boolean: [
      'true',
      'false',
    ],

    Number: {
      match: [
        /-?0|(-?[1-9][0-9]*)(\.[0-9]+)?/,
      ],
      ast: {
        type: 'Number',
        value: ['num', ['$', '/value']],
      },
    },

    String: [
      [t`"`, n`StringValue`, t`"`]
    ],
    StringValue: [
      /[^"]*/
    ],

    Array: [
      ['[', n`Elements`, ']']
    ],
    Elements: [
      [n`Value`, ',', n`Elements`],
      n`Value`,
    ],

    Object: {
      match: [
        ['{', n`Members`, '}'],
      ],
      ast: {
        members: {},
      },
    },
    Members: {
      match: [
        [n`Pair`, ',', n`Members`],
        n`Pair`,
      ],
      // onExit: ['=', ['$', '/parent/members'], ['$', '/node']],
    },
    Pair: [
      [n`Whitespace`, n`String`, n`Whitespace`, ':', n`Value`],
    ],
  }
};
