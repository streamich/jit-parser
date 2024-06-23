import {scrub} from '../util';
import type {CanonicalAstNode, CstNode, Parser} from '../types';

const noop = () => {};

export class Pattern {
  public type: string;
  public parser: Parser = <Parser>noop;
  public toAst: (cst: CstNode) => unknown | CanonicalAstNode = noop;

  constructor(type: string) {
    this.type = scrub(type);
  }
}
