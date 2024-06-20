import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {CsrMatch} from '../matches';
import {scrub} from '../util';
import {JsonExpressionCodegen} from 'json-joy/lib/json-expression';
import {operatorsMap} from 'json-joy/lib/json-expression/operators';
import {Vars} from 'json-joy/lib/json-expression/Vars';
import type {ListNode, Parser} from '../types';

const DEFAULT_TYPE = 'List';

export class CodegenList {
  public static readonly compile = (rule: ListNode, parser: Parser): Parser => {
    const codegen = new CodegenList(rule, parser);
    codegen.generate();
    return codegen.compile();
  };

  public readonly type: string;
  public readonly codegen: Codegen<Parser>;

  constructor(
    public readonly node: ListNode,
    public readonly parser: Parser,
  ) {
    this.type = typeof node.type === 'string' ? scrub(node.type) : DEFAULT_TYPE;
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {node, codegen, parser} = this;
    const dCsrMatch = codegen.linkDependency(CsrMatch);
    const dType = codegen.linkDependency(this.type);
    const dParser = codegen.linkDependency(parser);
    const rStart = codegen.var('pos');
    const rChild = codegen.var();
    const rChildren = codegen.var('[]');
    codegen.while(`${rChild} = ${dParser}(ctx, pos)`, () => {
      codegen.js(`${rChildren}.push(${rChild})`);
      codegen.js(`pos = ${rChild}.end`);
    });
    const rResult = codegen.var(`new ${dCsrMatch}(${dType}, ${rStart}, pos, ${rChildren})`);
    if (node.ast !== null) {
      codegen.if('ctx.ast', () => {
        const childrenProp = node.leaf ? '' : `, children: ${rResult}.children.map(c => c.ast).filter(Boolean)`;
        const rAst = codegen.var(`{type:${dType}, pos:${rStart}, end:pos${childrenProp}}`);
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
