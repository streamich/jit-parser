import {deepEqual} from '@jsonjoy.com/util/lib/json-equal/deepEqual';
import {printCst, printTraceNode} from '../print';
import type {Grammar} from '../types';
import {createCache, drive, toStructuralCst, type DriveResult, type GrammarCache} from './driver';
import type {ChannelName, SnapshotChannel, TestCase, TestSuite} from './types';

/** Per-channel outcome within a case. */
export interface ChannelResult {
  channel: ChannelName;
  /**
   * - `pass`    — asserted value matched.
   * - `fail`    — asserted value did not match.
   * - `missing` — a requested snapshot has no stored value (run with `--update`).
   * - `wrote`   — a snapshot value was (re)generated in update mode.
   */
  status: 'pass' | 'fail' | 'missing' | 'wrote';
  expected?: unknown;
  actual?: unknown;
}

export interface CaseResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  channels: ChannelResult[];
  /** Set when the driver threw (e.g. unknown rule, codegen error). */
  error?: string;
}

export interface SuiteResult {
  describe?: string;
  cases: CaseResult[];
  pass: number;
  fail: number;
  skip: number;
  /** Whether any snapshot was written (update mode). */
  updated: boolean;
}

export interface RunOptions {
  /** Regenerate and write the requested snapshot channels into each case. */
  update?: boolean;
  /** Reuse a compiled-grammar cache across cases (created automatically). */
  cache?: GrammarCache;
}

const SNAPSHOT_CHANNELS: SnapshotChannel[] = ['ast', 'cst', 'cstPrint', 'trace', 'end'];

const snapshotSetOf = (suite: TestSuite, tc: TestCase): Set<SnapshotChannel> =>
  new Set(tc.snapshot ?? suite.snapshot ?? []);

/** Compute the actual value for a channel from the driver's artifacts. */
const actualOf = (channel: SnapshotChannel, d: DriveResult): unknown => {
  switch (channel) {
    case 'ast':
      return d.ast;
    case 'cst':
      return d.cst ? toStructuralCst(d.cst) : null;
    case 'cstPrint':
      return d.cst ? printCst(d.cst, '', d.src).split('\n') : [];
    case 'trace':
      return d.trace ? printTraceNode(d.trace, '', d.src).split('\n') : [];
    case 'end':
      return d.end;
  }
};

/** Run a single case. Pure: no I/O, no test-runner globals. */
export const runCase = (grammar: Grammar, suite: TestSuite, tc: TestCase, opts: RunOptions = {}): CaseResult => {
  const hasOnly = suite.tests.some((t) => t.only);
  if (tc.skip || (hasOnly && !tc.only)) return {name: tc.name, status: 'skip', channels: []};

  const snapshot = snapshotSetOf(suite, tc);
  const needAst = 'ast' in tc || snapshot.has('ast');
  const needTrace = 'trace' in tc || snapshot.has('trace');

  let d: DriveResult;
  try {
    d = drive(grammar, tc, {ast: needAst, trace: needTrace}, opts.cache);
  } catch (err) {
    return {name: tc.name, status: 'fail', channels: [], error: String((err as Error)?.message ?? err)};
  }

  const channels: ChannelResult[] = [];

  // Snapshot-able + structurally-asserted channels.
  const considered = new Set<SnapshotChannel>([...snapshot, ...SNAPSHOT_CHANNELS.filter((c) => c in tc)]);
  for (const channel of considered) {
    const actual = actualOf(channel, d);
    const bag = tc as unknown as Record<string, unknown>;
    if (opts.update && snapshot.has(channel)) {
      bag[channel] = actual;
      channels.push({channel, status: 'wrote', actual});
    } else if (channel in tc) {
      const expected = bag[channel];
      channels.push({channel, status: deepEqual(actual, expected) ? 'pass' : 'fail', expected, actual});
    } else {
      // Requested as a snapshot but not yet stored.
      channels.push({channel, status: 'missing', actual});
    }
  }

  // Boolean assertions (never snapshot, always exact).
  if ('parses' in tc) {
    channels.push({
      channel: 'parses',
      status: d.matched === tc.parses ? 'pass' : 'fail',
      expected: tc.parses,
      actual: d.matched,
    });
  }
  if ('consumes' in tc) {
    const actual = d.matched && d.end === d.src.length;
    channels.push({channel: 'consumes', status: actual ? 'pass' : 'fail', expected: true, actual});
  }

  const failed = channels.some((c) => c.status === 'fail' || c.status === 'missing');
  return {name: tc.name, status: failed ? 'fail' : 'pass', channels};
};

/** Run a whole suite against a resolved grammar. */
export const runSuite = (grammar: Grammar, suite: TestSuite, opts: RunOptions = {}): SuiteResult => {
  const cache = opts.cache ?? createCache();
  const cases = suite.tests.map((tc) => runCase(grammar, suite, tc, {...opts, cache}));
  let pass = 0;
  let fail = 0;
  let skip = 0;
  for (const c of cases) {
    if (c.status === 'pass') pass++;
    else if (c.status === 'fail') fail++;
    else skip++;
  }
  const updated = cases.some((c) => c.channels.some((ch) => ch.status === 'wrote'));
  return {describe: suite.describe ?? suite.grammar, cases, pass, fail, skip, updated};
};
