import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CsrMatch} from '../matches';
import {CodegenContext} from '../context';
import type {ListNode, Parser} from '../types';

export class CodegenList {
  public static readonly compile = (
    rule: ListNode,
    parser: Parser,
    ctx: CodegenContext = new CodegenContext(),
  ): Parser => {
    const codegen = new CodegenList(rule, parser, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(
    public readonly node: ListNode,
    public readonly parser: Parser,
    protected readonly ctx: CodegenContext,
  ) {
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {node, codegen, parser} = this;
    const dCsrMatch = codegen.linkDependency(CsrMatch);
    const dNode = codegen.linkDependency(node);
    const dParser = codegen.linkDependency(parser);
    const rStart = codegen.var('pos');
    const rChild = codegen.var();
    const rChildren = codegen.var('[]');
    codegen.while(`${rChild} = ${dParser}(ctx, pos)`, () => {
      codegen.js(`${rChildren}.push(${rChild})`);
      codegen.js(`pos = ${rChild}.end`);
    });
    return codegen.return(`new ${dCsrMatch}(${rStart}, pos, ${dNode}, ${rChildren})`);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
