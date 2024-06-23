import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CsrMatch} from '../matches';
import {CodegenContext} from '../context';
import type {Parser, UnionNode} from '../types';

export class CodegenUnion {
  public static readonly compile = (rule: UnionNode, parsers: Parser[], ctx: CodegenContext = new CodegenContext()): Parser => {
    const codegen = new CodegenUnion(rule, parsers, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(
    public readonly node: UnionNode,
    public readonly parsers: Parser[],
    protected readonly ctx: CodegenContext,
  ) {
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {node, codegen, parsers} = this;
    const deps: string[] = [];
    const dNode = codegen.linkDependency(node);
    const dCsrMatch = codegen.linkDependency(CsrMatch);
    for (const parser of parsers) deps.push(codegen.linkDependency(parser));
    const rMatch = codegen.var(`${deps.join('(ctx, pos) || ')}(ctx, pos)`);
    codegen.if(`!${rMatch}`, () => {
      codegen.return('');
    });
    const rEnd = codegen.var();
    const rChildren = codegen.var();
    codegen.js(`${rEnd} = ${rMatch}.end;`);
    codegen.js(`${rChildren} = [${rMatch}];`);
    codegen.return(`new ${dCsrMatch}(pos, ${rEnd}, ${dNode}, ${rChildren})`);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
