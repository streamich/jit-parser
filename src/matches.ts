import type {MatchResult} from './types';

/**
 * Generate these match classes for each grammar.
 */
export class BaseMatch<Kind extends string = string> implements MatchResult {
  constructor (
    public readonly kind: Kind,
    public readonly pos: number,
    public readonly end: number,
  ) {}
}

export class StringTerminalMatch<Kind extends string = string> extends BaseMatch<Kind> {
  constructor (
    kind: Kind,
    pos: number,
    end: number,
    public readonly text: string,
  ) {
    super(kind, pos, end);
  }
}

export class RegExpTerminalMatch<Kind extends string = string> extends BaseMatch<Kind> {
}
