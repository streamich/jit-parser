import {lazy} from '@jsonjoy.com/util/lib/lazyFunction';
import {CodegenTerminal} from './CodegenTerminal';
import {CodegenProduction} from './CodegenProduction';
import {CodegenUnion} from './CodegenUnion';
import type {
  Grammar,
  UnionNode,
  Parser,
  TerminalNodeShorthand,
  GrammarNode,
  TerminalNode,
  ProductionNode,
  ListNode,
  CstNode,
} from '../types';
import {CodegenList} from './CodegenList';
import {CodegenContext} from '../context';
import {Pattern} from './Pattern';
import {CodegenAstFactory} from './CodegenAstFactory';
import {
  isListNode,
  isProductionNode,
  isProductionShorthandNode,
  isRefNode,
  isTerminalNode,
  isTerminalShorthandNode,
  isUnionNode,
} from '../util';

export class CodegenGrammar {
  public static readonly compile = (grammar: Grammar, ctx?: CodegenContext): Parser => {
    const codegen = new CodegenGrammar(grammar, ctx);
    return codegen.compile();
  };

  protected readonly parsers = new Map<string, Pattern>();
  protected readonly patterns = new Map<string, Pattern>();

  constructor(
    public readonly grammar: Grammar,
    protected readonly ctx: CodegenContext = new CodegenContext(),
  ) {}

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

  private getNodeParser(node: GrammarNode): Parser {
    if (isRefNode(node)) {
      const pattern = this.patterns.get(node.r);
      if (pattern) return pattern.parser;
    }
    return lazy(() => this.compileNode(node).parser);
  }

  protected compileTerminal(terminal: TerminalNode | TerminalNodeShorthand, pattern?: Pattern): Pattern {
    const node: TerminalNode = isTerminalShorthandNode(terminal)
      ? {t: terminal, ast: pattern ? undefined : null}
      : terminal;
    if (pattern && pattern.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[pattern.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'Text');
    pattern.parser = CodegenTerminal.compile(node, pattern, this.ctx);
    pattern.toAst = CodegenAstFactory.compile(node, pattern, this.ctx);
    return pattern;
  }

  protected compileProduction(node: ProductionNode, pattern?: Pattern): Pattern {
    const parsers: Parser[] = [];
    for (const component of node.p) parsers.push(this.getNodeParser(component));
    if (pattern && pattern.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[pattern.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'Production');
    pattern.parser = CodegenProduction.compile(node, pattern, parsers, this.ctx);
    pattern.toAst = CodegenAstFactory.compile(node, pattern, this.ctx);
    return pattern;
  }

  protected compileUnion(node: UnionNode, pattern?: Pattern): Pattern {
    const parsers: Parser[] = [];
    for (const item of node.u) parsers.push(this.getNodeParser(item));
    if (pattern && pattern.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[pattern.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'Union');
    pattern.parser = CodegenUnion.compile(node, pattern, parsers, this.ctx);
    pattern.toAst = CodegenAstFactory.compile(node, pattern, this.ctx);
    return pattern;
  }

  protected compileList(node: ListNode, pattern?: Pattern): Pattern {
    if (pattern && pattern.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[pattern.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'List');
    const childParser = this.getNodeParser(node.l);
    pattern.parser = CodegenList.compile(node, pattern, childParser, this.ctx);
    pattern.toAst = CodegenAstFactory.compile(node, pattern, this.ctx);
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
    const pattern = this.compileRule(this.grammar.start);
    return pattern.parser;
  }

  public walk(node: CstNode, visitor: (node: CstNode) => void) {
    const stack: CstNode[] = [node];
    while (stack.length > 0) {
      const node = stack.pop()!;
      const children = node.children;
      if (children) {
        const length = children.length;
        for (let i = length - 1; i >= 0; i--) {
          const child = children[i];
          stack.push(child);
        }
      }
      visitor(node);
    }
  }

  public createAst(cst: CstNode, src: string): unknown {
    return cst.ptr.toAst(cst, src);
  }
}
