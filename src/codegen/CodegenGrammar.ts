import {lazy} from '@jsonjoy.com/util/lib/lazyFunction';
import {CodegenTerminal} from './CodegenTerminal';
import {CodegenProduction} from './CodegenProduction';
import {CodegenUnion} from './CodegenUnion';
import {CodegenList} from './CodegenList';
import {CodegenAstFactory} from './CodegenAstFactory';
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
import {CodegenContext} from '../context';
import {Pattern} from './Pattern';
import {
  isListNode,
  isProductionNode,
  isProductionShorthandNode,
  isRefNode,
  isTerminalNode,
  isTerminalShorthandNode,
  isUnionNode,
} from '../util';
import {sharedLibraryText, library} from '../sharedLibrary';

export class CodegenGrammar {
  public static readonly compile = (grammar: Grammar, ctx?: CodegenContext): Parser => {
    const codegen = new CodegenGrammar(grammar, ctx);
    return codegen.compile();
  };

  protected readonly parsers = new Map<string, Pattern>();
  protected readonly patterns = new Map<string, Pattern>();
  protected readonly codegenObjects = new Map<string, any>();

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
    const codegen = new CodegenTerminal(node, pattern, this.ctx);
    codegen.generate();
    pattern.parser = codegen.compile();
    pattern.toAst = CodegenAstFactory.compile(node, pattern, this.ctx);
    
    // Store codegen object for text generation
    this.codegenObjects.set(pattern.type, codegen);
    
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
    const codegen = new CodegenProduction(node, pattern, parsers, this.ctx);
    codegen.generate();
    pattern.parser = codegen.compile();
    pattern.toAst = CodegenAstFactory.compile(node, pattern, this.ctx);
    
    // Store codegen object for text generation
    this.codegenObjects.set(pattern.type, codegen);
    
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
    const codegen = new CodegenUnion(node, pattern, parsers, this.ctx);
    codegen.generate();
    pattern.parser = codegen.compile();
    pattern.toAst = CodegenAstFactory.compile(node, pattern, this.ctx);
    
    // Store codegen object for text generation
    this.codegenObjects.set(pattern.type, codegen);
    
    return pattern;
  }

  protected compileList(node: ListNode, pattern?: Pattern): Pattern {
    if (pattern && pattern.type && node.ast === undefined) {
      const ast = this.grammar.ast?.[pattern.type];
      if (ast !== void 0) node.ast = ast;
    }
    pattern ??= new Pattern(node.type ?? 'List');
    const childParser = this.getNodeParser(node.l);
    const codegen = new CodegenList(node, pattern, childParser, this.ctx);
    codegen.generate();
    pattern.parser = codegen.compile();
    pattern.toAst = CodegenAstFactory.compile(node, pattern, this.ctx);
    
    // Store codegen object for text generation
    this.codegenObjects.set(pattern.type, codegen);
    
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

  /**
   * Generate JavaScript code for the parser instead of compiling it.
   * Returns an object containing the generated JavaScript code and dependencies.
   */
  public generateCode(): {js: string; dependencies: {[key: string]: unknown}} {
    const pattern = this.compileRule(this.grammar.start);
    
    // Get the codegen object for the start rule
    const codegen = this.codegenObjects.get(pattern.type);
    if (!codegen) {
      throw new Error(`Unable to find codegen object for pattern: ${pattern.type}`);
    }
    
    const generated = codegen.generateCodeText();
    
    // Create a map of dependencies by their variable names
    const dependencyMap: {[key: string]: unknown} = {};
    const dependencyNames = (codegen.codegen as any).dependencyNames || [];
    const dependencies = (codegen.codegen as any).dependencies || [];
    
    // Map dependency names to their values
    for (let i = 0; i < Math.min(dependencyNames.length, dependencies.length); i++) {
      dependencyMap[dependencyNames[i]] = dependencies[i];
    }
    
    return {
      js: generated.js,
      dependencies: dependencyMap
    };
  }

  /**
   * Generate complete JavaScript code with all dependencies inlined.
   * This creates a self-contained JavaScript parser function.
   */
  public generateFullCode(): string {
    const {js, dependencies} = this.generateCode();
    
    // Start building the complete code
    let fullCode = '// Generated parser with shared library\n';
    fullCode += '// This code was auto-generated by jit-parser\n\n';
    
    // Add the shared library
    fullCode += '// Shared library functions\n';
    fullCode += `const sharedLib = ${sharedLibraryText};\n`;
    fullCode += 'const library = sharedLib();\n\n';
    
    // Create dependency variables
    const dependencyVars: string[] = [];
    const dependencyValues: string[] = [];
    
    for (const [name, value] of Object.entries(dependencies)) {
      dependencyVars.push(name);
      
      if (typeof value === 'function') {
        // For functions, we need to serialize them - but some are from our library
        if (value === library.scrub) {
          dependencyValues.push('library.scrub');
        } else if (value === library.CstMatch) {
          dependencyValues.push('library.CstMatch');
        } else if (value === library.LeafCstMatch) {
          dependencyValues.push('library.LeafCstMatch');
        } else if (value === library.defaultAstFactory) {
          dependencyValues.push('library.defaultAstFactory');
        } else {
          // For other functions, serialize them
          dependencyValues.push(value.toString());
        }
      } else if (value instanceof RegExp) {
        // For regexps, serialize them
        dependencyValues.push(value.toString());
      } else if (value && typeof value === 'object' && 'type' in value) {
        // This looks like a Pattern object
        dependencyValues.push(`new library.Pattern('${(value as any).type}')`);
      } else {
        // Literal values can be inlined
        dependencyValues.push(JSON.stringify(value));
      }
    }
    
    // Add dependency declarations
    if (dependencyVars.length > 0) {
      for (let i = 0; i < dependencyVars.length; i++) {
        fullCode += `const ${dependencyVars[i]} = ${dependencyValues[i]};\n`;
      }
      fullCode += '\n';
    }
    
    // Add the main parser function
    fullCode += '// Main parser function\n';
    fullCode += `const parser = ${js}(${dependencyVars.join(', ')});\n\n`;
    
    // Export the parser
    fullCode += '// Export the parser\n';
    fullCode += 'if (typeof module !== "undefined" && module.exports) {\n';
    fullCode += '  module.exports = parser;\n';
    fullCode += '} else if (typeof window !== "undefined") {\n';
    fullCode += '  window.parser = parser;\n';
    fullCode += '}\n\n';
    fullCode += '// For direct usage\n';
    fullCode += 'parser;\n';
    
    return fullCode;
  }
}
