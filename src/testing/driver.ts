import {CodegenGrammar} from '../codegen/CodegenGrammar';
import {CodegenContext, ParseContext} from '../context';
import {Generator} from '../generator';
import type {CstNode, Grammar, RootTraceNode} from '../types';
import type {StructuralCst, TestCase} from './types';

/**
 * The entire language-specific surface of the test harness. A port to another
 * language only needs to reproduce {@link drive} and {@link toStructuralCst};
 * the runner, reporter and snapshot machinery are grammar-runtime-agnostic.
 */

/** What the driver needs to compute (so it can skip expensive work). */
export interface DriveNeeds {
  /** Build the AST (requires the `ast` flag and a `toAst` pass). */
  ast: boolean;
  /** Capture a debug trace (requires debug codegen and a trace stack). */
  trace: boolean;
}

/** The raw artifacts produced by running one case through the grammar. */
export interface DriveResult {
  /** The actual input used (after resolving `generate`). */
  src: string;
  /** Whether a match was produced. */
  matched: boolean;
  /** Characters consumed (`cst.end`), or `-1` when nothing matched. */
  end: number;
  /** The concrete syntax tree, when matched. */
  cst?: CstNode;
  /** The AST, when matched and {@link DriveNeeds.ast} was set. */
  ast?: unknown;
  /** The captured trace root, when {@link DriveNeeds.trace} was set. */
  trace?: RootTraceNode;
}

/**
 * Caches compiled grammars so a whole suite reuses one {@link CodegenGrammar}
 * per debug flag (rule compilation is itself memoized inside it). Create one per
 * `runSuite` call — it is keyed only by the debug flag, not by grammar identity.
 */
export type GrammarCache = Map<string, CodegenGrammar>;

export const createCache = (): GrammarCache => new Map();

const getCodegen = (grammar: Grammar, debug: boolean, cache?: GrammarCache): CodegenGrammar => {
  const key = debug ? '1' : '0';
  if (cache) {
    const existing = cache.get(key);
    if (existing) return existing;
  }
  const codegen = new CodegenGrammar(grammar, new CodegenContext(true, true, debug));
  if (cache) cache.set(key, codegen);
  return codegen;
};

/** A small, dependency-free deterministic PRNG for seeded generation. */
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Resolve a case's input: an explicit `src`, or a generated string. */
export const resolveInput = (grammar: Grammar, tc: TestCase): string => {
  if (tc.src !== undefined) return tc.src;
  if (tc.generate !== undefined) {
    const spec = tc.generate === 'sample' ? {sample: true} : tc.generate;
    const rnd = spec.seed !== undefined ? mulberry32(spec.seed) : undefined;
    const generator = new Generator({grammar, useSamples: spec.sample !== false, rnd});
    return generator.gen(tc.rule ?? grammar.start);
  }
  return '';
};

/** Run one case through the grammar and return its raw artifacts. */
export const drive = (grammar: Grammar, tc: TestCase, needs: DriveNeeds, cache?: GrammarCache): DriveResult => {
  const codegen = getCodegen(grammar, needs.trace, cache);
  const rule = tc.rule ?? grammar.start;
  const pattern = codegen.compileRule(rule);
  const src = resolveInput(grammar, tc);
  const root: RootTraceNode = {pos: 0, children: []};
  const ctx = new ParseContext(src, needs.ast, needs.trace ? [root] : undefined);
  const cst = pattern.parser(ctx, 0);
  const matched = !!cst;
  const ast = matched && needs.ast ? cst!.ptr.toAst(cst!, src) : undefined;
  return {
    src,
    matched,
    end: matched ? cst!.end : -1,
    cst: cst ?? undefined,
    ast,
    trace: needs.trace ? root : undefined,
  };
};

/** Project an in-memory CST node into its portable, structural form. */
export const toStructuralCst = (cst: CstNode): StructuralCst => {
  const out: StructuralCst = {type: cst.ptr.type, pos: cst.pos, end: cst.end};
  if (cst.children) out.children = cst.children.map(toStructuralCst);
  return out;
};
