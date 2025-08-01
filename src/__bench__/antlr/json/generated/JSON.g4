/** Taken from "The Definitive ANTLR 4 Reference" by Terence Parr */

// Derived from https://json.org

// $antlr-format alignTrailingComments true, columnLimit 150, minEmptyLines 1, maxEmptyLinesToKeep 1, reflowComments false, useTab false
// $antlr-format allowShortRulesOnASingleLine false, allowShortBlocksOnASingleLine true, alignSemicolons hanging, alignColons hanging

grammar JSON;

json
    : value EOF
    ;

obj
    : '{' pair (',' pair)* '}'
    | '{' '}'
    ;

pair
    : key ':' value
    ;

key
    : STRING
    ;

arr
    : '[' value (',' value)* ']'
    | '[' ']'
    ;

value
    : STRING                # String
    | NUMBER                # Number
    | obj                   # Object
    | arr                   # Array
    | ('true' | 'false')    # Boolean
    | 'null'                # Null
    ;

STRING
    : '"' (ESC | SAFECODEPOINT)* '"'
    ;

fragment ESC
    : '\\' (["\\/bfnrt] | UNICODE)
    ;

fragment UNICODE
    : 'u' HEX HEX HEX HEX
    ;

fragment HEX
    : [0-9a-fA-F]
    ;

fragment SAFECODEPOINT
    : ~ ["\\\u0000-\u001F]
    ;

NUMBER
    : '-'? INT ('.' [0-9]+)? EXP?
    ;

fragment INT
    // integer part forbis leading 0s (e.g. `01`)
    : '0'
    | [1-9] [0-9]*
    ;

// no leading zeros

fragment EXP
    // exponent number permits leading 0s (e.g. `1e01`)
    : [Ee] [+-]? [0-9]+
    ;

WS
    : [ \t\n\r]+ -> skip
    ;
