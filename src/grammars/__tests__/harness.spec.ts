import * as path from 'path';
import {jestSuiteFile} from '../../testing/jest';
import {grammar as json} from '../json';
import {grammar as jsonExpression} from '../json-expression';

/**
 * Runs the standardized JSON test corpora as native Jest tests. The `.test.json`
 * files are the source of truth; this shim only wires each grammar to its suite.
 * Regenerate snapshot channels with:
 *
 *   yarn grammar-test src/grammars/__tests__/*.test.json --update
 */
jestSuiteFile(json, path.join(__dirname, 'json.test.json'));
jestSuiteFile(jsonExpression, path.join(__dirname, 'json-expression.test.json'));
