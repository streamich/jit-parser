import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {CsrMatch} from '../matches';
import {JsonExpressionCodegen} from 'json-joy/lib/json-expression';
import {operatorsMap} from 'json-joy/lib/json-expression/operators';
import {Vars} from 'json-joy/lib/json-expression/Vars';
import {scrub} from '../util';
import type {Parser, ProductionNode, ProductionNodeShorthand} from '../types';

const DEFAULT_TYPE = 'Production';

export class CodegenProduction {
  public static readonly compile = (production: ProductionNode | ProductionNodeShorthand, parsers: Parser[]): Parser => {
    const production2: ProductionNode = production instanceof Array ? {p: production} : production;
    const codegen = new CodegenProduction(production2, parsers);
    codegen.generate();
    return codegen.compile();
  };

  public readonly type: string;
  public readonly codegen: Codegen<Parser>;

  constructor(public readonly production: ProductionNode, public readonly parsers: Parser[]) {
    this.type = typeof production.type === 'string' ? scrub(production.type) : DEFAULT_TYPE;
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {codegen, production, parsers} = this;
    const dType = codegen.linkDependency(this.type);
    const results: string[] = [];
    const dPM = codegen.linkDependency(CsrMatch);
    const rStart = codegen.var('pos');
    const rChildren = codegen.var('[]');
    const rNodeAst = codegen.var();
    for (const parser of parsers) {
      const dep = codegen.linkDependency(parser);
      const reg = codegen.var(`${dep}(ctx, pos)`);
      results.push(reg);
      codegen.if(`!${reg}`, () => {
        codegen.return('');
      });
      codegen.js(`pos = ${reg}.end`);
      codegen.js(`${rNodeAst} = ${reg}.ast`);
      codegen.if(`${rNodeAst} === void 0`, () => {
        codegen.js(`${rChildren}.push(${reg})`);
      }, () => {
        codegen.if(`${rNodeAst} !== null`, () => {
          codegen.js(`${rChildren}.push(${rNodeAst})`);
        });  
      });
    }
    const rResult = codegen.var(`new ${dPM}(${dType}, ${rStart}, pos, ${rChildren})`);
    codegen.if('ctx.ast', () => {
      if (production.ast === null) {
      } else if (production.ast) {
        const exprCodegen = new JsonExpressionCodegen({
          expression: <any>production.ast,
          operators: operatorsMap,
        });
        const fn = exprCodegen.run().compile();
        const dExpr = codegen.linkDependency(fn);
        const dVars = codegen.linkDependency(Vars);
        const rAst = codegen.var(`{type:${dType},pos:pos,end:${rResult}.end,raw:${rResult}.raw}`);
        codegen.js(`${rResult}.ast = ${dExpr}({vars: new ${dVars}({csr: ${rResult}, ast: ${rAst}})})`);
      } else {
        const rAst = codegen.var(`{type:${dType},pos:pos,end:${rResult}.end,raw:${rResult}.raw}`);
        codegen.js(`${rResult}.ast = ${rAst};`);
      }
    });
    codegen.return(rResult);
    codegen.return(rResult);
  }

  public compile(): Parser {
    return this.codegen.compile();
  }
}
