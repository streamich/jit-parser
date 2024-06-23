import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CstMatch} from '../matches';
import {CodegenContext} from '../context';
import type {Parser, UnionNode} from '../types';
import type {Pattern} from './Pattern';

export class CodegenUnion {
  public static readonly compile = (rule: UnionNode, pattern: Pattern, parsers: Parser[], ctx: CodegenContext = new CodegenContext()): Parser => {
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
    const {node, pattern, codegen, parsers} = this;
    const deps: string[] = [];
    const dPattern = codegen.linkDependency(pattern);
    const dCstMatch = codegen.linkDependency(CstMatch);
    for (const parser of parsers) deps.push(codegen.linkDependency(parser));
    const rMatch = codegen.var(`${deps.join('(ctx, pos) || ')}(ctx, pos)`);
    codegen.if(`!${rMatch}`, () => {
      codegen.return('');
    });
    const rEnd = codegen.var();
    const rChildren = codegen.var();
    codegen.js(`${rEnd} = ${rMatch}.end;`);
    codegen.js(`${rChildren} = [${rMatch}];`);
    codegen.return(`new ${dCstMatch}(pos, ${rEnd}, ${dPattern}, ${rChildren})`);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
