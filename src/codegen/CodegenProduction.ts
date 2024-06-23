import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CsrMatch} from '../matches';
import {JsonExpressionCodegen} from 'json-joy/lib/json-expression';
import {operatorsMap} from 'json-joy/lib/json-expression/operators';
import {Vars} from 'json-joy/lib/json-expression/Vars';
import {scrub} from '../util';
import type {Parser, ProductionNode, ProductionNodeShorthand} from '../types';
import {CodegenContext} from '../context';

const DEFAULT_TYPE = 'Production';

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

  public readonly type: string;
  public readonly codegen: Codegen<Parser>;

  constructor(
    public readonly node: ProductionNode,
    public readonly parsers: Parser[],
    protected readonly ctx: CodegenContext,
  ) {
    this.type = typeof node.type === 'string' ? scrub(node.type) : DEFAULT_TYPE;
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {codegen, node, parsers} = this;
    const dType = codegen.linkDependency(this.type);
    const results: string[] = [];
    const dCsrMatch = codegen.linkDependency(CsrMatch);
    const rStart = codegen.var('pos');
    const rChildren = codegen.var('[]');
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
    const rResult = codegen.var(`new ${dCsrMatch}(${dType}, ${rStart}, pos, ${rChildren})`);
    if (node.ast !== null) {
      codegen.if('ctx.ast', () => {
        const childrenFragment = node.leaf ? '' : `, children: ${rResult}.children.map(c => c.ast).filter(Boolean)`;
        const positionFragment = this.ctx.positions ? `, pos:${rStart}, end:pos` : '';
        const rAst = codegen.var(`{type:${dType}${positionFragment}${childrenFragment}}`);
        if (node.ast) {
          const exprCodegen = new JsonExpressionCodegen({
            expression: <any>node.ast,
            operators: operatorsMap,
          });
          const fn = exprCodegen.run().compile();
          const dExpr = codegen.linkDependency(fn);
          const dVars = codegen.linkDependency(Vars);
          codegen.js(`${rResult}.ast = ${dExpr}({vars: new ${dVars}({cst: ${rResult}, ast: ${rAst}})})`);
        } else {
          codegen.js(`${rResult}.ast = ${rAst};`);
        }
      });
    }
    codegen.return(rResult);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
