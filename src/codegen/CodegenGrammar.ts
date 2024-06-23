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
import {CodegenContext} from '../context';
import {Pattern} from './Pattern';

const isTerminalShorthandNode = (item: any): item is TerminalNodeShorthand =>
  typeof item === 'string' || item instanceof RegExp;

const isTerminalNode = (item: any): item is TerminalNode =>
  typeof item === 'object' && item && (typeof item.t !== 'undefined') && !isTerminalShorthandNode(item);

const isProductionShorthandNode = (item: any): item is ProductionNodeShorthand => item instanceof Array;

const isProductionNode = (item: any): item is ProductionNode =>
  typeof item === 'object' && item && isProductionShorthandNode(item.p);

const isUnionNode = (item: any): item is UnionNode => typeof item === 'object' && item && item.u instanceof Array;

const isListNode = (item: any): item is ListNode => typeof item === 'object' && item && typeof item.l !== 'undefined';

const isRefNode = (item: any): item is RefNode => typeof item === 'object' && item && typeof item.r === 'string';

export class CodegenGrammar {
  public static readonly compile = (grammar: Grammar, ctx?: CodegenContext): Parser => {
    const codegen = new CodegenGrammar(grammar, ctx);
    return codegen.compile();
  };

  protected readonly parsers = new Map<string, Pattern>();
  protected readonly patterns = new Map<string, Pattern>();

  constructor(public readonly grammar: Grammar, protected readonly ctx: CodegenContext = new CodegenContext()) {}

  protected compileNode(node: GrammarNode, pattern?: Pattern): Pattern {
    if (isTerminalShorthandNode(node) || isTerminalNode(node)) {
      return this.compileTerminal(node, pattern);
    } else if (isProductionShorthandNode(node)) {
      return this.compileProduction({p: node}, pattern);
    } else if (isProductionNode(node)) {
      return this.compileProduction(node, pattern);
    } else if (isUnionNode(node)) {
      return this.compileUnion(node, pattern);
    } else if (isListNode(node)) {
      return this.compileList(node, pattern);
    } else if (isRefNode(node)) {
      return this.compileRule(node.r);
    } else {
      throw new Error('UNKNOWN_NODE');
    }
  }

  protected compileTerminal(terminal: TerminalNode | TerminalNodeShorthand, pattern?: Pattern): Pattern {
    const node: TerminalNode = isTerminalShorthandNode(terminal) ? {t: terminal} : terminal;
    if (node.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[node.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'Text');
    pattern.parser = lazy(() => CodegenTerminal.compile(node, pattern, this.ctx));
    pattern.toAst = () => {};
    return pattern;
  }

  protected compileProduction(node: ProductionNode, pattern?: Pattern): Pattern {
    const parsers: Parser[] = [];
    for (const component of node.p) parsers.push(this.compileNode(component).parser);
    if (node.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[node.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'Production');
    pattern.parser = lazy(() => CodegenProduction.compile(node, pattern, parsers, this.ctx));
    pattern.toAst = () => undefined;
    return pattern;
  }

  protected compileUnion(node: UnionNode, pattern?: Pattern): Pattern {
    const parsers: Parser[] = [];
    for (const item of node.u) parsers.push(this.compileNode(item).parser);
    if (node.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[node.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'Union');
    pattern.parser = lazy(() => CodegenUnion.compile(node, pattern, parsers, this.ctx));
    pattern.toAst = () => undefined;
    return pattern;
  }

  protected compileList(node: ListNode, pattern?: Pattern): Pattern {
    if (node.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[node.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'List');
    pattern.parser = lazy(() => CodegenList.compile(node, pattern, this.compileNode(node.l).parser, this.ctx));
    pattern.toAst = () => undefined;
    return pattern;
  }

  public compileRule(name: string): Pattern {
    const patterns = this.patterns;
    if (patterns.has(name)) return patterns.get(name)!;
    const node = this.grammar.cst[name];
    if (node === undefined) throw new Error(`Unknown [rule = ${name}]`);
    const pattern = new Pattern(name);
    patterns.set(name, pattern);
    this.compileNode(node, pattern);
    return pattern;
  }

  public compile(): Parser {
    const parser = this.compileRule(this.grammar.start).parser;
    // TODO: Maybe compile all rules here? And throw away grammar for GC?
    return parser;
  }

  // public walk(node: CstMatch, visitor: (node: CstMatch) => void) {
  //   visitor(node);
  //   // for (const child of node.children) this.walk(child, visitor);
  // }

  // public createAst(cst: CstMatch): unknown {
  //   if (cst.src.ast === null) return undefined;
  //   if (cst.src.ast === undefined) return cst.children.map((child) => this.createAst(child));
  //   const {ast} = cst.src;
  //   if (typeof ast === 'string') return ast;
  //   if (ast instanceof Array) {
  //     const args = ast.map((arg) => {
  //       if (typeof arg === 'string') return arg;
  //       if (arg === '.') return cst.children.map((child) => this.createAst(child)).join('');
  //       if (arg === '+') return cst.children.map((child) => this.createAst(child));
  //       if (arg === '$') return cst;
  //       if (arg === '/cst/pos') return cst.pos;
  //       if (arg === '/cst/end') return cst.end;
  //       return arg;
  //     });
  //     return args[0](...args.slice(1));
  //   }
  //   return ast;
  // }
}
