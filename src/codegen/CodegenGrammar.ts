import {Codegen} from '@jsonjoy.com/util/lib/codegen'
import {lazy} from '@jsonjoy.com/util/lib/lazyFunction'
// import {emitStringMatch} from '@jsonjoy.com/util/lib/codegen/util/helpers';
// import {RegExpTerminalMatch, StringTerminalMatch} from '../matches';
// import {scrub} from '../util';
import type {Grammar, Rule, MatchParser, RuleParser, Parser, TerminalShorthand, NonTerminal, Production, Terminal, ProductionParser} from '../types';
import {CodegenTerminal} from './CodegenTerminal';
import {CodegenRule} from './CodegenRule';
import {CodegenProduction} from './CodegenProduction';

const isTerminalShorthand = (item: any): item is TerminalShorthand =>
  typeof item === 'string' || item instanceof RegExp;

const isProduction = (item: any): item is Production =>
  item instanceof Array;

const isNonTerminal = (item: any): item is NonTerminal =>
  typeof item === 'object' && item && typeof item.n === 'string';

export class CodegenGrammar {
  public static readonly compile = (grammar: Grammar): MatchParser => {
    const codegen = new CodegenGrammar(grammar);
    return codegen.compile();
  };

  public readonly codegen: Codegen<MatchParser>;
  protected readonly parsers = new Map<string, RuleParser>();

  constructor(public readonly grammar: Grammar) {
    this.codegen = new Codegen({
      args: ['str', 'pos'],
    });
  }

  protected compileItem(item: TerminalShorthand | Production | NonTerminal): Parser {
    if (isTerminalShorthand(item)) {
      return CodegenTerminal.compile(item);
    } else if (isProduction(item)) {
      return this.compileProduction(item);
    } else if (isNonTerminal(item)) {
      return this.compileRuleByName(item.n);
    } else {
      throw new Error(`Invalid [rule = ${name}] alternative: ${item}`);
    }
  }

  protected compileProduction(prod: Production): ProductionParser {
    const parsers: Parser[] = [];
    for (const item of prod) parsers.push(this.compileItem(item as any));
    return CodegenProduction.compile(parsers);
  }

  private __compileRule(name: string, rule: Rule): RuleParser {
    const parser = lazy(() => {
      const {match} = rule;
      const parsers: Parser[] = [];
      for (const item of match) parsers.push(this.compileItem(item as any));
      const ruleParser = CodegenRule.compile(name, rule, parsers);
      return ruleParser;
    });
    return parser;
  }

  protected compileRuleByName(name: string): RuleParser {
    if (this.parsers.has(name)) return this.parsers.get(name)!;
    const {grammar} = this;
    const {rules} = grammar;
    const ruleOrAlt = rules[name];
    if (!ruleOrAlt) throw new Error(`Unknown rule: ${name}`);
    const rule: Rule = ruleOrAlt instanceof Array ? {match: ruleOrAlt} : ruleOrAlt;
    const parser = this.__compileRule(name, rule);
    this.parsers.set(name, parser);
    return parser;
  }

  // public generate() {
  //   const {codegen, grammar} = this;
  //   const {start, rules} = grammar;
  //   const ruleOrAlt = rules[start];
  //   const rule: Rule = ruleOrAlt instanceof Array ? {match: ruleOrAlt} : ruleOrAlt;
  //   const a = this.compileRule(start, rule);
  //   // for (const [name, rule] of Object.entries(rules)) {
  //   //   const dep = codegen.linkDependency(this.compileRule(name, rule));
  //   //   this.rules.set(name, dep);
  //   // }
  //   // const start = this.rules.get(grammar.start);
  //   // if (!start) throw new Error('INVALID_START_SYMBOL');
  //   // codegen.return(`${start}(str, pos)`);
  // }

  public compile(): RuleParser {
    return this.compileRuleByName(this.grammar.start);
  }
}
