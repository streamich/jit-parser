import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {LeafCstMatch} from '../matches';
import {CodegenContext} from '../context';
import type {Parser, PredicateNode} from '../types';
import type {Pattern} from './Pattern';

export class CodegenPredicate {
  public static readonly compile = (
    node: PredicateNode,
    pattern: Pattern,
    parser: Parser,
    ctx: CodegenContext = new CodegenContext(),
  ): Parser => {
    const codegen = new CodegenPredicate(node, pattern, parser, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(
    protected readonly node: PredicateNode,
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
    const dLeafCstMatch = codegen.linkDependency(LeafCstMatch);
    const dPattern = codegen.linkDependency(pattern);
    const dParser = codegen.linkDependency(parser);
    const rMatch = codegen.var(`${dParser}(ctx, pos)`);
    codegen.if(rMatch, () => {
      codegen.return('');
    });
    codegen.return(`new ${dLeafCstMatch}(pos, pos, ${dPattern})`);
  }

  public compile(): Parser {
    return this.codegen.compile();
  }
}
