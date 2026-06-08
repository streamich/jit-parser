import type {Expr} from '@jsonjoy.com/json-expression';
import type {ParseContext} from './context';
import type {Pattern} from './codegen/Pattern';

export interface Grammar {
  /**
   * Grammar start symbol.
   */
  start: string;

  /**
   * A collection of name grammar nodes. The named nodes can be referenced
   * from other nodes in the grammar, using the `RefNode` type.
   */
  cst: Record<string, GrammarNode>;

  /**
   * A collection of AST node factories for named CST nodes. If the AST node
   * factory is not specified on the CST node itself, the one by name from
   * this list will be used.
   */
  ast?: Record<string, AstNodeExpression>;
}

/**
 * All possible grammar nodes that can be defined in a grammar object.
 */
export type GrammarNode =
  | RefNode
  | TerminalNodeShorthand
  | TerminalNode
  | ProductionNodeShorthand
  | ProductionNode
  | UnionNode
  | ListNode
  | PredicateNode;

/**
 * Grammar without references and shorthand definitions.
 */
export type ResolvedGrammarNode = TerminalNode | ProductionNode | UnionNode | ListNode | PredicateNode;

/**
 * A named node reference is a reference to a named node in the top-level grammar
 * object. The node is referenced by its name string.
 */
export type RefNode<Name extends string = string> = {r: Name};

/**
 * A shorthand for defining terminal nodes. Empty string allows to skip the
 * terminal node.
 */
export type TerminalNodeShorthand = RegExp | string | '';

/**
 * A regex pattern expressed as a plain JSON object. This is the canonical form
 * for embedding regular expressions in JSON grammars, where native `RegExp`
 * literals are unavailable.
 *
 * - `rx` — the RegExp source string (ECMAScript dialect, anchored by the engine)
 * - `flags` — optional flag string; allowed values: `i`, `s`, `m`, `u`, `v`
 *   (do **not** use `g` or `y` — the engine manages position internally)
 *
 * @example
 * // case-insensitive word
 * {t: {rx: "[a-z]+", flags: "i"}}
 * // digits, no flags
 * {t: {rx: "\\d+"}}
 */
export interface RegexPattern {
  rx: string;
  flags?: string;
}

/**
 * A terminal node definition. A terminal node is a leaf node in the grammar
 * tree. It specifies a single match pattern either as a string or a regular
 * expression.
 */
export interface TerminalNode extends GrammarNodeBase {
  /**
   * Type of the terminal node, if not provided "Text" will be used.
   */
  type?: string;

  /**
   * The terminal node pattern. It can be a regular expression, a
   * {@link RegexPattern} object (for JSON-serialisable grammars), a literal
   * string, or an array of literal strings.
   */
  t: TerminalNodeShorthand | RegexPattern | string[];

  /**
   * When true, the terminal node will be repeated until no more matches are
   * found. The default is false. Only applicable when the terminal node is
   * an array of strings.
   */
  repeat?: '*' | '+';
}

export type ProductionNodeShorthand = GrammarNode[];

export interface ProductionNode extends GrammarNodeBase {
  p: ProductionNodeShorthand;

  /**
   * Type of the production node, if not provided "Production" will be used.
   */
  type?: string;
}

/**
 * A union node is a node that can match one of the alternatives. The first
 * matching alternative is selected.
 */
export interface UnionNode extends GrammarNodeBase {
  /**
   * A collection of alternatives to match. Picks the first matching alternative.
   */
  u: GrammarNode[];

  /**
   * Type of the union node, if not provided "Union" will be used.
   */
  type?: string;
}

/**
 * A list node is a node that can match a list of elements - zero or more.
 */
export interface ListNode extends GrammarNodeBase {
  /**
   * The node to use for repeating elements.
   */
  l: GrammarNode;

  /**
   * Minimum number of elements to match. Defaults to 0.
   */
  min?: number;

  /**
   * Maximum number of elements to match. Defaults to infinity.
   */
  max?: number;

  /**
   * Optional separator between elements.
   */
  sep?: GrammarNode;

  /**
   * Type of the list node, if not provided "List" will be used.
   */
  type?: string;
}

/**
 * A syntactic predicate (lookahead). A predicate matches **zero-width** — it
 * never consumes input and never produces an AST node — and only succeeds or
 * fails based on whether its inner node matches at the current position. This
 * is the PEG `&` / `!` operator, the one combinator that cannot be expressed in
 * terms of {@link ProductionNode}, {@link UnionNode}, and {@link ListNode}.
 *
 * A node has exactly one of `not` or `and`:
 *
 * - `{not: e}` — negative lookahead (`!e`): succeeds iff `e` does NOT match.
 * - `{and: e}` — positive lookahead (`&e`): succeeds iff `e` matches. This is
 *   sugar for `{not: {not: e}}`.
 *
 * Typical uses: keyword boundaries (`['null', {not: /[a-zA-Z0-9_]/}]`),
 * end-of-input (`{not: /[\s\S]/}` — "not any character"), and "match X unless
 * it is actually a Y" disambiguation.
 */
export interface PredicateNode extends GrammarNodeBase {
  /** Negative lookahead (`!e`). Mutually exclusive with `and`. */
  not?: GrammarNode;

  /** Positive lookahead (`&e`); sugar for `{not: {not: e}}`. Mutually exclusive with `not`. */
  and?: GrammarNode;

  /**
   * Type of the predicate node, if not provided "Predicate" will be used.
   */
  type?: string;
}

export interface GrammarNodeBase extends AstCodegenOpts {
  sample?: string;
}

export interface AstCodegenOpts {
  /**
   * Optional AST transformation.
   */
  ast?: AstNodeExpression;

  /**
   * Children mapping to AST node properties. When specified the `.children`
   * of a CST node will be used to generate the AST node properties.
   */
  children?: Record<number, string>;

  /**
   * If the list node is a leaf node. In this case, the AST node `children`
   * will not be generated automatically.
   */
  leaf?: boolean;
}

/**
 * A Concrete Syntax Tree (CST) node generated by the parser.
 */
export interface CstNode {
  ptr: Pattern;
  // type: string;
  pos: number;
  end: number;
  children?: CstNode[];
  // ast: undefined | null | unknown;
}

/**
 * The default shape if an Abstract Syntax Tree (AST) node generated by the
 * parser, when no custom AST generation is specified in the grammar.
 */
export interface CanonicalAstNode {
  type: string;
  pos: number;
  end: number;
  raw?: string;
  children?: (CanonicalAstNode | unknown)[];
}

/**
 * A parser function that takes a parse context and a position in the input
 * string and returns a CST node or `undefined` if the parsing failed.
 */
export type Parser = (ctx: ParseContext, pos: number) => CstNode | undefined;

/**
 * When parser is executed with "ast" flag on, it will generate an AST tree next
 * to its CST tree. The "ast" properties in grammar nodes can specify how the AST
 * tree should be generated. `undefined` means the default AST generation, `null`
 * means that no AST node will be generated
 *
 * If not `null` or `undefined` the value will be treated as a JSON Expression,
 * which will be executed and its return value will be used as the AST node. The
 * expression will run with the {@link AstExpressionData} object as its context.
 */
export type AstNodeExpression = undefined | null | unknown | Expr;

/**
 * The context object passed to the AST expression function. The expressions
 * can retrieve data from this object using the `['$', '/path']` syntax.
 */
export interface AstExpressionData {
  cst: CstNode;
  ast: CanonicalAstNode | unknown;
}

export type AstNodeFactory = (cst: CstNode, src: string) => unknown;

/**
 * When in debug mode, the parser will generate a trace of the parsing process.
 * Each node in the trace represents a grammar node that was attempted to be
 * matched at a specific position in the input string.
 */
export interface ParseTraceNode {
  /** The position in the input string where the match was attempted. */
  pos: number;
  /** The grammar node, which was attempted to be matched. */
  ptr: ResolvedGrammarNode;
  /** The matched CST node, if the match was successful. */
  match?: CstNode;
  /** The list of recursively called children nodes. */
  children?: ParseTraceNode[];
}

export interface RootTraceNode {
  pos: number;
  children: ParseTraceNode[];
}
