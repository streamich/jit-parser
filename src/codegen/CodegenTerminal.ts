import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {emitStringMatch} from '@jsonjoy.com/util/lib/codegen/util/helpers';
import {StringTerminalMatch} from '../matches';
import {scrub} from '../util';
import type {RuleParser, Terminal} from '../types';

export class CodegenTerminal {
  public static readonly compile = (terminal: Terminal, kind?: string): RuleParser => {
    const codegen = new CodegenTerminal(terminal, kind);
    codegen.generate();
    return codegen.compile();
  };

  public readonly kind: string;
  public readonly codegen: Codegen<RuleParser>;

  constructor(public readonly terminal: Terminal, kind: string = '$Terminal') {
    this.kind = scrub(kind);
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  public generate() {
    const {codegen, terminal} = this;
    const dKind = codegen.linkDependency(this.kind);
    const dSTM = codegen.linkDependency(StringTerminalMatch);
    if (typeof terminal === 'string') {
      const cleanTerminal = scrub(terminal);
      const dString = codegen.linkDependency(cleanTerminal);
      codegen.if(emitStringMatch('str', 'pos', cleanTerminal), () => {
        codegen.return(`new ${dSTM}(${dKind}, pos, pos + ${cleanTerminal.length}, ${dString})`);
      });
    } else if (terminal instanceof RegExp) {

    } else {
      throw new Error('INVALID_TERMINAL');
    }
  }

  public compile(): RuleParser {
    return this.codegen.compile();
  }
}
