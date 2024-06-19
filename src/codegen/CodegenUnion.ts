import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {CsrMatch} from '../matches';
import {scrub} from '../util';
import {JsonExpressionCodegen} from 'json-joy/lib/json-expression';
import {operatorsMap} from 'json-joy/lib/json-expression/operators';
import {Vars} from 'json-joy/lib/json-expression/Vars';
import type {Parser, UnionNode} from '../types';

const DEFAULT_TYPE = 'Union';

export class CodegenUnion {
  public static readonly compile = (rule: UnionNode, parsers: Parser[]): Parser => {
    const codegen = new CodegenUnion(rule, parsers);
    codegen.generate();
    return codegen.compile();
  };

  public readonly type: string;
  public readonly codegen: Codegen<Parser>;

  constructor(
    public readonly node: UnionNode,
    public readonly parsers: Parser[],
  ) {
    this.type = typeof node.type === 'string' ? scrub(node.type) : DEFAULT_TYPE;
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {node, codegen, parsers} = this;
    const deps: string[] = [];
    const dCsrMatch = codegen.linkDependency(CsrMatch);
    const dType = codegen.linkDependency(this.type);
    for (const parser of parsers)
      deps.push(codegen.linkDependency(parser));
    const rMatch = codegen.var(`${deps.join('(ctx, pos) || ')}(ctx, pos)`);
    codegen.if(`!${rMatch}`, () => {
      codegen.return('');
    });
    const rEnd = codegen.var();
    const rChildren = codegen.var();
    codegen.if(`${rMatch} instanceof Array`, () => {
      codegen.js(`${rEnd} = ${rMatch}[${rMatch}.length - 1].end;`);
      codegen.js(`${rChildren} = ${rMatch};`);
    }, () => {
      codegen.js(`${rEnd} = ${rMatch}.end;`);
      codegen.js(`${rChildren} = [${rMatch}];`);
    });
    const rResult = codegen.var(`new ${dCsrMatch}(${dType}, pos, ${rEnd}, ${rChildren})`);
    codegen.if('ctx.ast', () => {
      if (node.ast === null) {
      } else if (node.ast) {
        const exprCodegen = new JsonExpressionCodegen({
          expression: <any>node.ast,
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
  }

  public compile(): Parser {
    return this.codegen.compile();
  }
}
