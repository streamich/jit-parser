import {scrub} from '../util';
import type {AstNodeFactory, CanonicalAstNode, CstNode, Parser} from '../types';
import {LeafCstMatch} from '../matches';

const noop = () => {};

export const defaultAstFactory: AstNodeFactory = (cst: CstNode, src: string) => {
  const ast: CanonicalAstNode = {
    type: cst.ptr.type,
    pos: cst.pos,
    end: cst.end,
  };
  if (cst instanceof LeafCstMatch) {
    ast.raw = src.slice(cst.pos, cst.end);
  } else {
    const children = cst.children;
    if (children) {
      const length = children.length;
      const astChildren: (CanonicalAstNode | unknown)[] = [];
      for (let i = 0; i < length; i++) {
        const child = children[i];
        const childAst = child.ptr.toAst(child, src);
        if (childAst != null) astChildren.push(childAst);
      }
      ast.children = astChildren;
    }
  }
  return ast;
};

export class Pattern {
  public type: string;
  public parser: Parser = <Parser>noop;
  public toAst: AstNodeFactory = defaultAstFactory;

  constructor(type: string) {
    this.type = scrub(type);
  }
}
