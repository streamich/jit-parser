import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {emitStringMatch} from '@jsonjoy.com/util/lib/codegen/util/helpers';
import {LeafCsrMatch} from '../matches';
import {scrub} from '../util';
import {evaluate} from 'json-joy/lib/json-expression';
import {Vars} from 'json-joy/lib/json-expression/Vars';
import type {Parser, Terminal, TerminalShorthand} from '../types';

const DEFAULT_KIND = 'Text';

const isTerminal = (item: Terminal | TerminalShorthand): item is Terminal =>
  typeof item === 'object';

export class CodegenTerminal {
  public static readonly compile = (terminal: Terminal | TerminalShorthand): Parser => {
    if (!isTerminal(terminal)) return CodegenTerminal.compile({match: terminal});
    const codegen = new CodegenTerminal(terminal);
    codegen.generate();
    return codegen.compile();
  };

  public readonly kind: string;
  public readonly codegen: Codegen<Parser>;

  constructor(public readonly terminal: Terminal) {
    this.kind = typeof terminal.type === 'string' ? scrub(terminal.type) : DEFAULT_KIND;
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {codegen, terminal} = this;
    const match = terminal.match;
    const dKind = codegen.linkDependency(this.kind);
    const dLeafCsrMatch = codegen.linkDependency(LeafCsrMatch);
    const rResult = codegen.var();
    if (typeof match === 'string') {
      const cleanTerminal = scrub(match);
      const dString = codegen.linkDependency(cleanTerminal);
      codegen.if(emitStringMatch('str', 'pos', cleanTerminal), () => {
        codegen.js(`${rResult} = new ${dLeafCsrMatch}(${dKind}, pos, pos + ${cleanTerminal.length}, ${dString});`);
      });
    } else if (match instanceof RegExp) {
      let source = match.source;
      if (source[0] !== '^') source = '^' + source;
      const regExp = new RegExp(source, match.flags);
      const dRegExp = codegen.linkDependency(regExp);
      const rSlice = codegen.var(`str.slice(pos)`);
      const rMatch = codegen.var(`${rSlice}.match(${dRegExp})`);
      codegen.if(rMatch, () => {
        const rLength = codegen.var(`${rMatch} ? +(${rMatch}[0].length) : 0`);
        codegen.js(`${rResult} = new ${dLeafCsrMatch}(${dKind}, pos, pos + ${rLength}, ${rSlice}.slice(0, ${rLength}));`);
      });
    } else {
      throw new Error('INVALID_TERMINAL');
    }
    codegen.if('ctx.ast', () => {
      if (terminal.ast === null) {
      } else if (terminal.ast) {
        const dEv = codegen.linkDependency(evaluate);
        const dVars = codegen.linkDependency(Vars);
        codegen.js(`${rResult}.ast = ${dEv}(${JSON.stringify(terminal.ast)}, {vars: new ${dVars}({csr: ${rResult}})})`);
      } else {
        codegen.js(`${rResult}.ast = {};`);
      }
    });
    codegen.return(rResult);
  }

  public compile(): Parser {
    return this.codegen.compile();
  }
}
