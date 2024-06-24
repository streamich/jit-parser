import {scrub} from '../util';
import type {CanonicalAstNode, CstNode, Parser} from '../types';

const noop = () => {};

const defaultCreateAst = (cst: CstNode): unknown | CanonicalAstNode => {
  const ast: CanonicalAstNode = {
    type: cst.ptr.type,
    pos: cst.pos,
    end: cst.end,
  };
  const children = cst.children;
  if (children) {
    const length = children.length;
    const astChildren: (CanonicalAstNode | unknown)[] = [];
    for (let i = 0; i < length; i++) {
      const child = children[i];
      const childAst = child.ptr.toAst(child);
      if (childAst != null) astChildren.push(childAst);
    }
    ast.children = astChildren;
  }
  return ast;
};

export class Pattern {
  public type: string;
  public parser: Parser = <Parser>noop;
  public toAst: (cst: CstNode) => unknown | CanonicalAstNode = defaultCreateAst;

  constructor(type: string) {
    this.type = scrub(type);
  }
}
