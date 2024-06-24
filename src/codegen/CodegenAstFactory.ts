import {Codegen} from '@jsonjoy.com/util/lib/codegen';
import {CodegenContext} from '../context';
import {defaultAstFactory, Pattern} from './Pattern';
import {Expr, JsonExpressionCodegen, Vars} from 'json-joy/lib/json-expression';
import {operatorsMap} from 'json-joy/lib/json-expression/operators';
import {isListNode, isProductionNode, isTerminalNode, isUnionNode} from '../util';
import type {AstNodeFactory, ResolvedGrammarNode} from '../types';

const noAstFactory: AstNodeFactory = () => null;

const isSelectFirstChildExpression = (expr: unknown) => {
  return (
    expr instanceof Array &&
    expr.length === 2 &&
    expr[0] === '$' &&
    expr[1] === '/children/0'
  );
};

const isSelectChildrenExpression = (expr: unknown) => {
  return (
    expr instanceof Array &&
    expr.length === 2 &&
    expr[0] === '$' &&
    expr[1] === '/children'
  );
};

const compileExpression = (expression: Expr) => {
  const exprCodegen = new JsonExpressionCodegen({
    expression,
    operators: operatorsMap,
  });
  return exprCodegen.run().compile();
};

export class CodegenAstFactory {
  public static readonly compile = (
    node: ResolvedGrammarNode,
    ptr: Pattern,
    ctx: CodegenContext = new CodegenContext(),
  ): AstNodeFactory => {
    if (!ctx.astExpressions) return defaultAstFactory;
    if (node.ast === undefined) return defaultAstFactory;
    if (node.ast === null) return noAstFactory;
    const codegen = new CodegenAstFactory(node, ptr, ctx);
    codegen.generate();
    return codegen.compile();
  };

  public readonly codegen: Codegen<AstNodeFactory>;

  constructor(
    protected readonly node: ResolvedGrammarNode,
    protected readonly ptr: Pattern,
    protected readonly ctx: CodegenContext,
  ) {
    this.codegen = new Codegen({
      args: ['cst', 'src'],
    });
  }

  public generate() {
    const {codegen, node, ptr, ctx} = this;
    if (isSelectFirstChildExpression(node.ast)) {
      /**
       * Select first non-null child and non-undefined child ['$', '/children/0'].
       */
      const rIndex = codegen.var(`0`);
      codegen.while('1', () => {
        const rChild = codegen.var(`cst.children[${rIndex}]`);
        const rChildAst = codegen.var(`${rChild}.ptr.toAst(${rChild}, src)`);
        codegen.if(`${rChildAst} != null`, () => {
          codegen.return(rChildAst);
        });
        codegen.js(`${rIndex}++;`);
      });
      return;
    }
    const createChildrenArr = () => {
      const rIndex = codegen.var(`0`);
      const rChildren = codegen.var(`cst.children`);
      const rChildrenAst = codegen.var(`[]`);
      const rLength = codegen.var(`${rChildren}.length`);
      codegen.while(`${rIndex} < ${rLength}`, () => {
        const rChild = codegen.var(`${rChildren}[${rIndex}]`);
        const rChildAst = codegen.var(`${rChild}.ptr.toAst(${rChild}, src)`);
        codegen.if(`${rChildAst} != null`, () => {
          codegen.js(`${rChildrenAst}.push(${rChildAst});`);
        });
        codegen.js(`${rIndex}++;`);
      });
      return rChildrenAst;
    };
    if (isSelectChildrenExpression(node.ast)) {
      /**
       * Replace AST node by its children ['$', '/children'].
       */
      codegen.return(createChildrenArr());
      return;
    }
    const expr = compileExpression(node.ast as any);
    const dExpr = codegen.linkDependency(expr);
    const dVars = codegen.linkDependency(Vars);
    let childFragment = '';
    if (isTerminalNode(node)) {
      childFragment = `, raw: src.slice(cst.pos, cst.end)`;
    } else if (isUnionNode(node)) {
      const rChild = codegen.var(`cst.children[0]`);
      childFragment = `, children: [${rChild}.ptr.toAst(${rChild}, src)]`;
    } else if (isProductionNode(node) || isListNode(node)) {
      childFragment = `, children: ${createChildrenArr()}`;
    }
    const positionFragment = ctx.positions ? `, pos: cst.pos, end: cst.end` : '';
    const rDefaultAst = codegen.var(`{type: ${JSON.stringify(ptr.type)}${positionFragment}${childFragment}}`);
    const rData = codegen.var(`{vars: new ${dVars}(${rDefaultAst})}`);
    codegen.return(`${dExpr}(${rData})`);
  }

  public compile(): AstNodeFactory {
    const fn = this.codegen.compile();
    // console.log(fn + '');
    return fn;
  }
}
