import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {emitStringMatch} from '@jsonjoy.com/util/lib/codegen/util/helpers';
import {RegExpTerminalMatch, StringTerminalMatch} from '../matches';
import {scrub} from '../util';
import type {RuleParser, TerminalShorthand} from '../types';

const DEFAULT_KIND = 'Text';

export class CodegenTerminal {
  public static readonly compile = (terminal: TerminalShorthand, kind?: string): RuleParser => {
    const codegen = new CodegenTerminal(terminal, kind);
    codegen.generate();
    return codegen.compile();
  };

  public readonly kind: string;
  public readonly codegen: Codegen<RuleParser>;

  constructor(public readonly terminal: TerminalShorthand, kind: string = DEFAULT_KIND) {
    this.kind = scrub(kind);
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  public generate() {
    const {codegen, terminal} = this;
    const dKind = codegen.linkDependency(this.kind);
    if (typeof terminal === 'string') {
      const dSTM = codegen.linkDependency(StringTerminalMatch);
      const cleanTerminal = scrub(terminal);
      const dString = codegen.linkDependency(cleanTerminal);
      codegen.if(emitStringMatch('str', 'pos', cleanTerminal), () => {
        codegen.return(`new ${dSTM}(${dKind}, pos, pos+${cleanTerminal.length}, ${dString})`);
      });
    } else if (terminal instanceof RegExp) {
      const dRTM = codegen.linkDependency(RegExpTerminalMatch);
      let source = terminal.source;
      if (source[0] !== '^') source = '^' + source;
      const regExp = new RegExp(source, terminal.flags);
      const dRegExp = codegen.linkDependency(regExp);
      const rMatch = codegen.var(`str.slice(pos).match(${dRegExp})`);
      const rLength = codegen.var(`${rMatch} ? +(${rMatch}[0].length) : 0`);
      codegen.if(rLength, () => {
        codegen.return(`new ${dRTM}(${dKind}, pos, pos+${rLength})`);
      });
    } else {
      throw new Error('INVALID_TERMINAL');
    }
  }

  public compile(): RuleParser {
    return this.codegen.compile();
  }
}
