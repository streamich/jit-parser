import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import type {Parser, ProductionParser} from '../types';
import {ProductionMatch} from '../matches';

export class CodegenProduction {
  public static readonly compile = (production: Parser[]): ProductionParser => {
    const codegen = new CodegenProduction(production);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<ProductionParser>;

  constructor(public readonly production: Parser[]) {
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  public generate() {
    const {codegen, production} = this;
    const results: string[] = [];
    const dPM = codegen.linkDependency(ProductionMatch);
    const rStart = codegen.var('pos');
    for (const matcher of production) {
      const dep = codegen.linkDependency(matcher);
      const reg = codegen.var(`${dep}(str, pos)`);
      results.push(reg);
      codegen.if(`!${reg}`, () => {
        codegen.return('');
      });
      codegen.js(`pos = ${reg}.end`);
    }
    const rChildren = codegen.var(`[${results.join(', ')}]`);
    const rResult = codegen.var(`new ${dPM}('Production', ${rStart}, pos, ${rChildren})`);
    // for (const result of results) {
    //   codegen.js(`console.log(${result})`);
    //   const rAstNode = codegen.var(`${result}.ast`);
    //   codegen.if(`${rAstNode} === void 0`, () => {
    //     codegen.js(`${rChildren}.push(${result})`);
    //   }, () => {
    //     codegen.js(`${rChildren}.push(${rAstNode})`);
    //   });
    // }
    codegen.return(rResult);
  }

  public compile(): ProductionParser {
    return this.codegen.compile();
  }
}
