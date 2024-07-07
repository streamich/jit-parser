import type {Grammar, GrammarNode, UnionNode} from '../types';

const EPSILON = {t: '', ast: null};
const W = {r: 'W'};
const OptW = {r: 'Ws'};

const r = ([name]: TemplateStringsArray) => ({r: name});
const opt = (node: GrammarNode): UnionNode => ({
  u: [node, EPSILON],
  ast: ['?', ['len', ['$', '/children']], AstUseFirstChild, null],
});

const AstUseChildren = ['$', '/children'];
const AstUseFirstChild = ['$', '/children/0'];

/**
 * ES|QL grammar.
 */
export const grammar: Grammar = {
  start: 'Query',

  cst: {
    Query: [{r: 'Ws'}, r`SourceCommand`, r`QueryChain`, /\s|$/],
    QueryChain: {l: r`PipedCommand`},
    PipedCommand: [OptW, '|', OptW, r`Command`],
    Command: {u: [r`SourceCommand`, r`ProcessingCommand`]},
    W: {t: /\s+/, sample: ' '},
    Ws: {t: /\s*/, sample: ' '},
    SourceCommand: {
      u: [
        r`ExplainCommand`,
        r`FromCommand`,
        r`RowCommand`,
        // r`MetricsCommand`,
        r`ShowCommand`,
        r`MetaCommand`,
      ],
    },
    ProcessingCommand: {
      u: [
        r`EvalCommand`,
        r`InlineStatsCommand`,
        // r`LimitCommand`,
        // r`LookupCommand`,
        // r`KeepCommand`,
        // r`SortCommand`,
        // r`StatsCommand`,
        // r`WhereCommand`,
        // r`DropCommand`,
        // r`RenameCommand`,
        // r`DissectCommand`,
        // r`GrokCommand`,
        // r`EnrichCommand`,
        // r`MvExpandCommand`,
      ],
    },

    // -------------------------------------------------------- Source commands

    // EXPLAIN command
    ExplainCommand: [/EXPLAIN/i, W, r`SubqueryExpression`],

    // FROM command
    FromCommand: [/FROM/i, W, r`IndexIdentifierList`, r`Metadata`],
    IndexIdentifierList: [OptW, r`IndexIdentifier`, {l: r`NextIndexIdentifier`, ast: AstUseChildren}],
    NextIndexIdentifier: [OptW, ',', OptW, r`IndexIdentifier`],
    Metadata: {
      u: [
        [
          OptW,
          {
            u: [r`MetadataOption`, r`DeprecatedMetadata`],
            ast: AstUseFirstChild,
          },
        ],
        EPSILON,
      ],
    },
    MetadataOption: [/METADATA/i, W, r`IndexIdentifierList`],
    DeprecatedMetadata: ['[', OptW, r`MetadataOption`, OptW, ']'],

    // ROW command
    RowCommand: [/ROW/i, W, r`Fields`],
    Fields: [OptW, r`Field`, {l: r`NextField`, ast: AstUseChildren}],
    NextField: [OptW, ',', OptW, r`Field`],
    Field: {
      u: [r`AssignmentExpression`, r`BooleanExpression`],
    },

    // SHOW INFO command
    ShowCommand: /SHOW INFO/i,

    // META FUNCTIONS command
    MetaCommand: /META FUNCTIONS/i,

    // ---------------------------------------------------- Processing commands

    // EVAL command
    EvalCommand: [/EVAL/i, W, r`Fields`],

    // INLINESTATS command
    InlineStatsCommand: [/INLINESTATS/i, W, r`Fields`, opt(r`ByGrouping`)],
    ByGrouping: [W, /BY/i, W, r`Fields`],

    // ------------------------------------------------------------ Expressions

    BooleanExpressionList: {
      p: [
        r`BooleanExpression`,
        {l: r`NextBooleanExpression`, ast: AstUseChildren},
      ],
      ast: ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']],
    },
    NextBooleanExpression: {p: [OptW, ',', OptW, r`BooleanExpression`], ast: AstUseFirstChild},
    BooleanExpression: {
      u: [
        r`LogicalNot`,
        r`ValueExpression`,
        // r`RegexBooleanExpression`,
        // r`LogicalBinary`,
        // r`LogicalIn`,
        // r`IsNull`,
      ],
    },
    LogicalNot: [OptW, 'NOT', W, {r: 'BooleanExpression'}],
    ValueExpression: {
      u: [
        {r: 'OperatorExpression'},
        // {r: 'Comparison'},
      ],
    },
    OperatorExpression: {
      u: [
        {r: 'PrimaryExpression'},
        // {r: 'ArithmeticUnary'},
        // {r: 'ArithmeticBinary'},
      ],
    },
    PrimaryExpression: {
      u: [
        r`Constant`,
        r`FunctionExpression`,
        r`QualifiedName`,
        [OptW, '(', r`BooleanExpression`, ')'],
        // r`InlineCast`,
      ],
    },

    AssignmentExpression: [{r: 'QualifiedName'}, {r: 'Ws'}, '=', {r: 'Ws'}, {r: 'BooleanExpression'}],

    SubqueryExpression: [{r: 'Ws'}, '(', {r: 'Query'}, ')', {r: 'Ws'}],

    // -------------------------------------------------------------- Functions
    // functionExpression
    //     : identifier LP (ASTERISK | (booleanExpression (COMMA booleanExpression)*))? RP
    //     ;
    FunctionExpression: [
      r`Identifier`,
      OptW,
      '(',
      OptW,
      {
        u: [
          {type: 'StarArgument', t: '*'},
          r`BooleanExpressionList`,
        ],
        ast: AstUseFirstChild,
      },
      OptW,
      ')',
    ],

    // --------------------------------------------------------------- Literals

    Constant: {
      u: [
        r`NullLiteral`,
        [r`IntegerLiteral`, OptW, r`UnquotedIdentifier`],
        r`DecimalLiteral`,
        r`IntegerLiteral`,
        r`BooleanLiteral`,
        r`ParamLiteral`,
        r`StringLiteral`,
        r`NumericArrayLiteral`,
        r`BooleanArrayLiteral`,
        r`StringArrayLiteral`,
      ],
    },
    NullLiteral: /NULL/i,
    NumericLiteral: {u: [{r: 'DecimalLiteral'}, {r: 'IntegerLiteral'}]},
    DecimalLiteral: /[\-\+]?\d+\.\d+/,
    IntegerLiteral: /[\-\+]?\d+/,
    BooleanLiteral: /TRUE|FALSE/i,
    StringLiteral: /"(\\[\t\n\r"]|[^\t\n\r"])*"/,
    ParamLiteral: {u: [{r: 'NamedParam'}, {r: 'PositionalParam'}, {r: 'UnnamedParam'}]},
    UnnamedParam: '?',
    NamedParam: /\?[a-zA-Z][a-zA-Z0-9_]*/,
    PositionalParam: /\?\d+/,
    NumericArrayLiteral: [
      '[',
      OptW,
      {r: 'NumericLiteral'},
      {l: [OptW, ',', OptW, {r: 'NumericLiteral'}]},
      OptW,
      ']',
    ],
    BooleanArrayLiteral: [
      '[',
      OptW,
      {r: 'BooleanLiteral'},
      {l: [OptW, ',', OptW, {r: 'BooleanLiteral'}]},
      OptW,
      ']',
    ],
    StringArrayLiteral: [
      '[',
      OptW,
      {r: 'StringLiteral'},
      {l: [OptW, ',', OptW, {r: 'StringLiteral'}]},
      OptW,
      ']',
    ],

    // ------------------------------------------------------------ Identifiers

    IndexIdentifier: {
      t: /(?!\/)(?!.*\/$)(?!.*\/\/)[a-zA-Z_\.][a-zA-Z0-9_\.\/\-\*]*/,
      sample: 'abc',
    },
    QualifiedName: [{r: 'Identifier'}, {l: {r: 'NextIdentifier'}, ast: AstUseChildren}],
    Identifier: {u: [{r: 'UnquotedIdentifier'}, {r: 'QuotedIdentifier'}]},
    NextIdentifier: [OptW, '.', OptW, {r: 'Identifier'}],
    UnquotedIdentifier: /[a-zA-Z][a-zA-Z0-9_]*|[_\@][a-zA-Z0-9_]+/,
    QuotedIdentifier: {
      t: /`([^`]|``)+`/,
      sample: '`abc`',
    },
  },

  ast: {
    W: null,
    Ws: null,
    Query: [
      'o.set',
      ['$', ''],
      'children',
      ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']],
    ],
    QueryChain: AstUseChildren,
    PipedCommand: ['$', '/children/0'],
    Command: AstUseFirstChild,
    SourceCommand: AstUseFirstChild,
    ProcessingCommand: AstUseFirstChild,
    FromCommand: [
      'o.del',
      ['o.set', ['$', ''], 'sources', ['$', '/children/0'], 'metadata', ['$', '/children/1', null]],
      'children',
    ],
    Metadata: ['?', ['len', ['$', '/children']], ['$', '/children/0/children/0', null], null],
    MetadataOption: ['$', '/children/0'],
    DeprecatedMetadata: ['$', '/children/0'],
    IndexIdentifierList: [
      'o.set',
      ['$', ''],
      'children',
      ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']],
    ],
    NextIndexIdentifier: ['$', '/children/0'],
    RowCommand: ['o.del', ['o.set', ['$', ''], 'fields', ['$', '/children/0/children']], 'children'],
    EvalCommand: ['o.del', ['o.set', ['$', ''], 'fields', ['$', '/children/0/children']], 'children'],
    InlineStatsCommand: [
      'o.del',
      [
        'o.set',
        ['$', ''],
        'aggregates',
        ['$', '/children/0/children'],
        'grouping',
        ['$', '/children/1/children/0/children', null],
      ],
      'children',
    ],
    Fields: [
      'o.set',
      ['$', ''],
      'children',
      ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']],
    ],
    NextField: AstUseFirstChild,
    Field: ['o.del', ['o.set', ['$', ''], 'value', ['$', '/children/0']], 'children'],
    BooleanExpression: AstUseFirstChild,
    ValueExpression: AstUseFirstChild,
    OperatorExpression: AstUseFirstChild,
    PrimaryExpression: AstUseFirstChild,
    AssignmentExpression: [
      'o.del',
      ['o.set', ['$', ''], 'left', ['$', '/children/0'], 'right', ['$', '/children/1']],
      'children',
    ],
    FunctionExpression: ['o.del', ['o.set', ['$', ''], 'name', ['$', '/children/0'], 'arguments', ['$', '/children/1']], 'children'],
    Constant: ['o.del', ['o.set', ['$', ''], 'value', ['$', '/children/0']], 'children'],
    QualifiedName: [
      'o.set',
      ['$', ''],
      'children',
      ['concat', ['push', [[]], ['$', '/children/0']], ['$', '/children/1']],
      'value',
      [
        'substr',
        ['reduce', ['$', '/children'], '', 'acc', 'x', ['.', ['$', 'acc'], '.', ['$', 'x/value']]],
        1,
        4096,
      ],
    ],
    Identifier: ['o.del', ['o.set', ['$', ''], 'value', ['$', '/children/0/value']], 'children'],
    NextIdentifier: ['$', '/children/0'],
    UnquotedIdentifier: ['o.set', ['$', ''], 'value', ['$', '/raw']],
    QuotedIdentifier: [
      'o.set',
      ['$', ''],
      'value',
      ['substr', ['$', '/raw'], 1, ['-', ['len', ['$', '/raw']], 1]],
    ],
  },
};

// parser grammar esql_parser;

// options {tokenVocab=esql_lexer;}

// singleStatement
//     : query EOF
//     ;

// query
//     : sourceCommand                 #singleCommandQuery
//     | query PIPE processingCommand  #compositeQuery
//     ;

// sourceCommand
//     : explainCommand
//     | fromCommand
//     | rowCommand
//     | metricsCommand
//     | showCommand
//     | metaCommand
//     ;

// processingCommand
//     : evalCommand
//     | inlinestatsCommand
//     | limitCommand
//     | lookupCommand
//     | keepCommand
//     | sortCommand
//     | statsCommand
//     | whereCommand
//     | dropCommand
//     | renameCommand
//     | dissectCommand
//     | grokCommand
//     | enrichCommand
//     | mvExpandCommand
//     ;

// whereCommand
//     : WHERE booleanExpression
//     ;

// booleanExpression
//     : NOT booleanExpression                                                      #logicalNot
//     | valueExpression                                                            #booleanDefault
//     | regexBooleanExpression                                                     #regexExpression
//     | left=booleanExpression operator=AND right=booleanExpression                #logicalBinary
//     | left=booleanExpression operator=OR right=booleanExpression                 #logicalBinary
//     | valueExpression (NOT)? IN LP valueExpression (COMMA valueExpression)* RP   #logicalIn
//     | valueExpression IS NOT? NULL                                               #isNull
//     ;

// regexBooleanExpression
//     : valueExpression (NOT)? kind=LIKE pattern=string
//     | valueExpression (NOT)? kind=RLIKE pattern=string
//     ;

// valueExpression
//     : operatorExpression                                                                      #valueExpressionDefault
//     | left=operatorExpression comparisonOperator right=operatorExpression                     #comparison
//     ;

// operatorExpression
//     : primaryExpression                                                                       #operatorExpressionDefault
//     | operator=(MINUS | PLUS) operatorExpression                                              #arithmeticUnary
//     | left=operatorExpression operator=(ASTERISK | SLASH | PERCENT) right=operatorExpression  #arithmeticBinary
//     | left=operatorExpression operator=(PLUS | MINUS) right=operatorExpression                #arithmeticBinary
//     ;

// primaryExpression
//     : constant                                                                          #constantDefault
//     | qualifiedName                                                                     #dereference
//     | functionExpression                                                                #function
//     | LP booleanExpression RP                                                           #parenthesizedExpression
//     | primaryExpression CAST_OP dataType                                                #inlineCast
//     ;

// functionExpression
//     : identifier LP (ASTERISK | (booleanExpression (COMMA booleanExpression)*))? RP
//     ;

// dataType
//     : identifier                                                                        #toDataType
//     ;

// rowCommand
//     : ROW fields
//     ;

// fields
//     : field (COMMA field)*
//     ;

// field
//     : booleanExpression
//     | qualifiedName ASSIGN booleanExpression
//     ;

// fromCommand
//     : FROM indexIdentifier (COMMA indexIdentifier)* metadata?
//     ;

// indexIdentifier
//     : INDEX_UNQUOTED_IDENTIFIER
//     ;

// metadata
//     : metadataOption
//     | deprecated_metadata
//     ;

// metadataOption
//     : METADATA indexIdentifier (COMMA indexIdentifier)*
//     ;

// deprecated_metadata
//     : OPENING_BRACKET metadataOption CLOSING_BRACKET
//     ;

// metricsCommand
//     : METRICS indexIdentifier (COMMA indexIdentifier)* aggregates=fields? (BY grouping=fields)?
//     ;

// evalCommand
//     : EVAL fields
//     ;

// statsCommand
//     : STATS stats=fields? (BY grouping=fields)?
//     ;

// inlinestatsCommand
//     : INLINESTATS stats=fields (BY grouping=fields)?
//     ;

// qualifiedName
//     : identifier (DOT identifier)*
//     ;

// qualifiedNamePattern
//     : identifierPattern (DOT identifierPattern)*
//     ;

// qualifiedNamePatterns
//     : qualifiedNamePattern (COMMA qualifiedNamePattern)*
//     ;

// identifier
//     : UNQUOTED_IDENTIFIER
//     | QUOTED_IDENTIFIER
//     ;

// identifierPattern
//     : ID_PATTERN
//     ;

// constant
//     : NULL                                                                              #nullLiteral
//     | integerValue UNQUOTED_IDENTIFIER                                                  #qualifiedIntegerLiteral
//     | decimalValue                                                                      #decimalLiteral
//     | integerValue                                                                      #integerLiteral
//     | booleanValue                                                                      #booleanLiteral
//     | params                                                                            #inputParams
//     | string                                                                            #stringLiteral
//     | OPENING_BRACKET numericValue (COMMA numericValue)* CLOSING_BRACKET                #numericArrayLiteral
//     | OPENING_BRACKET booleanValue (COMMA booleanValue)* CLOSING_BRACKET                #booleanArrayLiteral
//     | OPENING_BRACKET string (COMMA string)* CLOSING_BRACKET                            #stringArrayLiteral
//     ;

// params
//     : PARAM                        #inputParam
//     | NAMED_OR_POSITIONAL_PARAM    #inputNamedOrPositionalParam
//     ;

// limitCommand
//     : LIMIT INTEGER_LITERAL
//     ;

// sortCommand
//     : SORT orderExpression (COMMA orderExpression)*
//     ;

// orderExpression
//     : booleanExpression ordering=(ASC | DESC)? (NULLS nullOrdering=(FIRST | LAST))?
//     ;

// keepCommand
//     :  KEEP qualifiedNamePatterns
//     ;

// dropCommand
//     : DROP qualifiedNamePatterns
//     ;

// renameCommand
//     : RENAME renameClause (COMMA renameClause)*
//     ;

// renameClause:
//     oldName=qualifiedNamePattern AS newName=qualifiedNamePattern
//     ;

// dissectCommand
//     : DISSECT primaryExpression string commandOptions?
//     ;

// grokCommand
//     : GROK primaryExpression string
//     ;

// mvExpandCommand
//     : MV_EXPAND qualifiedName
//     ;

// commandOptions
//     : commandOption (COMMA commandOption)*
//     ;

// commandOption
//     : identifier ASSIGN constant
//     ;

// booleanValue
//     : TRUE | FALSE
//     ;

// numericValue
//     : decimalValue
//     | integerValue
//     ;

// decimalValue
//     : (PLUS | MINUS)? DECIMAL_LITERAL
//     ;

// integerValue
//     : (PLUS | MINUS)? INTEGER_LITERAL
//     ;

// string
//     : QUOTED_STRING
//     ;

// comparisonOperator
//     : EQ | NEQ | LT | LTE | GT | GTE
//     ;

// explainCommand
//     : EXPLAIN subqueryExpression
//     ;

// subqueryExpression
//     : OPENING_BRACKET query CLOSING_BRACKET
//     ;

// showCommand
//     : SHOW INFO                                                           #showInfo
//     ;

// metaCommand
//     : META FUNCTIONS                                                      #metaFunctions
//     ;

// enrichCommand
//     : ENRICH policyName=ENRICH_POLICY_NAME (ON matchField=qualifiedNamePattern)? (WITH enrichWithClause (COMMA enrichWithClause)*)?
//     ;

// enrichWithClause
//     : (newName=qualifiedNamePattern ASSIGN)? enrichField=qualifiedNamePattern
//     ;

// lookupCommand
//     : LOOKUP tableName=INDEX_UNQUOTED_IDENTIFIER ON matchFields=qualifiedNamePatterns
//     ;
