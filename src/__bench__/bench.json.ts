import * as Benchmark from 'benchmark';
import {grammar} from '../grammars/json';
import {CodegenGrammar} from '../codegen/CodegenGrammar';
import {ParseContext} from '../context';
import {json0, json1, json2} from './data/jsons';
import * as antlr from './antlr/json';
import * as prism from 'prismjs';

require('prismjs/components/prism-json');

const parser = CodegenGrammar.compile(grammar);

const toCst = (json: string) => {
  const ctx = new ParseContext(json, false);
  return parser(ctx, 0);
};

const toAst = (json: string) => {
  const ctx = new ParseContext(json, true);
  // return parser(ctx, 0)?.ast;
};

const json = JSON.stringify(json0, null, 4);
const suite = new Benchmark.Suite();

console.log(toCst(json));

const prismGrammar = prism.languages['json'];

suite.add('jit-parser', () => {
  toCst(json);
  // toAst(json);
});

suite.add('ANTLR4', () => {
  antlr.toCst(json);
  // antlr.toAst(json);
});

suite.add('Prism.js', () => {
  prism.tokenize(json, prismGrammar);
});

suite.on('cycle', (event: Benchmark.Event) => {
  console.log(String(event.target));
});
suite.on('complete', () => {
  console.log(`Fastest is ${suite.filter('fastest').map('name')}`);
});

suite.run();
