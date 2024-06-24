import type {
  ListNode,
  ProductionNode,
  ProductionNodeShorthand,
  RefNode,
  TerminalNode,
  TerminalNodeShorthand,
  UnionNode,
} from './types';

export const scrub = (str: string) => JSON.parse(JSON.stringify(str));

export const isTerminalShorthandNode = (item: any): item is TerminalNodeShorthand =>
  typeof item === 'string' || item instanceof RegExp;

export const isTerminalNode = (item: any): item is TerminalNode =>
  typeof item === 'object' && item && typeof item.t !== 'undefined' && !isTerminalShorthandNode(item);

export const isProductionShorthandNode = (item: any): item is ProductionNodeShorthand => item instanceof Array;

export const isProductionNode = (item: any): item is ProductionNode =>
  typeof item === 'object' && item && isProductionShorthandNode(item.p);

export const isUnionNode = (item: any): item is UnionNode =>
  typeof item === 'object' && item && item.u instanceof Array;

export const isListNode = (item: any): item is ListNode =>
  typeof item === 'object' && item && typeof item.l !== 'undefined';

export const isRefNode = (item: any): item is RefNode => typeof item === 'object' && item && typeof item.r === 'string';
