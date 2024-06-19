import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {emitStringMatch} from '@jsonjoy.com/util/lib/codegen/util/helpers';
import {LeafCsrMatch} from '../matches';
import {scrub} from '../util';
import {JsonExpressionCodegen} from 'json-joy/lib/json-expression';
import {operatorsMap} from 'json-joy/lib/json-expression/operators';
import {Vars} from 'json-joy/lib/json-expression/Vars';
import type {Parser, TerminalNode, TerminalNodeShorthand} from '../types';

const DEFAULT_KIND = 'Text';

const isTerminalShorthandNode = (item: any): item is TerminalNodeShorthand =>
  typeof item === 'string' || item instanceof RegExp;

export class CodegenTerminal {
  public static readonly compile = (terminal: TerminalNode | TerminalNodeShorthand): Parser => {
    if (isTerminalShorthandNode(terminal)) return CodegenTerminal.compile({t: terminal});
    const codegen = new CodegenTerminal(terminal);
    codegen.generate();
    return codegen.compile();
  };

  public readonly type: string;
  public readonly codegen: Codegen<Parser>;

  constructor(public readonly node: TerminalNode) {
    this.type = typeof node.type === 'string' ? scrub(node.type) : DEFAULT_KIND;
    this.codegen = new Codegen({
      args: ['ctx', 'pos'],
      prologue: 'var str = ctx.str;',
    });
  }

  public generate() {
    const {codegen, node: terminal} = this;
    const match = terminal.t;
    const dType = codegen.linkDependency(this.type);
    const dLeafCsrMatch = codegen.linkDependency(LeafCsrMatch);
    const rResult = codegen.var();
    if (typeof match === 'string') {
      const cleanTerminal = scrub(match);
      const dString = codegen.linkDependency(cleanTerminal);
      const condition = cleanTerminal ? emitStringMatch('str', 'pos', cleanTerminal) : 'true';
      codegen.if(condition, () => {
        codegen.js(`${rResult} = new ${dLeafCsrMatch}(${dType}, pos, pos + ${cleanTerminal.length}, ${dString});`);
      }, () => {
        codegen.return('');
      });
    } else if (match instanceof RegExp) {
      let source = match.source;
      if (source[0] !== '^') source = '^(' + source + ')';
      const regExp = new RegExp(source, match.flags);
      const dRegExp = codegen.linkDependency(regExp);
      const rSlice = codegen.var(`str.slice(pos)`);
      const rMatch = codegen.var(`${rSlice}.match(${dRegExp})`);
      codegen.if(rMatch, () => {
        const rLength = codegen.var(`${rMatch} ? +(${rMatch}[0].length) : 0`);
        codegen.js(`${rResult} = new ${dLeafCsrMatch}(${dType}, pos, pos + ${rLength}, ${rSlice}.slice(0, ${rLength}));`);
      }, () => {
        codegen.return('');
      });
    } else {
      throw new Error('INVALID_TERMINAL');
    }
    if (terminal.ast !== null) {
      codegen.if('ctx.ast', () => {
        // TODO: generate an external function? `if (ctx.ast) res.ast = dx();`.
        if (terminal.ast) {
          const exprCodegen = new JsonExpressionCodegen({
            expression: <any>terminal.ast,
            operators: operatorsMap,
          });
          const fn = exprCodegen.run().compile();
          const dExpr = codegen.linkDependency(fn);
          const dVars = codegen.linkDependency(Vars);
          const rAst = codegen.var(`{type:${dType},pos:pos,end:${rResult}.end,raw:${rResult}.raw}`);
          codegen.js(`${rResult}.ast = ${dExpr}({vars: new ${dVars}({cst: ${rResult}, ast: ${rAst}})})`);
        } else {
          const rAst = codegen.var(`{type:${dType},pos:pos,end:${rResult}.end,raw:${rResult}.raw}`);
          codegen.js(`${rResult}.ast = ${rAst};`);
        }
      });
    }
    codegen.return(rResult);
  }

  public compile(): Parser {
    const fn = this.codegen.compile();
    return fn;
  }
}
