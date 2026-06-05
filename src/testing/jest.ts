import * as fs from 'fs';
import type {Grammar} from '../types';
import {formatCase} from './report';
import {runCase} from './runner';
import type {TestSuite} from './types';

/**
 * Thin adapter that registers a {@link TestSuite} as native Jest tests, so the
 * JSON corpus is the source of truth while you keep Jest's reporter, watch mode
 * and CI integration. This runs read-only — snapshots are never written here;
 * a case missing a requested snapshot fails with a hint to run the CLI with
 * `--update`. (`describe`/`test` are the ambient Jest globals.)
 */
export const jestSuite = (grammar: Grammar, suite: TestSuite): void => {
  const label = suite.describe ?? suite.grammar ?? 'grammar';
  const hasOnly = suite.tests.some((t) => t.only);
  describe(label, () => {
    for (const tc of suite.tests) {
      const run = () => {
        const res = runCase(grammar, suite, tc);
        if (res.status === 'fail') throw new Error('\n' + formatCase(res, false));
      };
      if (tc.skip || (hasOnly && !tc.only)) test.skip(tc.name, run);
      else test(tc.name, run);
    }
  });
};

/** Like {@link jestSuite}, but loads the suite JSON from disk first. */
export const jestSuiteFile = (grammar: Grammar, suitePath: string): void => {
  const suite = JSON.parse(fs.readFileSync(suitePath, 'utf8')) as TestSuite;
  jestSuite(grammar, suite);
};
