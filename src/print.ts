import {printTree} from 'tree-dump/lib/printTree';
import {
  isListNode,
  isProductionNode,
  isProductionShorthandNode,
  isRefNode,
  isTerminalNode,
  isTerminalShorthandNode,
  isUnionNode,
} from './util';
import type {CstNode, Grammar, GrammarNode, ParseTraceNode, RootTraceNode} from './types';

/** @todo Add ability to print AST expression using s-expression bracket notation. */
export class GrammarPrinter {
  public static readonly print = (grammar: Grammar, tab?: string): string => {
    const printer = new GrammarPrinter(grammar);
    return printer.print(tab);
  };

  protected readonly visited = new Set<string>();

  constructor(public readonly grammar: Grammar) {}

  public print(tab?: string, type: string = this.grammar.start): string {
    this.visited.add(type);
    return this.printNode(this.grammar.cst[type], type, tab);
  }

  public printNode(node: GrammarNode, type?: string, tab?: string): string {
    if (type) this.visited.add(type);
    if (isTerminalNode(node)) {
      const pattern =
        typeof node.t === 'string'
          ? JSON.stringify(node.t)
          : Array.isArray(node.t)
            ? '(' + node.t.map((c) => JSON.stringify(c)).join(' | ') + ')' + (node.repeat ?? '')
            : node.t;
      return `${node.type ?? type ?? 'Text'} (terminal): ${pattern}`;
    } else if (isTerminalShorthandNode(node)) {
      return this.printNode({t: node}, type, tab);
    } else if (isRefNode(node)) {
      const reference = node.r;
      const visited = this.visited.has(reference);
      if (!type) {
        if (visited) return `→ ${reference}`;
        else return this.printNode(this.grammar.cst[reference], reference, tab);
      }
      this.visited.add(reference);
      return (
        `${type ?? 'Reference'} (reference)` +
        (visited ? ' →' : printTree(tab, [(tab) => this.printNode(this.grammar.cst[reference], reference, tab)]))
      );
    } else if (isProductionNode(node)) {
      return (
        `${node.type ?? type ?? 'Production'} (production)` +
        printTree(
          tab,
          node.p.map((n) => (tab) => this.printNode(n, undefined, tab)),
        )
      );
    } else if (isProductionShorthandNode(node)) {
      return this.printNode({p: node}, type, tab);
    } else if (isUnionNode(node)) {
      return (
        `${node.type ?? type ?? 'Union'} (union)` +
        printTree(
          tab,
          node.u.map((n) => (tab) => this.printNode(n, undefined, tab)),
        )
      );
    } else if (isListNode(node)) {
      return (
        `${node.type ?? type ?? 'List'} (list)` + printTree(tab, [(tab) => this.printNode(node.l, undefined, tab)])
      );
    }
    return 'unknown';
  }
}

const formatMatch = (cst: CstNode, text?: string): string => {
  let formatted = ' ' + cst.pos + ':' + cst.end;
  if (text) {
    const end = cst.pos + Math.min(32, cst.end - cst.pos);
    const slice = text.slice(cst.pos, end) + (end !== cst.end ? '...' : '');
    const sliceFormatted =
      slice.indexOf('"') >= 0 && slice.indexOf("'") === -1
        ? "'" + JSON.stringify(slice).slice(1, -1).replaceAll('\\"', '"') + "'"
        : JSON.stringify(slice);
    formatted += ' → ' + sliceFormatted;
  }
  return formatted;
};

export const printTraceNode = (trace: RootTraceNode | ParseTraceNode, tab?: string, text?: string): string => {
  const pattern = (trace as ParseTraceNode).ptr;
  const type = pattern?.type ?? ((trace as ParseTraceNode).ptr ? 'Anonymous' : 'Root');
  const match = (trace as ParseTraceNode).match;
  return (
    `${type}` +
    (match ? formatMatch(match, text) : '') +
    (trace.children && trace.children.length
      ? printTree(
          tab,
          trace.children.map((n) => (tab) => printTraceNode(n, tab, text)),
        )
      : '')
  );
};

export const printCst = (cst: CstNode, tab?: string, text?: string): string => {
  const pattern = cst.ptr;
  const type = pattern.type;
  return (
    `${type}` +
    formatMatch(cst, text) +
    (cst.children && cst.children.length
      ? printTree(
          tab,
          cst.children.map((n) => (tab) => printCst(n, tab, text)),
        )
      : '')
  );
};
