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
    let rDebug = '';
    const rTraceNodeParent = codegen.var();
    if (this.ctx.debug) {
      rDebug = codegen.var();
      const rTrace = codegen.var('ctx.trace');
      codegen.js(`${rTraceNodeParent} = ${rTrace} && ${rTrace}[${rTrace}.length - 1]`);
      codegen.if(rTraceNodeParent, () => {
        codegen.js(`${rDebug} = {ptr: ${dPattern}, pos: pos, children: []}`);
        codegen.js(`${rTraceNodeParent}.children.push(${rDebug})`);
        codegen.js(`${rTrace}.push(${rDebug})`);
      });
    }
    codegen.while(`${rChild} = ${dParser}(ctx, pos)`, () => {
      codegen.js(`${rChildren}.push(${rChild})`);
      codegen.js(`pos = ${rChild}.end`);
    });
    const rResult = codegen.var(`new ${dCstMatch}(${rStart}, pos, ${dPattern}, ${rChildren})`);
    if (this.ctx.debug) {
      codegen.if(`${rTraceNodeParent}`, () => {
        codegen.js(`ctx.trace.pop();`);
        codegen.js(`${rDebug}.match = ${rResult}`);
      });
    }
    codegen.return(rResult);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
