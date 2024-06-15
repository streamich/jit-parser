import {Expr} from 'json-joy/lib/json-expression';
import {RuleMatch} from './matches';

export type MaybeArray<T> = T | T[];

export type TerminalShorthand = RegExp | string | '';

export interface Terminal<Kind extends string = string> {
  kind: Kind;
  match: TerminalShorthand;
}

export type NonTerminal<Name extends string = string> = {n: Name};

export type Production = (Terminal | TerminalShorthand | NonTerminal<any>)[];

export type Alternatives = Array<TerminalShorthand | NonTerminal | Production>;

export interface Rule {
  /**
   * A collection of alternatives to match.
   */
  match: Alternatives;

  /**
   * Optional AST transformation.
   */
  ast?: object;

  /**
   * Optional expression, executed on parse exit from the rule.
   */
  onExit?: Expr;
}

export interface Grammar {
  /**
   * Grammar start symbol.
   */
  start: string;

  /**
   * A collection of all grammar rules.
   */
  rules: Record<string, Rule | Alternatives>;
}

export interface MatchResult {
  kind: string;
  pos: number;
  end: number;
}

export type ProductionResult = MatchResult[];

export type MatchParser = (str: string, pos: number) => MatchResult | undefined;
export type ProductionParser = (str: string, pos: number) => ProductionResult | undefined;
export type RuleParser = (str: string, pos: number) => RuleMatch | undefined;

export type Parser = (str: string, pos: number) => MatchResult | ProductionResult | undefined;
