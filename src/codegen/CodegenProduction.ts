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
    for (const parser of parsers) {
      const dep = codegen.linkDependency(parser);
      const reg = codegen.var(`${dep}(ctx, pos)`);
      results.push(reg);
      codegen.if(`!${reg}`, () => {
        codegen.return('');
      });
      codegen.js(`pos = ${reg}.end`);
      codegen.js(`${rChildren}.push(${reg})`);
    }
    codegen.return(`new ${dCstMatch}(${rStart}, pos, ${dPattern}, ${rChildren})`);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
