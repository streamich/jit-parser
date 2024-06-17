import type {Expr} from 'json-joy/lib/json-expression';
import type {ParseContext} from './ParseContext';

export type MaybeArray<T> = T | T[];

export type TerminalShorthand = RegExp | string | '';

export interface Terminal {
  /**
   * Type of the terminal node, if not provided "Text" will be used.
   */
  type?: string;
  match: TerminalShorthand;
  ast?: undefined | null | unknown;
}

export type NonTerminal<Name extends string = string> = {n: Name};

export interface Production {
  type?: string;
  items: ProductionShorthand;
  ast?: undefined | null | unknown;
}

export type ProductionShorthand = (Terminal | TerminalShorthand | NonTerminal<any>)[];

export type Alternatives = Array<Terminal | TerminalShorthand | NonTerminal | Production | ProductionShorthand>;

export interface Rule {
  /**
   * A collection of alternatives to match. Picks the first matching alternative.
   */
  match: Alternatives;

  /**
   * Optional AST transformation.
   */
  ast?: undefined | null | unknown;

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

export interface CsrNode {
  type: string;
  pos: number;
  end: number;
  children?: CsrNode[];
  ast: undefined | null | unknown;
}

export interface CanonicalAstNode {
  type: string;
  pos: number;
  end: number;
  children?: CanonicalAstNode[];
}

export type Parser = (ctx: ParseContext, pos: number) => CsrNode | undefined;

export interface AstExpressionData {
  csr: CsrNode;
}
