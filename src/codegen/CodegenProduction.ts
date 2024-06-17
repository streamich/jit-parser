import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {CsrMatch} from '../matches';
import type {Parser} from '../types';

export class CodegenProduction {
  public static readonly compile = (production: Parser[]): Parser => {
    const codegen = new CodegenProduction(production);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(public readonly production: Parser[]) {
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  public generate() {
    const {codegen, production} = this;
    const results: string[] = [];
    const dPM = codegen.linkDependency(CsrMatch);
    const rStart = codegen.var('pos');
    const rChildren = codegen.var('[]');
    const rNodeAst = codegen.var();
    for (const matcher of production) {
      const dep = codegen.linkDependency(matcher);
      const reg = codegen.var(`${dep}(str, pos)`);
      results.push(reg);
      codegen.if(`!${reg}`, () => {
        codegen.return('');
      });
      codegen.js(`pos = ${reg}.end`);
      codegen.js(`${rNodeAst} = ${reg}.ast`);
      codegen.if(`${rNodeAst} === void 0`, () => {
        codegen.js(`${rChildren}.push(${reg})`);
      }, () => {
        codegen.if(`${rNodeAst} !== null`, () => {
          codegen.js(`${rChildren}.push(${rNodeAst})`);
        });  
      });
    }
    // const rChildren = codegen.var(`[${results.join(', ')}]`);
    for (const result of results) {

    }
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

  public compile(): Parser {
    return this.codegen.compile();
  }
}
