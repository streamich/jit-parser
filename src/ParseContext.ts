export class ParseContext {
  constructor(
    /**
     * The string to parse.
     */
    public readonly str: string,
    /**
     * Whether to generate an AST. By default, `jit-parse` generates just the
     * CST, when this flag is set to `true`, it generates both the CST and the AST.
     */
    public readonly ast: boolean,
  ) {}
}
