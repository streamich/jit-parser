import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {CsrMatch} from '../matches';
import {scrub} from '../util';
import type {Parser, UnionNode} from '../types';

const DEFAULT_TYPE = 'Union';

export class CodegenUnion {
  public static readonly compile = (rule: UnionNode, parsers: Parser[]): Parser => {
    const codegen = new CodegenUnion(rule, parsers);
    codegen.generate();
    return codegen.compile();
  };

  public readonly type: string;
  public readonly codegen: Codegen<Parser>;

  constructor(
    public readonly node: UnionNode,
    public readonly alternatives: Parser[],
  ) {
    this.type = typeof node.type === 'string' ? scrub(node.type) : DEFAULT_TYPE;
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  public generate() {
    const {codegen, alternatives} = this;
    const deps: string[] = [];
    const dCsrMatch = codegen.linkDependency(CsrMatch);
    const kind = scrub(this.type);
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
    const rResult = codegen.var(`new ${dCsrMatch}('${kind}', pos, ${rEnd}, ${rChildren})`);
    if (this.node.ast !== void 0) {
      codegen.js(`${rResult}.ast = ${JSON.stringify(this.node.ast)}`);
    }
    codegen.return(rResult);
  }

  public compile(): Parser {
    return this.codegen.compile();
  }
}
