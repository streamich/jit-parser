import {Pattern} from './codegen/Pattern';
import type {CstNode, ResolvedGrammarNode} from './types';

export class LeafCstMatch implements CstNode {
  constructor(
    public readonly pos: number,
    public readonly end: number,
    public readonly ptr: Pattern,
  ) {}
}

export class CstMatch implements CstNode {
  constructor(
    public readonly pos: number,
    public readonly end: number,
    public readonly ptr: Pattern,
    public readonly children: CstNode[],
  ) {}
}
