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

  private textGenerationMode = false;

  private getNodeParser(node: GrammarNode): Parser {
    if (isRefNode(node)) {
      const pattern = this.patterns.get(node.r);
      if (pattern) return pattern.parser;
    }
    
    // In text generation mode, compile immediately instead of using lazy
    if (this.textGenerationMode) {
      return this.compileNode(node).parser;
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

  /**
   * Compile all rules in the grammar to ensure all codegen objects are created
   */
  public compileAll(): void {
    // Enable text generation mode to avoid lazy functions
    this.textGenerationMode = true;
    
    for (const ruleName of Object.keys(this.grammar.cst)) {
      this.compileRule(ruleName);
    }
    
    // Disable text generation mode
    this.textGenerationMode = false;
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
    // First compile all rules to ensure all codegen objects are created
    this.compileAll();
    
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
    // Clear any existing patterns to start fresh
    this.patterns.clear();
    this.codegenObjects.clear();
    
    // Enable text generation mode to avoid lazy functions
    this.textGenerationMode = true;
    
    // Compile all rules to generate all codegen objects
    for (const ruleName of Object.keys(this.grammar.cst)) {
      this.compileRule(ruleName);
    }
    
    // Start building the complete code
    let fullCode = '// Generated parser with shared library\n';
    fullCode += '// This code was auto-generated by jit-parser\n\n';
    
    // Add the shared library
    fullCode += '// Shared library functions\n';
    fullCode += `const sharedLib = ${sharedLibraryText};\n`;
    fullCode += 'const library = sharedLib();\n\n';
    
    // Collect all the generated code for each pattern
    const generatedParsers = new Map<string, {js: string; deps: unknown[]; dependencyNames: string[];}>();
    
    for (const [patternType, codegenObj] of this.codegenObjects) {
      const generated = codegenObj.generateCodeText();
      const dependencyNames = (codegenObj.codegen as any).dependencyNames || [];
      generatedParsers.set(patternType, {
        js: generated.js,
        deps: generated.deps,
        dependencyNames: dependencyNames
      });
    }
    
    // Create a mapping from parser functions to their pattern types
    const parserToPattern = new Map<Function, string>();
    for (const [patternType, pattern] of this.patterns) {
      parserToPattern.set(pattern.parser, patternType);
    }
    
    // Process all patterns except the root pattern
    const rootPattern = this.compileRule(this.grammar.start);
    
    // Order patterns by dependencies (simple topological sort)
    const patternOrder: string[] = [];
    const visited = new Set<string>();
    
    const visitPattern = (patternType: string) => {
      if (visited.has(patternType)) return;
      visited.add(patternType);
      
      const patternInfo = generatedParsers.get(patternType);
      if (!patternInfo) return;
      
      // Visit dependencies first
      for (const dep of patternInfo.deps) {
        if (typeof dep === 'function') {
          const depPatternType = parserToPattern.get(dep);
          if (depPatternType && !visited.has(depPatternType)) {
            visitPattern(depPatternType);
          }
        }
      }
      
      patternOrder.push(patternType);
    };
    
    // Visit all patterns starting from root
    for (const patternType of generatedParsers.keys()) {
      visitPattern(patternType);
    }
    
    // Generate parser variables for each pattern
    const parserVars = new Map<string, string>();
    for (const patternType of patternOrder) {
      if (patternType !== rootPattern.type) {
        parserVars.set(patternType, `parser_${patternType.replace(/[^a-zA-Z0-9]/g, '_')}`);
      }
    }
    
    // Generate all non-root parsers
    for (const patternType of patternOrder) {
      if (patternType === rootPattern.type) continue;
      
      const patternInfo = generatedParsers.get(patternType)!;
      const varName = parserVars.get(patternType)!;
      const dependencyValues: string[] = [];
      
      for (const dep of patternInfo.deps) {
        if (typeof dep === 'function') {
          // Check if it's from our library
          if (dep === library.scrub) {
            dependencyValues.push('library.scrub');
          } else if (dep === library.CstMatch) {
            dependencyValues.push('library.CstMatch');
          } else if (dep === library.LeafCstMatch) {
            dependencyValues.push('library.LeafCstMatch');
          } else if (dep === library.defaultAstFactory) {
            dependencyValues.push('library.defaultAstFactory');
          } else {
            // Check if it's another parser
            const referencedPattern = parserToPattern.get(dep);
            if (referencedPattern && parserVars.has(referencedPattern)) {
              dependencyValues.push(parserVars.get(referencedPattern)!);
            } else {
              // This shouldn't happen, but fallback to string representation
              dependencyValues.push(dep.toString());
            }
          }
        } else if (dep instanceof RegExp) {
          dependencyValues.push(dep.toString());
        } else if (dep && typeof dep === 'object' && 'type' in dep) {
          // This looks like a Pattern object
          dependencyValues.push(`new library.Pattern('${(dep as any).type}')`);
        } else {
          // Literal values
          dependencyValues.push(JSON.stringify(dep));
        }
      }
      
      fullCode += `// Parser for ${patternType}\n`;
      fullCode += `const ${varName} = ${patternInfo.js}(${dependencyValues.join(', ')});\n\n`;
    }
    
    // Generate the main parser
    const rootPatternInfo = generatedParsers.get(rootPattern.type)!;
    const rootDependencyValues: string[] = [];
    
    for (const dep of rootPatternInfo.deps) {
      if (typeof dep === 'function') {
        // Check if it's from our library
        if (dep === library.scrub) {
          rootDependencyValues.push('library.scrub');
        } else if (dep === library.CstMatch) {
          rootDependencyValues.push('library.CstMatch');
        } else if (dep === library.LeafCstMatch) {
          rootDependencyValues.push('library.LeafCstMatch');
        } else if (dep === library.defaultAstFactory) {
          rootDependencyValues.push('library.defaultAstFactory');
        } else {
          // Check if it's another parser
          const referencedPattern = parserToPattern.get(dep);
          if (referencedPattern && parserVars.has(referencedPattern)) {
            rootDependencyValues.push(parserVars.get(referencedPattern)!);
          } else {
            // This shouldn't happen, but fallback to string representation
            rootDependencyValues.push(dep.toString());
          }
        }
      } else if (dep instanceof RegExp) {
        rootDependencyValues.push(dep.toString());
      } else if (dep && typeof dep === 'object' && 'type' in dep) {
        // This looks like a Pattern object
        rootDependencyValues.push(`new library.Pattern('${(dep as any).type}')`);
      } else {
        // Literal values
        rootDependencyValues.push(JSON.stringify(dep));
      }
    }
    
    // Add the main parser function
    fullCode += '// Main parser function\n';
    fullCode += `const parser = ${rootPatternInfo.js}(${rootDependencyValues.join(', ')});\n\n`;
    
    // Export the parser
    fullCode += '// Export the parser\n';
    fullCode += 'if (typeof module !== "undefined" && module.exports) {\n';
    fullCode += '  module.exports = parser;\n';
    fullCode += '} else if (typeof window !== "undefined") {\n';
    fullCode += '  window.parser = parser;\n';
    fullCode += '}\n\n';
    fullCode += '// Return the parser for direct usage\n';
    fullCode += 'parser;\n';
    
    // Disable text generation mode
    this.textGenerationMode = false;
    
    return fullCode;
  }
}
