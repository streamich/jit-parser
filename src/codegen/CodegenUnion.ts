import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CstMatch} from '../matches';
import {CodegenContext} from '../context';
import type {Parser, UnionNode} from '../types';
import type {Pattern} from './Pattern';

export class CodegenUnion {
  public static readonly compile = (
    rule: UnionNode,
    pattern: Pattern,
    parsers: Parser[],
    ctx: CodegenContext = new CodegenContext(),
  ): Parser => {
    const codegen = new CodegenUnion(rule, pattern, parsers, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(
    protected readonly node: UnionNode,
    protected readonly pattern: Pattern,
    protected readonly parsers: Parser[],
    protected readonly ctx: CodegenContext,
  ) {
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {pattern, codegen, parsers} = this;
    const deps: string[] = [];
    const dPattern = codegen.linkDependency(pattern);
    const dCstMatch = codegen.linkDependency(CstMatch);
    let rDebug = '';
    const rTraceNodeParent = codegen.var();
    if (this.ctx.debug) {
      rDebug = codegen.var();
      const rTrace = codegen.var('ctx.trace');
      codegen.var(`${rTraceNodeParent} = ${rTrace} && ${rTrace}[${rTrace}.length - 1]`);
      codegen.if(rTraceNodeParent, () => {
        codegen.js(`${rDebug} = {ptr: ${dPattern}, pos: pos, children: []}`);
        codegen.js(`${rTraceNodeParent}.children.push(${rDebug})`);
        codegen.js(`${rTrace}.push(${rDebug})`);
      });
    }
    for (const parser of parsers) deps.push(codegen.linkDependency(parser));
    const rMatch = codegen.var(`${deps.join('(ctx, pos) || ')}(ctx, pos)`);
    codegen.if(`!${rMatch}`, () => {
      if (this.ctx.debug) {
        codegen.if(rTraceNodeParent, () => {
          const rTrace = codegen.var('ctx.trace');
          codegen.js(`${rTrace}.pop();`);
        });
      }
      codegen.return('');
    });
    const rEnd = codegen.var();
    const rChildren = codegen.var();
    codegen.js(`${rEnd} = ${rMatch}.end;`);
    codegen.js(`${rChildren} = [${rMatch}];`);
    const rResult = codegen.var(`new ${dCstMatch}(pos, ${rEnd}, ${dPattern}, ${rChildren})`);
    if (this.ctx.debug) {
      codegen.if(rTraceNodeParent, () => {
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

  public generateCodeText(): {js: string; deps: unknown[]} {
    return this.codegen.generate();
  }
}
