import {scrub} from './util';
import {LeafCstMatch, CstMatch} from './matches';
import {Pattern, defaultAstFactory} from './codegen/Pattern';
import {Vars} from '@jsonjoy.com/json-expression';

/**
 * Shared library of functions that are used by generated parsers.
 * This can be linked during JIT compilation or dumped to text for full JavaScript code generation.
 */
export const sharedLibrary = () => {
  // Define helper functions that don't rely on external imports
  const sharedScrub = (str: string): string => {
    return str.replace(/[^a-zA-Z0-9_$]/g, '_');
  };

  // Define classes inline to avoid import issues
  class SharedPattern {
    public type: string;
    public parser: any = () => {};
    public toAst: any = () => {};

    constructor(type: string) {
      this.type = sharedScrub(type);
    }
  }

  class SharedLeafCstMatch {
    constructor(
      public readonly pos: number,
      public readonly end: number,
      public readonly ptr: any,
    ) {}
  }

  class SharedCstMatch {
    constructor(
      public readonly pos: number,
      public readonly end: number,
      public readonly ptr: any,
      public readonly children: any[],
    ) {}
  }

  const sharedDefaultAstFactory = (cst: any, src: string) => {
    const ast: any = {
      type: cst.ptr.type,
      pos: cst.pos,
      end: cst.end,
    };
    if (cst instanceof SharedLeafCstMatch) {
      ast.raw = src.slice(cst.pos, cst.end);
    } else {
      const children = cst.children;
      if (children) {
        const length = children.length;
        const astChildren: any[] = [];
        for (let i = 0; i < length; i++) {
          const child = children[i];
          const childAst = child.ptr.toAst(child, src);
          if (childAst != null) astChildren.push(childAst);
        }
        ast.children = astChildren;
      }
    }
    return ast;
  };

  // Simple Vars implementation for JSON expressions
  class SharedVars {
    constructor(public data: any) {}
  }

  return {
    scrub: sharedScrub,
    Pattern: SharedPattern,
    CstMatch: SharedCstMatch,
    LeafCstMatch: SharedLeafCstMatch,
    defaultAstFactory: sharedDefaultAstFactory,
    Vars: SharedVars,
  };
};

// For JIT compiler linkage:
export const library = {
  scrub,
  Pattern,
  CstMatch,
  LeafCstMatch,
  defaultAstFactory,
  Vars,
};

// For full code dump:
export const sharedLibraryText = sharedLibrary.toString();