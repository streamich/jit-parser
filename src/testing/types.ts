/**
 * A standardized, language- and harness-agnostic test format for JSON Grammars.
 *
 * A {@link TestSuite} is pure data (it round-trips through JSON without loss),
 * so the same corpus of tests can drive any implementation of the grammar
 * runtime, in any language, under any test runner. The only language-specific
 * piece is a tiny *driver* (see `./driver.ts`) that knows how to compile a
 * grammar and produce its outputs; everything else — loading suites, comparing
 * outputs, updating snapshots, reporting — is shared logic.
 *
 * Each {@link TestCase} feeds one input to one grammar rule (in isolation, or
 * the whole grammar via the start symbol) and asserts on any subset of *output
 * channels*: the AST, the CST (structurally or as a printed tree), the debug
 * trace, how much input was consumed, and whether it parsed at all.
 */

/** A suite of grammar tests, typically one file per grammar. */
export interface TestSuite {
  /**
   * Optional reference to the grammar under test — a path (`"./json.ts"`,
   * `"./json.json"`) or an id. Informational: the runner is always handed the
   * resolved grammar object directly. The standalone CLI uses it to locate the
   * grammar when none is supplied programmatically.
   */
  grammar?: string;

  /** Human-readable suite label (used as the top-level group when reporting). */
  describe?: string;

  /**
   * Output channels to snapshot for *every* case in the suite (unless the case
   * overrides with its own {@link TestCase.snapshot}). On `--update` these are
   * (re)generated and written inline into each case; on a normal run they are
   * asserted, and a case that is missing a requested snapshot fails (so CI
   * catches un-updated snapshots).
   */
  snapshot?: SnapshotChannel[];

  /** The test cases. */
  tests: TestCase[];
}

/** A single grammar test: one input, one rule, any number of asserted channels. */
export interface TestCase {
  /** Human-readable label. Also the stable key for this case's snapshots. */
  name: string;

  /**
   * The grammar rule to compile and run in isolation. Defaults to the grammar's
   * `start` symbol (i.e. the whole grammar). Naming a rule here is how you test
   * a single production independently of the rest of the grammar.
   */
  rule?: string;

  /**
   * The input string to parse. Either this or {@link generate} should be set;
   * if both are omitted the input is the empty string.
   */
  src?: string;

  /**
   * Generate the input from the grammar instead of providing a fixed `src`.
   * Useful for round-trip / property checks: generate a sample for the rule and
   * assert it parses (typically paired with `"consumes": "all"`).
   */
  generate?: GenerateSpec;

  /** Skip this case. */
  skip?: boolean;

  /** Run only `only` cases in the suite (focuses the suite). */
  only?: boolean;

  /** Per-case override of the suite-level {@link TestSuite.snapshot} list. */
  snapshot?: SnapshotChannel[];

  // ---------------------------------------------------------- output channels

  // A channel is *asserted* when its key is present on the case. Presence is the
  // signal — so `"ast": null` asserts the AST is literal `null`, which is
  // distinct from omitting `ast` entirely.

  /** Expected AST — compared by exact deep-equality. The primary channel. */
  ast?: unknown;

  /** Expected CST in portable structural form `{type, pos, end, children?}`. */
  cst?: StructuralCst;

  /**
   * Expected CST as a printed tree, stored as an array of lines (joined with
   * `\n`). Compact and diffable; uses the same renderer as `printCst`.
   */
  cstPrint?: string[];

  /** Expected debug trace as a printed tree, stored as an array of lines. */
  trace?: string[];

  /** Expected number of input characters consumed (`cst.end`). */
  end?: number;

  /** Whether the input is expected to parse at all (a match was produced). */
  parses?: boolean;

  /** Shorthand assertion that the entire input was consumed (`end === len`). */
  consumes?: 'all';
}

/**
 * How to generate an input for a case. `"sample"` is shorthand for
 * `{sample: true}` — drive generation from each rule's `sample` field, which is
 * deterministic wherever samples are defined. A `seed` makes random generation
 * reproducible; `count` repeats the case with fresh inputs.
 */
export type GenerateSpec = 'sample' | {sample?: boolean; seed?: number; count?: number};

/** Portable, structural representation of a CST node (no in-memory pointers). */
export interface StructuralCst {
  type: string;
  pos: number;
  end: number;
  children?: StructuralCst[];
}

/** Channels that can be captured as snapshots (filled by `--update`). */
export type SnapshotChannel = 'ast' | 'cst' | 'cstPrint' | 'trace' | 'end';

/** All channel names, including the non-snapshot assertions. */
export type ChannelName = SnapshotChannel | 'parses' | 'consumes';
