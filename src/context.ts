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
export class CodegenContext {
  constructor(
    /**
     * Whether to generate positions (`pos` and `end` properties) in the AST nodes.
     */
    public readonly positions: boolean = true,

    /**
     * Whether to run JSON Expression for generating AST nodes.
     */
    public readonly astExpressions: boolean = true,
  ) {}
}
