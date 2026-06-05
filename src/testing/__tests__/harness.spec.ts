import type {Grammar} from '../../types';
import {runCase, runSuite} from '../runner';
import {toStructuralCst, drive} from '../driver';
import type {TestSuite} from '../types';

/** A tiny grammar exercised by the harness's own tests. */
const grammar: Grammar = {
  start: 'Value',
  cst: {
    WOpt: {t: [' ', '\n', '\t', '\r'], repeat: '*', ast: null},
    Value: [{r: 'WOpt'}, {r: 'TValue'}, {r: 'WOpt'}],
    TValue: {u: [{r: 'Number'}, {r: 'Boolean'}]},
    Number: {t: /[0-9]+/, sample: '7'},
    Boolean: {t: ['true', 'false']},
  },
  ast: {
    Value: ['$', '/children/0'],
    TValue: ['$', '/children/0'],
    Number: ['num', ['$', '/raw']],
    Boolean: ['==', ['$', '/raw'], 'true'],
  },
};

const suite = (tests: TestSuite['tests'], extra: Partial<TestSuite> = {}): TestSuite => ({
  grammar: 'inline',
  tests,
  ...extra,
});

describe('ast channel', () => {
  test('passes on an exact match', () => {
    const res = runCase(grammar, suite([]), {name: 'n', src: '7', ast: 7});
    expect(res.status).toBe('pass');
  });

  test('fails on a mismatch and reports expected/actual', () => {
    const res = runCase(grammar, suite([]), {name: 'n', src: '7', ast: 8});
    expect(res.status).toBe('fail');
    const ch = res.channels.find((c) => c.channel === 'ast')!;
    expect(ch.status).toBe('fail');
    expect(ch.expected).toBe(8);
    expect(ch.actual).toBe(7);
  });

  test('literal-null AST is assertable (presence-based)', () => {
    // A grammar whose rule yields a literal null value.
    const g: Grammar = {start: 'N', cst: {N: {t: 'null', ast: [null]}}};
    const res = runCase(g, suite([]), {name: 'null', src: 'null', ast: null});
    expect(res.status).toBe('pass');
  });
});

describe('rule isolation', () => {
  test('runs a single rule by name', () => {
    const res = runCase(grammar, suite([]), {name: 'num', rule: 'Number', src: '42', ast: 42, end: 2});
    expect(res.status).toBe('pass');
  });

  test('reports a driver error (unknown rule) as a failure, not a throw', () => {
    const res = runCase(grammar, suite([]), {name: 'x', rule: 'Nope', src: '1', ast: 1});
    expect(res.status).toBe('fail');
    expect(res.error).toMatch(/Nope/);
  });
});

describe('parse-shape channels', () => {
  test('parses:false expects no match', () => {
    expect(runCase(grammar, suite([]), {name: 'neg', src: '%', parses: false}).status).toBe('pass');
  });

  test('end asserts consumed length on a partial match', () => {
    expect(runCase(grammar, suite([]), {name: 'p', rule: 'Number', src: '12ab', end: 2, parses: true}).status).toBe(
      'pass',
    );
  });

  test('consumes:"all" fails on a partial match', () => {
    expect(runCase(grammar, suite([]), {name: 'c', rule: 'Number', src: '12ab', consumes: 'all'}).status).toBe('fail');
    expect(runCase(grammar, suite([]), {name: 'c', src: '7', consumes: 'all'}).status).toBe('pass');
  });
});

describe('cst channels', () => {
  test('structural CST matches', () => {
    const res = runCase(grammar, suite([]), {
      name: 'cst',
      rule: 'Number',
      src: '7',
      cst: {type: 'Number', pos: 0, end: 1},
    });
    expect(res.status).toBe('pass');
  });

  test('toStructuralCst drops the in-memory pointer', () => {
    const d = drive(grammar, {name: 't', rule: 'Number', src: '7'}, {ast: false, trace: false});
    expect(toStructuralCst(d.cst!)).toEqual({type: 'Number', pos: 0, end: 1});
  });
});

describe('snapshots', () => {
  test('a missing requested snapshot fails (read-only run)', () => {
    const res = runCase(grammar, suite([], {snapshot: ['ast']}), {name: 's', src: '7'});
    expect(res.status).toBe('fail');
    expect(res.channels.find((c) => c.channel === 'ast')!.status).toBe('missing');
  });

  test('--update fills the snapshot inline and the case then passes', () => {
    const s = suite([{name: 's', src: '7'}], {snapshot: ['ast']});
    const updated = runSuite(grammar, s, {update: true});
    expect(updated.cases[0].channels.find((c) => c.channel === 'ast')!.status).toBe('wrote');
    expect((s.tests[0] as {ast?: unknown}).ast).toBe(7);
    // Re-running read-only now passes against the written snapshot.
    expect(runSuite(grammar, s).fail).toBe(0);
  });

  test('cstPrint snapshot is written as an array of lines', () => {
    const s = suite([{name: 'c', rule: 'Number', src: '7'}], {snapshot: ['cstPrint']});
    runSuite(grammar, s, {update: true});
    expect((s.tests[0] as {cstPrint?: string[]}).cstPrint).toEqual(['Number 0:1 → "7"']);
  });
});

describe('suite controls', () => {
  test('skip marks a case skipped', () => {
    expect(runCase(grammar, suite([]), {name: 's', src: '7', skip: true, ast: 999}).status).toBe('skip');
  });

  test('only focuses the suite', () => {
    const res = runSuite(
      grammar,
      suite([
        {name: 'a', src: '7', ast: 7, only: true},
        {name: 'b', src: '7', ast: 999},
      ]),
    );
    expect(res.cases[0].status).toBe('pass');
    expect(res.cases[1].status).toBe('skip');
    expect(res.fail).toBe(0);
  });
});

describe('generated inputs', () => {
  test('a rule sample round-trips through its own parser', () => {
    const res = runCase(grammar, suite([]), {name: 'gen', rule: 'Number', generate: 'sample', consumes: 'all'});
    expect(res.status).toBe('pass');
  });
});
