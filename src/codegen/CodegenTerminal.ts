import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {emitStringMatch} from '@jsonjoy.com/util/lib/codegen/util/helpers';
import {LeafCstMatch} from '../matches';
import {scrub} from '../util';
import {CodegenContext} from '../context';
import type {Parser, TerminalNode, TerminalNodeShorthand} from '../types';
import type {Pattern} from './Pattern';

const isTerminalShorthandNode = (item: any): item is TerminalNodeShorthand =>
  typeof item === 'string' || item instanceof RegExp;

export class CodegenTerminal {
  public static readonly compile = (
    terminal: TerminalNode | TerminalNodeShorthand,
    pattern: Pattern,
    ctx: CodegenContext = new CodegenContext(),
  ): Parser => {
    if (isTerminalShorthandNode(terminal)) return CodegenTerminal.compile({t: terminal}, pattern, ctx);
    const codegen = new CodegenTerminal(terminal, pattern, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<Parser>;

  constructor(
    protected readonly node: TerminalNode,
    protected readonly pattern: Pattern,
    protected readonly ctx: CodegenContext,
  ) {
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {codegen, node, pattern} = this;
    const match = node.t;
    const dPattern = codegen.linkDependency(pattern);
    const dLeafCstMatch = codegen.linkDependency(LeafCstMatch);
    let rDebug = '';
    const rTraceNodeParent = codegen.var();
    if (this.ctx.debug) {
      rDebug = codegen.var();
      const rTrace = codegen.var('ctx.trace');
      codegen.js(`${rTraceNodeParent} = ${rTrace} && ${rTrace}[${rTrace}.length - 1]`);
      codegen.if(rTraceNodeParent, () => {
        codegen.js(`${rDebug} = {ptr: ${dPattern}, pos: pos}`);
        codegen.js(`${rTraceNodeParent}.children.push(${rDebug})`);
      });
    }
    if (typeof match === 'string') {
      const cleanTerminal = scrub(match);
      const condition = cleanTerminal ? emitStringMatch('str', 'pos', cleanTerminal) : 'true';
      codegen.if(`!(${condition})`, () => {
        codegen.return('');
      });
      const rMatch = codegen.var(`new ${dLeafCstMatch}(pos, pos + ${cleanTerminal.length}, ${dPattern});`);
      if (this.ctx.debug) {
        codegen.if(rTraceNodeParent, () => {
          codegen.js(`${rDebug}.match = ${rMatch}`);
        });
      }
      codegen.return(rMatch);
    } else if (match instanceof RegExp) {
      let source = match.source;
      if (source[0] !== '^') source = '^(' + source + ')';
      const regExp = new RegExp(source, match.flags);
      const dRegExp = codegen.linkDependency(regExp);
      const rSlice = codegen.var(`str.slice(pos)`);
      const rMatch = codegen.var(`${rSlice}.match(${dRegExp})`);
      codegen.if(`!${rMatch}`, () => {
        codegen.return('');
      });
      const rLength = codegen.var(`${rMatch} ? +(${rMatch}[0].length) : 0`);
      const rResult = codegen.var(`new ${dLeafCstMatch}(pos, pos + ${rLength}, ${dPattern});`);
      if (this.ctx.debug) {
        codegen.if(rTraceNodeParent, () => {
          codegen.js(`${rDebug}.match = ${rResult}`);
        });
      }
      codegen.return(rResult);
    } else if (match instanceof Array) {
      if (node.repeat) {
        const rEnd = codegen.var('pos');
        codegen.while('1', () => {
          for (const match0 of match) {
            const cleanTerminal = scrub(match0);
            const condition = emitStringMatch('str', rEnd, cleanTerminal);
            codegen.if(condition, () => {
              codegen.js(`${rEnd} += ${cleanTerminal.length};`);
              codegen.js('continue;');
            });
          }
          codegen.js('break;');
        });
        if (node.repeat === '+') {
          codegen.if(`${rEnd} === pos`, () => {
            codegen.return('');
          });
        }
        const rMatch = codegen.var(`new ${dLeafCstMatch}(pos, ${rEnd}, ${dPattern});`);
        if (this.ctx.debug) {
          codegen.if(rTraceNodeParent, () => {
            codegen.js(`${rDebug}.match = ${rMatch}`);
          });
        }
        codegen.return(rMatch);
      } else {
        const rEnd = codegen.var('pos');
        for (const match0 of match) {
          const cleanTerminal = scrub(match0);
          const condition = emitStringMatch('str', 'pos', cleanTerminal);
          codegen.if(condition, () => {
            codegen.js(`${rEnd} += ${cleanTerminal.length};`);
          });
        }
        codegen.if(`${rEnd} === pos`, () => {
          codegen.return('');
        });
        const rMatch = codegen.var(`new ${dLeafCstMatch}(pos, ${rEnd}, ${dPattern});`);
        if (this.ctx.debug) {
          codegen.if(rTraceNodeParent, () => {
            codegen.js(`${rDebug}.match = ${rMatch}`);
          });
        }
        codegen.return(rMatch);
      }
    } else {
      throw new Error('INVALID_TERMINAL');
    }
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }

  public generateCodeText(): {js: string; deps: unknown[]} {
    return this.codegen.generate();
  }
}
