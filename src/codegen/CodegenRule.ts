import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {RuleMatch} from '../matches';
import type {MatchParser, Rule, RuleParser} from '../types';
import {scrub} from '../util';

export class CodegenRule {
  public static readonly compile = (kind: string, rule: Rule, alternatives: MatchParser[]): RuleParser => {
    const codegen = new CodegenRule(kind, rule, alternatives);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<RuleParser>;

  constructor(
    public readonly kind: string,
    public readonly rule: Rule,
    public readonly alternatives: MatchParser[],
  ) {
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  public generate() {
    const {codegen, alternatives} = this;
    const deps: string[] = [];
    const dRM = codegen.linkDependency(RuleMatch);
    const kind = scrub(this.kind);
    for (const matcher of alternatives)
      deps.push(codegen.linkDependency(matcher));
    const rMatch = codegen.var(`${deps.join('(str, pos) || ')}(str, pos)`);
    codegen.if(`!${rMatch}`, () => {
      codegen.return('');
    });
    const rEnd = codegen.var();
    const rChildren = codegen.var();
    codegen.if(`${rMatch} instanceof Array`, () => {
      codegen.js(`${rEnd} = ${rMatch}[${rMatch}.length - 1].end;`);
      codegen.js(`${rChildren} = ${rMatch};`);
    }, () => {
      codegen.js(`${rEnd} = ${rMatch}.end;`);
      codegen.js(`${rChildren} = [${rMatch}];`);
    });
    codegen.return(`new ${dRM}('${kind}', pos, ${rEnd}, ${rChildren})`);
  }

  public compile(): RuleParser {
    return this.codegen.compile();
  }
}
