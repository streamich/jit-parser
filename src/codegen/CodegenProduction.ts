import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CstMatch} from '../matches';
import {CodegenContext} from '../context';
import type {Parser, ProductionNode, ProductionNodeShorthand} from '../types';
import type {Pattern} from './Pattern';

export class CodegenProduction {
  public static readonly compile = (
    production: ProductionNode | ProductionNodeShorthand,
    pattern: Pattern,
    parsers: Parser[],
    ctx: CodegenContext = new CodegenContext(),
  ): Parser => {
    const production2: ProductionNode = production instanceof Array ? {p: production} : production;
    const codegen = new CodegenProduction(production2, pattern, parsers, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(
    protected readonly node: ProductionNode,
    protected readonly pattern: Pattern,
    protected readonly parsers: Parser[],
    protected readonly ctx: CodegenContext,
  ) {
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {codegen, pattern, parsers} = this;
    const results: string[] = [];
    const dCstMatch = codegen.linkDependency(CstMatch);
    const rStart = codegen.var('pos');
    const rChildren = codegen.var('[]');
    const dPattern = codegen.linkDependency(pattern);
    const rDebug = codegen.var();
    const rTraceNodeParent = codegen.var();
    if (this.ctx.debug) {
      const rTrace = codegen.var('ctx.trace');
      codegen.js(`${rTraceNodeParent} = ${rTrace} && ${rTrace}[${rTrace}.length - 1]`);
      codegen.if(rTraceNodeParent, () => {
        codegen.js(`${rDebug} = {ptr: ${dPattern}, pos: pos, children: []}`);
        codegen.js(`${rTraceNodeParent}.children.push(${rDebug})`);
        codegen.js(`${rTrace}.push(${rDebug})`);
      });
    }
    for (const parser of parsers) {
      const dep = codegen.linkDependency(parser);
      const reg = codegen.var(`${dep}(ctx, pos)`);
      results.push(reg);
      codegen.if(`!${reg}`, () => {
        if (this.ctx.debug) {
          codegen.if(rTraceNodeParent, () => {
            codegen.js(`ctx.trace.pop();`);
          });
        }
        codegen.return('');
      });
      codegen.js(`pos = ${reg}.end`);
      codegen.js(`${rChildren}.push(${reg})`);
    }
    const rMatch = codegen.var(`new ${dCstMatch}(${rStart}, pos, ${dPattern}, ${rChildren})`);
    if (this.ctx.debug) {
      codegen.if(rTraceNodeParent, () => {
        codegen.js(`ctx.trace.pop();`);
        codegen.js(`${rDebug}.match = ${rMatch}`);
      });
    }
    codegen.return(rMatch);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
