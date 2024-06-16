import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {emitStringMatch} from '@jsonjoy.com/util/lib/codegen/util/helpers';
import {LeafCsrMatch} from '../matches';
import {scrub} from '../util';
import type {Parser, TerminalShorthand} from '../types';

const DEFAULT_KIND = 'Text';

export class CodegenTerminal {
  public static readonly compile = (terminal: TerminalShorthand, kind?: string): Parser => {
    const codegen = new CodegenTerminal(terminal, kind);
    codegen.generate();
    return codegen.compile();
  };

  public readonly kind: string;
  public readonly codegen: Codegen<Parser>;

  constructor(public readonly terminal: TerminalShorthand, kind: string = DEFAULT_KIND) {
    this.kind = scrub(kind);
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {codegen, terminal} = this;
    const dKind = codegen.linkDependency(this.kind);
    const dLeafCsrMatch = codegen.linkDependency(LeafCsrMatch);
    if (typeof terminal === 'string') {
      const cleanTerminal = scrub(terminal);
      const dString = codegen.linkDependency(cleanTerminal);
      codegen.if(emitStringMatch('str', 'pos', cleanTerminal), () => {
        codegen.return(`new ${dLeafCsrMatch}(${dKind}, pos, pos + ${cleanTerminal.length}, ${dString})`);
      });
    } else if (terminal instanceof RegExp) {
      let source = terminal.source;
      if (source[0] !== '^') source = '^' + source;
      const regExp = new RegExp(source, terminal.flags);
      const dRegExp = codegen.linkDependency(regExp);
      const rSlice = codegen.var(`str.slice(pos)`);
      const rMatch = codegen.var(`${rSlice}.match(${dRegExp})`);
      codegen.if(rMatch, () => {
        const rLength = codegen.var(`${rMatch} ? +(${rMatch}[0].length) : 0`);
        codegen.return(`new ${dLeafCsrMatch}(${dKind}, pos, pos + ${rLength}, ${rSlice}.slice(0, ${rLength}))`);
      });
    } else {
      throw new Error('INVALID_TERMINAL');
    }
  }

  public compile(): Parser {
    return this.codegen.compile();
  }
}
