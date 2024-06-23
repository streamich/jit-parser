import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {lazy} from '@jsonjoy.com/util/lib/lazyFunction';
import {CodegenTerminal} from './CodegenTerminal';
import {CodegenProduction} from './CodegenProduction';
import {CodegenUnion} from './CodegenUnion';
import type {
  Grammar,
  UnionNode,
  Parser,
  TerminalNodeShorthand,
  RefNode,
  ProductionNodeShorthand,
  GrammarNode,
  TerminalNode,
  ProductionNode,
  ListNode,
} from '../types';
import {CodegenList} from './CodegenList';

const isTerminalShorthandNode = (item: any): item is TerminalNodeShorthand =>
  typeof item === 'string' || item instanceof RegExp;

const isTerminalNode = (item: any): item is TerminalNode =>
  typeof item === 'object' && item && isTerminalShorthandNode(item.t);

const isProductionShorthandNode = (item: any): item is ProductionNodeShorthand => item instanceof Array;

const isProductionNode = (item: any): item is ProductionNode =>
  typeof item === 'object' && item && isProductionShorthandNode(item.p);

const isUnionNode = (item: any): item is UnionNode => typeof item === 'object' && item && item.u instanceof Array;

const isListNode = (item: any): item is ListNode => typeof item === 'object' && item && typeof item.l !== 'undefined';

const isRefNode = (item: any): item is RefNode => typeof item === 'object' && item && typeof item.r === 'string';

export class CodegenGrammar {
  public static readonly compile = (grammar: Grammar): Parser => {
    const codegen = new CodegenGrammar(grammar);
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;
  protected readonly parsers = new Map<string, Parser>();

  constructor(public readonly grammar: Grammar) {
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  protected compileNode(node: GrammarNode): Parser {
    if (isTerminalShorthandNode(node) || isTerminalNode(node)) {
      return this.compileTerminal(node);
    } else if (isProductionShorthandNode(node)) {
      return this.compileProduction({p: node});
    } else if (isProductionNode(node)) {
      return this.compileProduction(node);
    } else if (isUnionNode(node)) {
      return this.compileUnion(node);
    } else if (isListNode(node)) {
      return this.compileList(node);
    } else if (isRefNode(node)) {
      return this.compileRule(node.r);
    } else {
      throw new Error('UNKNOWN_NODE');
    }
  }

  protected compileTerminal(terminal: TerminalNode | TerminalNodeShorthand): Parser {
    const node: TerminalNode = isTerminalShorthandNode(terminal) ? {t: terminal} : terminal;
    if (node.type && node.ast === undefined) node.ast ??= this.grammar.ast?.[node.type];
    return CodegenTerminal.compile(node);
  }

  protected compileProduction(node: ProductionNode): Parser {
    const parsers: Parser[] = [];
    for (const component of node.p) parsers.push(this.compileNode(component));
    if (node.type && node.ast === undefined) node.ast ??= this.grammar.ast?.[node.type];
    return CodegenProduction.compile(node, parsers);
  }

  protected compileUnion(node: UnionNode): Parser {
    const parsers: Parser[] = [];
    for (const item of node.u) parsers.push(this.compileNode(item));
    if (node.type && node.ast === undefined) node.ast ??= this.grammar.ast?.[node.type];
    return CodegenUnion.compile(node, parsers);
  }

  protected compileList(node: ListNode): Parser {
    const parser = this.compileNode(node.l);
    if (node.type && node.ast === undefined) node.ast ??= this.grammar.ast?.[node.type];
    return CodegenList.compile(node, parser);
  }

  private __compileRule(name: string, node: GrammarNode): Parser {
    if (isTerminalNode(node)) {
      node.type ??= name;
      return this.compileTerminal(node);
    } else if (isTerminalShorthandNode(node)) {
      return this.compileTerminal({t: node, type: name});
    } else if (isProductionNode(node)) {
      node.type ??= name;
      return lazy(() => this.compileProduction(node));
    } else if (isProductionShorthandNode(node)) {
      const node2 = {p: node, type: name};
      return lazy(() => this.compileProduction(node2));
    } else if (isUnionNode(node)) {
      node.type ??= name;
      return lazy(() => this.compileUnion(node));
    } else if (isListNode(node)) {
      node.type ??= name;
      return lazy(() => this.compileList(node));
    } else if (isRefNode(node)) {
      return lazy(() => this.compileRule(node.r));
    } else {
      throw new Error('UNKNOWN_NODE');
    }
  }

  public compileRule(name: string): Parser {
    if (this.parsers.has(name)) return this.parsers.get(name)!;
    const {grammar} = this;
    const {cst} = grammar;
    const node = cst[name];
    if (node === undefined) throw new Error(`Unknown [rule = ${name}]`);
    const parser = this.__compileRule(name, node);
    this.parsers.set(name, parser);
    return parser;
  }

  public compile(): Parser {
    return this.compileRule(this.grammar.start);
  }
}
