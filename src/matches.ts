import type {CsrNode} from './types';

/**
 * Generate these match classes for each grammar.
 */
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
    public readonly children: CsrNode[] = [],
  ) {}
}

// export class StringTerminalMatch<Kind extends string = string> extends CsrMatch<Kind> {
//   constructor (
//     kind: Kind,
//     pos: number,
//     end: number,
//     public readonly text: string,
//   ) {
//     super(kind, pos, end);
//   }
// }

// export class RegExpTerminalMatch<Kind extends string = string> extends CsrMatch<Kind> {
// }

// export class ProductionMatch<Kind extends string = string> extends CsrMatch<Kind> implements CsrNode {
//   constructor (
//     kind: Kind,
//     pos: number,
//     end: number,
//     public readonly children: CsrMatch[],
//   ) {
//     super(kind, pos, end);
//   }
// }

// export class RuleMatch<Kind extends string = string> extends CsrMatch<Kind> {
//   constructor (
//     kind: Kind,
//     pos: number,
//     end: number,
//     public readonly children: CsrMatch[],
//   ) {
//     super(kind, pos, end);
//   }
// }
