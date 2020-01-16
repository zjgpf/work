/**
Created by Pengfei Gao on 2019-12-04
*/

/**
    keywordAll: ‘and’ | ‘or’ | ‘in’ | ‘true’ | ‘false’ | xor | null | not | not_in
    symbolAll: ‘{‘ | ‘}’ | ‘(‘ | ‘)’ | ‘$’ | ‘.’ | ’,’ | ‘+’ | ‘-‘ | ‘*’ | ‘/‘  | ‘<‘ | ‘>’ | ‘=‘ | ‘:’ | ’[‘ | ’]’ | ‘!’

    op: ‘+’ | ‘-‘ | ‘*’ | ‘/‘ | ‘:’ 
   *unaryOp:  ‘-‘ (recognize in engine phase)
    compareOp: ‘<‘ | ‘<=‘ | ‘=‘ | ‘>’ | ‘>=‘ | ‘!=‘ |‘in’|’not_in’
    symbol(residual): { | } | ( | ) | .  | , | [ | ]
    booleanOp:  and | or | xor
    unaryBooleanOp: not
    integerConstant: [0-9]+
    floatConstant: [0-9]+\.[0-9]+
    stringConstant: nonSymbol  nonInterger nonFloat nonkeyword or enclosed with “”
    keywordConstant: true | false | null
    reference: start with $ and $($|[0-9]+\.[^symbol ]+)
*/

const SYMBOLS_ALL = {"{":true, "}":true, "(":true, ")":true, "$":true,".":true, "[":true, "]":true, ",":true,"+":true , "-":true , "*":true, "/":true, "=":true,":":true, "<":true, ">":true, "!":true}
const KEYWORDS_ALL = {"and":true,"or":true,"in":true,"true":true,"false":true,"xor":true,"null":true,"not":true,"not_in":true}

const OPS = {"+":true , "-":true , "*":true, "/":true, ":":true}
const COMPARE_OPS = {"<":true, ">":true, "=":true, "!=":true, ">=":true, "<=":true, "in":true, "not_in":true}
const SYMBOLS = {"{":true, "}":true, "(":true, ")":true, ".":true, "[":true, "]":true, ",":true}
const BOOLEAN_OPS = {"and":true , "or":true , "xor":true}
const UNARY_BOOLEAN_OP = {"not":true}
const KEYWORD_CONSTANT = {"true":true,"false":true,"null":true}

const TYPE_OPS = "t_ops"
const TYPE_COMPARE_OPS = "t_compare_ops"
const TYPE_SYMBOLS = "t_symbols"
const TYPE_BOOLEAN_OPS = "t_boolean_ops"
const TYPE_UNARY_BOOLEAN_OPS = "t_unary_boolean_ops"
const TYPE_KEYWORD_CONSTANT = "t_keyword_constant"
const TYPE_STR_CONSTANT = "t_str_constant"
const TYPE_INTEGER_CONSTANT = "t_integer_constant"
const TYPE_FLOAT_CONSTANT = "t_float_constant"
const TYPE_REFERENCE = "t_reference"
const TYPE_UNARY_OPS = "t_unary_ops"

function swap(obj){
  var ret = {};
  for(var key in obj){
    ret[obj[key]] = key;
  }
  return ret;
}

const TYPE_CONSTANT_ALL = swap({
    TYPE_STR_CONSTANT,
    TYPE_INTEGER_CONSTANT,
    TYPE_FLOAT_CONSTANT,
    TYPE_KEYWORD_CONSTANT
})

const TYPE_OPS_ALL = swap({
    TYPE_OPS,
    TYPE_COMPARE_OPS,
    TYPE_BOOLEAN_OPS,
    TYPE_UNARY_OPS,
    TYPE_UNARY_BOOLEAN_OPS
})

const TYPE_BINARY_OPS_ALL = swap({
    TYPE_OPS,
    TYPE_COMPARE_OPS,
    TYPE_BOOLEAN_OPS
})

const TYPE_UNARY_OPS_ALL = swap({
    TYPE_UNARY_OPS,
    TYPE_UNARY_BOOLEAN_OPS
})

const OP_PRIORITY = {
    '*':2,
    '/':2,
    '+':3,
    '-':3,
    '>':4,
    '<':4,
    '=':4,
    'not':5,
    'and':6,
    'or':7
}

const CATEGORY_ROOT = 'c_root'
const CATEGORY_EXPRESSION = 'c_expression'
const CATEGORY_TERM = 'c_term'
const CATEGORY_FUNCTIONCALL = 'c_functionCall'
const CATEGORY_PARAMLIST = 'c_paramlist'
const CATEGORY_PARAMETER = 'c_parameter'
const CATEGORY_SELECTORCOMBO = 'c_selectorCombo'
const CATEGORY_TABLENAME = 'c_tableName'
const CATEGORY_COLUMNNAME = 'c_columnName'
const CATEGORY_SELECTORS = 'c_selectors'
const CATEGORY_SELECTORSTERM = 'c_selectorsTerm'
const CATEGORY_SELECTOR = 'c_selector'
const CATEGORY_FUNCTIONNAME = 'c_functionName'
const CATEGORY_REFRANGE = 'c_refRange'

module.exports = {
                    OP_PRIORITY,
                    TYPE_OPS_ALL,
                    TYPE_CONSTANT_ALL,
                    TYPE_BINARY_OPS_ALL,
                    TYPE_UNARY_OPS_ALL,  
                    SYMBOLS_ALL,
                    KEYWORDS_ALL,                   
                    KEYWORD_CONSTANT,
                    SYMBOLS,
                    OPS,
                    COMPARE_OPS,
                    BOOLEAN_OPS,
                    UNARY_BOOLEAN_OP,
                    TYPE_OPS,
                    TYPE_COMPARE_OPS,
                    TYPE_SYMBOLS,
                    TYPE_BOOLEAN_OPS,
                    TYPE_UNARY_BOOLEAN_OPS,
                    TYPE_KEYWORD_CONSTANT,
                    TYPE_STR_CONSTANT,
                    TYPE_INTEGER_CONSTANT,
                    TYPE_FLOAT_CONSTANT,
                    TYPE_REFERENCE,
                    TYPE_UNARY_OPS,
                    CATEGORY_ROOT,
                    CATEGORY_EXPRESSION,
                    CATEGORY_TERM,
                    CATEGORY_FUNCTIONCALL,
                    CATEGORY_PARAMLIST,
                    CATEGORY_PARAMETER,
                    CATEGORY_SELECTORCOMBO,
                    CATEGORY_TABLENAME,
                    CATEGORY_COLUMNNAME,
                    CATEGORY_SELECTORS,
                    CATEGORY_SELECTORSTERM,
                    CATEGORY_SELECTOR,
                    CATEGORY_FUNCTIONNAME,
                    CATEGORY_REFRANGE
};
