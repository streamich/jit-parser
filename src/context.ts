import type {ParseTraceNode, RootTraceNode} from './types';

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

    /**
     * Stack of debugging trace nodes. When defined, and when codegen has was
     * run with `debug` flag, the parser will use this stack to capture a trace
     * of the parsing process.
     */
    public readonly trace: undefined | (RootTraceNode | ParseTraceNode)[] = undefined,
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

    /**
     * Whether to generate generate code which can capture a debugging trace.
     */
    public readonly debug: boolean = false,
  ) {}
}
