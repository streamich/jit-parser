import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CsrMatch} from '../matches';
import {scrub} from '../util';
import {JsonExpressionCodegen} from 'json-joy/lib/json-expression';
import {operatorsMap} from 'json-joy/lib/json-expression/operators';
import {Vars} from 'json-joy/lib/json-expression/Vars';
import type {Parser, UnionNode} from '../types';
import {CodegenContext} from '../context';

const DEFAULT_TYPE = 'Union';

export class CodegenUnion {
  public static readonly compile = (rule: UnionNode, parsers: Parser[], ctx: CodegenContext = new CodegenContext()): Parser => {
    const codegen = new CodegenUnion(rule, parsers, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly type: string;
  public readonly codegen: Codegen<Parser>;

  constructor(
    public readonly node: UnionNode,
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
    const {node, codegen, parsers} = this;
    const deps: string[] = [];
    const dCsrMatch = codegen.linkDependency(CsrMatch);
    const dType = codegen.linkDependency(this.type);
    for (const parser of parsers) deps.push(codegen.linkDependency(parser));
    const rMatch = codegen.var(`${deps.join('(ctx, pos) || ')}(ctx, pos)`);
    codegen.if(`!${rMatch}`, () => {
      codegen.return('');
    });
    const rEnd = codegen.var();
    const rChildren = codegen.var();
    codegen.js(`${rEnd} = ${rMatch}.end;`);
    codegen.js(`${rChildren} = [${rMatch}];`);
    const rResult = codegen.var(`new ${dCsrMatch}(${dType}, pos, ${rEnd}, ${rChildren})`);
    if (node.ast !== null) {
      codegen.if('ctx.ast', () => {
        const childrenFragment = node.leaf ? '' : `, children: ${rResult}.children.map(c => c.ast).filter(Boolean)`;
        const positionFragment = this.ctx.positions ? `, pos:pos, end:${rResult}.end` : '';
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
          // Collect children...
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
