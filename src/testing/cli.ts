/* tslint:disable:no-console — this is a CLI; console is its output channel. */
import * as fs from 'fs';
import * as path from 'path';
import type {Grammar} from '../types';
import {formatSuite} from './report';
import {runSuite} from './runner';
import type {TestSuite} from './types';

/**
 * Standalone, Jest-free runner for grammar test suites.
 *
 *   grammar-test <suite.json...> [--update] [--no-color]
 *
 * Each suite's `grammar` field is resolved relative to the suite file: a
 * `.json` path is read as a grammar object, any other path is `require`d and its
 * `grammar` (or default) export is used. With `--update`, requested snapshot
 * channels are (re)generated and written back into the suite file inline.
 */

const HELP = `grammar-test — run JSON Grammar test suites

Usage:
  grammar-test <suite.json...> [options]

Options:
  -u, --update     Regenerate and write snapshot channels back into the suites
      --no-color   Disable ANSI colors
  -h, --help       Show this help

The grammar under test is taken from each suite's "grammar" field, resolved
relative to the suite file (.json grammar object, or a module exporting
\`grammar\`).`;

const resolveGrammar = (suitePath: string, suite: TestSuite): Grammar => {
  const ref = suite.grammar;
  if (!ref) throw new Error(`suite "${suitePath}" has no "grammar" reference`);
  const abs = path.resolve(path.dirname(suitePath), ref);
  if (abs.endsWith('.json')) return JSON.parse(fs.readFileSync(abs, 'utf8')) as Grammar;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(abs);
  return (mod.grammar ?? mod.default ?? mod) as Grammar;
};

export const main = (argv: string[]): number => {
  const files: string[] = [];
  let update = false;
  let useColor = true;
  for (const arg of argv) {
    switch (arg) {
      case '-u':
      case '--update':
        update = true;
        break;
      case '--no-color':
        useColor = false;
        break;
      case '-h':
      case '--help':
        console.log(HELP);
        return 0;
      default:
        files.push(arg);
    }
  }

  if (!files.length) {
    console.error(HELP);
    return 1;
  }

  let totalFail = 0;
  for (const file of files) {
    const suitePath = path.resolve(file);
    const suite = JSON.parse(fs.readFileSync(suitePath, 'utf8')) as TestSuite;
    let grammar: Grammar;
    try {
      grammar = resolveGrammar(suitePath, suite);
    } catch (err) {
      console.error(`✗ ${file}: ${(err as Error).message}`);
      totalFail++;
      continue;
    }

    const result = runSuite(grammar, suite, {update});
    console.log(formatSuite(result, useColor));
    console.log('');

    if (update && result.updated) {
      fs.writeFileSync(suitePath, JSON.stringify(suite, null, 2) + '\n');
    }
    totalFail += result.fail;
  }

  return totalFail ? 1 : 0;
};

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
