import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import type {MatchParser, ProductionParser} from '../types';

export class CodegenProduction {
  public static readonly compile = (production: MatchParser[]): ProductionParser => {
    const codegen = new CodegenProduction(production);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<ProductionParser>;

  constructor(public readonly production: MatchParser[]) {
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  public generate() {
    const {codegen, production} = this;
    const results: string[] = [];
    for (const matcher of production) {
      const dep = codegen.linkDependency(matcher);
      const reg = codegen.var(`${dep}(str, pos)`);
      results.push(reg);
      codegen.if(`!${reg}`, () => {
        codegen.return('');
      });
      codegen.js(`pos = ${reg}.end`);
    }
    codegen.return(`[${results.join(', ')}]`);
  }

  public compile(): ProductionParser {
    return this.codegen.compile();
  }
}
