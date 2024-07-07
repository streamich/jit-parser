import {grammar as jsonGrammar} from './json';
import type {Grammar} from '../types';

/**
 * JSON Expression grammar.
 * 
 * ```
 * ["add", 1, 2]
 * ```
 * 
 * Result:
 * 
 * ```
 * (add 1 2)
 * ```
 */
export const grammar: Grammar = {
  start: 'WsExpression',

  cst: {
    ...jsonGrammar.cst,
    W: {...(jsonGrammar.cst as any).WOpt, repeat: '+'},
    WsExpression: {
      p: [{r: 'WOpt'}, {r: 'Expression'}, {r: 'WOpt'}],
      ast: ['$', '/children/0'],
    },
    Expression: {
      p: [
        '(',
        {r: 'Operator'},
        {r: 'W'},
        {r: 'Operands'},
        {r: 'WOpt'},
        ')',
      ],
      children: {
        0: 'operator',
        1: 'operands',
      },
    },
    Operator: /[^\s\n\t\r]+/,
    Operands: {
      p: [
        {r: 'Operand'},
        {
          l: {
            p: [{r: 'W'}, {r: 'Operand'}],
            ast: ['$', '/children/0'],
          },
        },
      ],
      ast: ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1/children', [[]]]],
    },
    Operand: {
      u: [
        {r: 'Expression'},
        {r: 'TValue'},
      ],
      ast: ['$', '/children/0'],
    },
  },

  ast: {
    ...jsonGrammar.ast,
  },
};
