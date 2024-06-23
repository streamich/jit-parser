import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CstMatch} from '../matches';
import {CodegenContext} from '../context';
import type {ListNode, Parser} from '../types';
import type {Pattern} from './Pattern';

export class CodegenList {
  public static readonly compile = (
    rule: ListNode,
    pattern: Pattern,
    parser: Parser,
    ctx: CodegenContext = new CodegenContext(),
  ): Parser => {
    const codegen = new CodegenList(rule, pattern, parser, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(
    protected readonly node: ListNode,
    protected readonly pattern: Pattern,
    protected readonly parser: Parser,
    protected readonly ctx: CodegenContext,
  ) {
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {pattern, codegen, parser} = this;
    const dCstMatch = codegen.linkDependency(CstMatch);
    const dPattern = codegen.linkDependency(pattern);
    const dParser = codegen.linkDependency(parser);
    const rStart = codegen.var('pos');
    const rChild = codegen.var();
    const rChildren = codegen.var('[]');
    codegen.while(`${rChild} = ${dParser}(ctx, pos)`, () => {
      codegen.js(`${rChildren}.push(${rChild})`);
      codegen.js(`pos = ${rChild}.end`);
    });
    return codegen.return(`new ${dCstMatch}(${rStart}, pos, ${dPattern}, ${rChildren})`);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
