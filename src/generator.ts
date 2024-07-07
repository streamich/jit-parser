import {
  isListNode,
  isProductionNode,
  isProductionShorthandNode,
  isRefNode,
  isTerminalNode,
  isTerminalShorthandNode,
  isUnionNode,
} from './util';
import ReRegExp from 'reregexp';
import type {
  Grammar,
  GrammarNode,
  ListNode,
  ProductionNode,
  ProductionNodeShorthand,
  RefNode,
  TerminalNode,
  TerminalNodeShorthand,
  UnionNode,
} from './types';

export interface GeneratorOpts {
  grammar: Grammar;
  rnd?: () => number;
  useSamples?: boolean;
}

export class Generator {
  protected readonly rnd: () => number;
  protected readonly grammar: Grammar;
  protected readonly samples: boolean;

  constructor(opts: GeneratorOpts) {
    this.grammar = opts.grammar;
    this.rnd = opts.rnd ?? Math.random;
    this.samples = !!opts.useSamples;
  }

  protected rndInt(min: number, max: number): number {
    return Math.floor(this.rnd() * (max - min + 1) + min);
  }

  public genTerminal(node: TerminalNode | TerminalNodeShorthand): string {
    if (isTerminalShorthandNode(node)) return this.genTerminal({t: node});
    if (this.samples && typeof node.sample !== 'undefined') return node.sample;
    if (typeof node.t === 'string') {
      return node.t;
    } else if (node.t instanceof RegExp) {
      const r = new ReRegExp(node.t);
      return r.build();
    } else if (Array.isArray(node.t)) {
      const pick = Math.floor(Math.random() * node.t.length);
      const str = node.t[pick];
      const repeat = node.repeat === '*' ? this.rndInt(0, 5) : node.repeat === '+' ? this.rndInt(1, 5) : 1;
      switch (repeat) {
        case 0:
          return '';
        case 1:
          return str;
        default:
          return str.repeat(repeat);
      }
    }
    throw new Error('UNK_TERMINAL');
  }

  public genProduction(node: ProductionNode | ProductionNodeShorthand): string {
    if (Array.isArray(node)) return this.genProduction({p: node});
    if (this.samples && typeof node.sample !== 'undefined') return node.sample;
    const p = node.p;
    let res = '';
    const length = p.length;
    for (let i = 0; i < length; i++) res += this.genNode(p[i]);
    return res;
  }

  public genUnion(node: UnionNode): string {
    if (this.samples && typeof node.sample !== 'undefined') return node.sample;
    const u = node.u;
    const pick = this.rndInt(0, u.length - 1);
    const child = u[pick];
    return this.genNode(child);
  }

  public genList(node: ListNode): string {
    if (this.samples && typeof node.sample !== 'undefined') return node.sample;
    const child = node.l;
    const repeat = this.rndInt(0, 5);
    let res = '';
    for (let i = 0; i < repeat; i++) res += this.genNode(child);
    return res;
  }

  public genRef(node: RefNode): string {
    const ref = node.r;
    return this.genNode(this.grammar.cst[ref]);
  }

  public genNode(node: GrammarNode): string {
    if (isTerminalNode(node)) return this.genTerminal(node);
    else if (isTerminalShorthandNode(node)) return this.genTerminal({t: node});
    else if (isProductionNode(node)) return this.genProduction(node);
    else if (isProductionShorthandNode(node)) return this.genProduction({p: node});
    else if (isUnionNode(node)) return this.genUnion(node);
    else if (isListNode(node)) return this.genList(node);
    else if (isRefNode(node)) return this.genRef(node);
    else throw new Error('UNK_NODE');
  }

  public gen(type: string = this.grammar.start): string {
    return this.genNode(this.grammar.cst[type]);
  }
}
