import {Expr} from 'json-joy/lib/json-expression';

export type MaybeArray<T> = T | T[];

export type Terminal = RegExp | string | '';
export type NonTerminal<Name extends string = string> = [name: Name];
export type Production = (Terminal | NonTerminal<any>)[];

export type Alternatives = Array<Terminal | NonTerminal | Production>;

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

export interface Match {
  kind: string;
  pos: number;
  end: number;
}

export type RuleParser = (str: string, pos: number) => Match | undefined;
 