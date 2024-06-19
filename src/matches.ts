import type {CsrNode} from './types';

export class LeafCsrMatch<Kind extends string = string> implements CsrNode {
  public readonly ast: unknown = undefined;

  constructor (
    public readonly type: Kind,
    public readonly pos: number,
    public readonly end: number,
    public readonly raw: string,
  ) {}
}

export class CsrMatch<Kind extends string = string> implements CsrNode {
  public readonly ast: unknown = undefined;

  constructor (
    public readonly type: Kind,
    public readonly pos: number,
    public readonly end: number,
    public readonly children: CsrNode[],
  ) {}
}
