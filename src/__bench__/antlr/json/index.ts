import antlr4 from 'antlr4';
import MyGrammarLexer from './generated/JSONLexer.js';
import MyGrammarParser from './generated/JSONParser.js';
import {AstBuilderListener} from './AstBuilderListener';

export const toCst = (json: string) => {
  const chars = new antlr4.InputStream(input);
  const lexer = new MyGrammarLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new MyGrammarParser(tokens);
  const tree = parser.json();
  return tree;
};

export const toAst = (json: string) => {
  const tree = toCst(json);
  const astBuilder = new AstBuilderListener();
  (antlr4 as any).tree.ParseTreeWalker.DEFAULT.walk(astBuilder, tree);
  const ast = astBuilder.lastPoppedValue;
  return ast;
};

const input = '[{"a": "b", "c": [false]}, "foo", "bar", 1, null, true, false]';
// const input = '{"a": "b"}';
const ast = toAst(input);
console.log(JSON.stringify(ast, null, 2));
