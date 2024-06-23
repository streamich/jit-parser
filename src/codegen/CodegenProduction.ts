import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CsrMatch} from '../matches';
import {CodegenContext} from '../context';
import type {Parser, ProductionNode, ProductionNodeShorthand} from '../types';

export class CodegenProduction {
  public static readonly compile = (
    production: ProductionNode | ProductionNodeShorthand,
    parsers: Parser[],
    ctx: CodegenContext = new CodegenContext(),
  ): Parser => {
    const production2: ProductionNode = production instanceof Array ? {p: production} : production;
    const codegen = new CodegenProduction(production2, parsers, ctx);
    codegen.generate();
    return codegen.compile();
  };
  public readonly codegen: Codegen<Parser>;

  constructor(
    public readonly node: ProductionNode,
    public readonly parsers: Parser[],
    protected readonly ctx: CodegenContext,
  ) {
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {codegen, node, parsers} = this;
    const results: string[] = [];
    const dCsrMatch = codegen.linkDependency(CsrMatch);
    const rStart = codegen.var('pos');
    const rChildren = codegen.var('[]');
    const dNode = codegen.linkDependency(node);
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
    codegen.return(`new ${dCsrMatch}(${rStart}, pos, ${dNode}, ${rChildren})`);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
