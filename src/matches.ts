import type {Match} from './types';

export class StringTerminalMatch<Kind extends string = string> implements Match {
  constructor (
    public readonly kind: Kind,
    public readonly pos: number,
    public readonly end: number,
    public readonly text: string,
  ) {}
}
