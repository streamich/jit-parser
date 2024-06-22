import type {Grammar} from '../types';

/**
 * ES|QL grammar.
 */
export const grammar: Grammar = {
  start: 'Query',

  cst: {
    Query: [{r: 'Ws'}, {r: 'SourceCommand'}, {r: 'QueryChain'}, {t: /\s+|$/, ast: null}],
    QueryChain: {l: {r: 'PipedCommand'}},
    PipedCommand: [{r: 'Ws'}, '|', {r: 'Ws'}, {r: 'Command'}],
    Command: {u: [{r: 'SourceCommand'}, {r: 'ProcessingCommand'}]},
    W: /\s+/,
    Ws: /\s*/,
    SourceCommand: {
      u: [
        {r: 'ExplainCommand'},
        {r: 'FromCommand'},
        {r: 'RowCommand'},
        // {r: 'MetricsCommand'},
        {r: 'ShowCommand'},
        {r: 'MetaCommand'},
      ],
    },
    ProcessingCommand: {
      u: [
        {r: 'EvalCommand'},
        // {r: 'InlineStatsCommand'},
        // {r: 'LimitCommand'},
        // {r: 'LookupCommand'},
        // {r: 'KeepCommand'},
        // {r: 'SortCommand'},
        // {r: 'StatsCommand'},
        // {r: 'WhereCommand'},
        // {r: 'DropCommand'},
        // {r: 'RenameCommand'},
        // {r: 'DissectCommand'},
        // {r: 'GrokCommand'},
        // {r: 'EnrichCommand'},
        // {r: 'MvExpandCommand'},
      ],
    },

    // -------------------------------------------------------- Source commands

    // EXPLAIN command
    ExplainCommand: [/EXPLAIN/i, {r: 'W'}, {r: 'SubqueryExpression'}],

    // FROM command
    FromCommand: [/FROM/i, {r: 'W'}, {r: 'IndexIdentifierList'}, {r: 'Metadata'}],
    IndexIdentifierList: [{r: 'Ws'}, {r: 'IndexIdentifier'}, {l: [{r: 'Ws'}, ',', {r: 'Ws'}, {r: 'IndexIdentifier'}]}],
    Metadata: {
      u: [
        [
          {r: 'Ws'},
          {
            u: [{r: 'MetadataOption'}, {r: 'DeprecatedMetadata'}],
          },
        ],
        '',
      ],
    },
    MetadataOption: [/METADATA/i, {r: 'W'}, {r: 'IndexIdentifierList'}],
    DeprecatedMetadata: ['[', {r: 'Ws'}, {r: 'MetadataOption'}, {r: 'Ws'}, ']'],

    // ROW command
    RowCommand: [/ROW/i, ' ', {r: 'Fields'}],
    Fields: [{r: 'Ws'}, {r: 'Field'}, {l: {r: 'NextField'}, ast: ['$', '/ast/children']}],
    NextField: [{r: 'Ws'}, ',', {r: 'Ws'}, {r: 'Field'}],
    Field: {
      u: [{r: 'AssignmentExpression'}, {r: 'BooleanExpression'}],
    },

    // SHOW INFO command
    ShowCommand: /SHOW INFO/i,

    // META FUNCTIONS command
    MetaCommand: /META FUNCTIONS/i,

    // ---------------------------------------------------- Processing commands

    // EVAL command
    EvalCommand: [/EVAL/i, {r: 'W'}, {r: 'Fields'}],

    // ------------------------------------------------------------ Expressions

    BooleanExpression: {
      u: [
        {r: 'LogicalNot'},
        {r: 'ValueExpression'},
        // {r: 'RegexBooleanExpression'},
        // {r: 'LogicalBinary'},
        // {r: 'LogicalIn'},
        // {r: 'IsNull'},
      ],
    },
    LogicalNot: [{r: 'Ws'}, 'NOT', {r: 'W'}, {r: 'BooleanExpression'}],
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
        {r: 'Constant'},
        {r: 'QualifiedName'},
        // {r: 'FunctionExpression'},
        // [{r: 'Ws'}, '(', {r: 'BooleanExpression'}, ')'],
        // {r: 'InlineCast'},
      ],
    },

    AssignmentExpression: [{r: 'QualifiedName'}, {r: 'Ws'}, '=', {r: 'Ws'}, {r: 'BooleanExpression'}],

    SubqueryExpression: [{r: 'Ws'}, '(', {r: 'Query'}, ')', {r: 'Ws'}],

    // --------------------------------------------------------------- Literals

    Constant: {
      u: [
        {r: 'NullLiteral'},
        [{r: 'IntegerLiteral'}, {r: 'Ws'}, {r: 'UnquotedIdentifier'}],
        {r: 'DecimalLiteral'},
        {r: 'IntegerLiteral'},
        {r: 'BooleanLiteral'},
        {r: 'ParamLiteral'},
        {r: 'StringLiteral'},
        {r: 'NumericArrayLiteral'},
        {r: 'BooleanArrayLiteral'},
        {r: 'StringArrayLiteral'},
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
      {r: 'Ws'},
      {r: 'NumericLiteral'},
      {l: [{r: 'Ws'}, ',', {r: 'Ws'}, {r: 'NumericLiteral'}]},
      {r: 'Ws'},
      ']',
    ],
    BooleanArrayLiteral: [
      '[',
      {r: 'Ws'},
      {r: 'BooleanLiteral'},
      {l: [{r: 'Ws'}, ',', {r: 'Ws'}, {r: 'BooleanLiteral'}]},
      {r: 'Ws'},
      ']',
    ],
    StringArrayLiteral: [
      '[',
      {r: 'Ws'},
      {r: 'StringLiteral'},
      {l: [{r: 'Ws'}, ',', {r: 'Ws'}, {r: 'StringLiteral'}]},
      {r: 'Ws'},
      ']',
    ],

    // ------------------------------------------------------------ Identifiers

    IndexIdentifier: /(?!\/)(?!.*\/$)(?!.*\/\/)[a-zA-Z_\.][a-zA-Z0-9_\.\/\-\*]*/,
    QualifiedName: [{r: 'Identifier'}, {l: {r: 'NextIdentifier'}, ast: ['$', '/ast/children']}],
    Identifier: {u: [{r: 'UnquotedIdentifier'}, {r: 'QuotedIdentifier'}]},
    NextIdentifier: [{r: 'Ws'}, '.', {r: 'Ws'}, {r: 'Identifier'}],
    UnquotedIdentifier: /[a-zA-Z][a-zA-Z0-9_]*|[_\@][a-zA-Z0-9_]+/,
    QuotedIdentifier: /`([^`]|``)+`/,
  },

  ast: {
    W: null,
    Ws: null,
    Query: [
      'o.set',
      ['$', '/ast'],
      'children',
      ['concat', ['push', [[]], ['$', '/ast/children/0']], ['$', '/ast/children/1']],
    ],
    QueryChain: ['$', '/ast/children'],
    PipedCommand: ['$', '/ast/children/1'],
    Command: ['$', '/ast/children/0'],
    SourceCommand: ['$', '/ast/children/0'],
    ProcessingCommand: ['$', '/ast/children/0'],
    RowCommand: ['o.del', ['o.set', ['$', '/ast'], 'fields', ['$', '/ast/children/2']], 'children'],
    EvalCommand: ['o.del', ['o.set', ['$', '/ast'], 'fields', ['$', '/ast/children/1']], 'children'],
    Fields: [
      'o.set',
      ['$', '/ast'],
      'children',
      ['concat', ['push', [[]], ['$', '/ast/children/0']], ['$', '/ast/children/1']],
    ],
    NextField: ['$', '/ast/children/1'],
    Field: ['o.del', ['o.set', ['$', '/ast'], 'value', ['$', '/ast/children/0']], 'children'],
    BooleanExpression: ['$', '/ast/children/0'],
    ValueExpression: ['$', '/ast/children/0'],
    OperatorExpression: ['$', '/ast/children/0'],
    PrimaryExpression: ['$', '/ast/children/0'],
    AssignmentExpression: [
      'o.del',
      ['o.set', ['$', '/ast'], 'left', ['$', '/ast/children/0'], 'right', ['$', '/ast/children/2']],
      'children',
    ],
    Constant: ['o.del', ['o.set', ['$', '/ast'], 'value', ['$', '/ast/children/0']], 'children'],
    QualifiedName: [
      'o.set',
      ['$', '/ast'],
      'children',
      ['concat', ['push', [[]], ['$', '/ast/children/0']], ['$', '/ast/children/1']],
      'value',
      [
        'substr',
        ['reduce', ['$', '/ast/children'], '', 'acc', 'x', ['.', ['$', 'acc'], '.', ['$', 'x/value/value']]],
        1,
        4096,
      ],
    ],
    Identifier: ['o.del', ['o.set', ['$', '/ast'], 'value', ['$', '/ast/children/0']], 'children'],
    NextIdentifier: ['$', '/ast/children/1'],
    UnquotedIdentifier: ['o.set', ['$', '/ast'], 'value', ['$', '/ast/raw']],
    QuotedIdentifier: [
      'o.set',
      ['$', '/ast'],
      'value',
      ['substr', ['$', '/ast/raw'], 1, ['-', ['len', ['$', '/ast/raw']], 1]],
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
