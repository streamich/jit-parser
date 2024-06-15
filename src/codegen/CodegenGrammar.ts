// import {Codegen} from '@jsonjoy.com/util/lib/codegen'
// import {dynamicFunction} from '@jsonjoy.com/util/lib/codegen/dynamicFunction'
// import {emitStringMatch} from '@jsonjoy.com/util/lib/codegen/util/helpers';
// import {RegExpTerminalMatch, StringTerminalMatch} from '../matches';
// import {scrub} from '../util';
// import type {Grammar, Rule, MatchParser} from '../types';

// export class CodegenGrammar {
//   public static readonly compile = (grammar: Grammar): MatchParser => {
//     const codegen = new CodegenGrammar(grammar);
//     codegen.generate();
//     return codegen.compile();
//   };

//   public readonly codegen: Codegen<MatchParser>;
//   protected readonly rules = new Map<string, MatchParser>();

//   constructor(public readonly grammar: Grammar) {
//     this.codegen = new Codegen({
//       args: ['str', 'pos'],
//     });
//   }

//   protected compileRule(name: string, rule: Rule): MatchParser {
//     const {codegen} = this;
//     const {match} = rule;
//     const codegenProduction = dynamicFunction<MatchParser>(codegen);
//     codegenProduction(`
//       const results = [];
//       ${match.map((m, i) => {
//         const dep = codegen.linkDependency(m);
//         return `
//           const r${i} = ${dep}(str, pos);
//           if (!r${i}) return;
//           pos = r${i}.end;
//           results.push(r${i});
//         `;
//       }).join('\n')}
//       return {kind: '${name}', pos, end: pos, children: results};
//     `);
//     return codegenProduction.compile();
//   }

//   public generate() {
//     const {codegen, grammar} = this;
//     const {start, rules} = grammar;
//     // for (const [name, rule] of Object.entries(rules)) {
//     //   const dep = codegen.linkDependency(this.compileRule(name, rule));
//     //   this.rules.set(name, dep);
//     // }
//     // const start = this.rules.get(grammar.start);
//     // if (!start) throw new Error('INVALID_START_SYMBOL');
//     // codegen.return(`${start}(str, pos)`);
//   }

//   public compile(): MatchParser {
//     return this.codegen.compile();
//   }
// }
