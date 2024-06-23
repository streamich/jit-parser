import type {CsrNode, ResolvedGrammarNode} from './types';

export class LeafCsrMatch implements CsrNode {
  public readonly ast: unknown = undefined;

  constructor(
    public readonly pos: number,
    public readonly end: number,
    public readonly src: ResolvedGrammarNode,
  ) {}
}

export class CsrMatch implements CsrNode {
  public readonly ast: unknown = undefined;

  constructor(
    public readonly pos: number,
    public readonly end: number,
    public readonly src: ResolvedGrammarNode,
    public readonly children: CsrNode[],
  ) {}
}
