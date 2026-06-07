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
    sepParser?: Parser,
  ): Parser => {
    const codegen = new CodegenList(rule, pattern, parser, ctx, sepParser);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(
    protected readonly node: ListNode,
    protected readonly pattern: Pattern,
    protected readonly parser: Parser,
    protected readonly ctx: CodegenContext,
    protected readonly sepParser?: Parser,
  ) {
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {pattern, codegen, parser, node, sepParser} = this;
    const dCstMatch = codegen.linkDependency(CstMatch);
    const dPattern = codegen.linkDependency(pattern);
    const dParser = codegen.linkDependency(parser);
    const dSepParser = sepParser ? codegen.linkDependency(sepParser) : '';
    const rStart = codegen.var('pos');
    const rChild = codegen.var();
    const rChildren = codegen.var('[]');
    const min = node.min ?? 0;
    const max = node.max ?? 0;
    const rCount = codegen.var('0');
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
    if (dSepParser) {
      const rSep = codegen.var();
      codegen.js(`${rChild} = ${dParser}(ctx, pos);`);
      codegen.if(`${rChild} && ${rChild}.end !== pos`, () => {
        codegen.js(`${rChildren}.push(${rChild});`);
        codegen.js(`pos = ${rChild}.end;`);
        codegen.js(`${rCount}++;`);
        const maxCondition = max > 0 ? ` && ${rCount} < ${max}` : '';
        codegen.while(`1${maxCondition}`, () => {
          codegen.js(`var sepPos = pos;`);
          codegen.js(`${rSep} = ${dSepParser}(ctx, pos);`);
          codegen.js(`if (!${rSep} || ${rSep}.end === pos) break;`);
          codegen.js(`pos = ${rSep}.end;`);
          codegen.js(`${rChild} = ${dParser}(ctx, pos);`);
          codegen.js(`if(!${rChild} || ${rChild}.end === pos){`);
          codegen.js(`pos=sepPos;break;`);
          codegen.js(`}`);
          codegen.js(`${rChildren}.push(${rSep}, ${rChild});`);
          codegen.js(`pos = ${rChild}.end;`);
          codegen.js(`${rCount}++;`);
        });
      });
    } else {
      codegen.while(`${rChild} = ${dParser}(ctx, pos)`, () => {
        codegen.js(`if (${rChild}.end === pos) break;`);
        codegen.js(`${rChildren}.push(${rChild});`);
        codegen.js(`pos = ${rChild}.end;`);
        codegen.js(`${rCount}++;`);
        if (max > 0) {
          codegen.js(`if (${rCount} >= ${max}) break;`);
        }
      });
    }
    if (min > 0) {
      codegen.js(`if (${rCount} < ${min}) return undefined;`);
    }
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
