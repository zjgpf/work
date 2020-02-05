/**
Created by Pengfei Gao on 2019-12-04
*/

const {
        SYMBOLS_ALL,
        KEYWORDS_ALL,
        KEYWORD_CONSTANT,
        SYMBOLS,
        OPS,
        COMPARE_OPS,
        BOOLEAN_OPS,
        UNARYBOOLEAN_OP,
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
        TYPE_RESERVED_VARIABLE,
} = require("./lexical")

const INTEGER_PATTERN = /^[0-9]+$/
const SINGLE_INTEGER_PATTERN = /^[0-9]$/

class Tokenizer {
    
    static tokenize(expStr){
        if (!expStr) return []
        if (typeof expStr != typeof '') throw `Unexpect expStr when do the tokenize: ${expStr}`
        //console.info(expStr)
        const tokens = []
        let [p_start, p_cur, length] = [0,0,expStr.length]
        while (p_cur < length){
            const c = expStr[p_cur]
            if (c == ' ') {
                p_cur += 1
            }
            else if (c == '"'){
                if (p_cur >= length-1) throw `Unexpect expStr when do the tokenize: ${expStr}`
                p_cur += 1
                p_start = p_cur
                while (expStr[p_cur] != '"') {
                    p_cur+=1
                    if (p_cur >= length) throw `Unexpect expStr when do the tokenize: ${expStr}`
                }
                const token = expStr.slice(p_start,p_cur)
                tokens.push([token, TYPE_STR_CONSTANT])
                p_cur+=1
                //console.info(tokens)
                //debugger
            }
            else if (c in SYMBOLS_ALL){
                let token = c
                if (token == '%'){
                    debugger
                    p_cur+=1
                    p_start = p_cur
                    while (p_cur < length && expStr[p_cur] != ' ' && !(expStr[p_cur] in SYMBOLS_ALL)){
                        p_cur += 1
                    }
                    const token = expStr.slice(p_start, p_cur)
                    p_cur -= 1
                    tokens.push([token, TYPE_RESERVED_VARIABLE])
                    //console.info(token)
                    //debugger
                }
                else if (token == '$'){
                    p_start = p_cur
                    p_cur+=1
                    if (expStr[p_cur] == '$'){
                        p_cur+=1 
                    }
                    else{
                        token = expStr.slice(p_start,p_cur)
                        if (!SINGLE_INTEGER_PATTERN.test(expStr[p_cur])) `Unexpect expStr when do the tokenize: ${expStr}`
                        while (SINGLE_INTEGER_PATTERN.test(expStr[p_cur])) p_cur+=1
                    }
                    if (expStr[p_cur] != '.') throw `Unexpect expStr when do the tokenize: ${expStr}`
                    p_cur+=1
                    if (expStr[p_cur] in SYMBOLS_ALL || expStr[p_cur] == ' ') throw `Unexpect expStr when do the tokenize: ${expStr}`
                    token = expStr.slice(p_start,p_cur)
                    while (!(p_cur == length || expStr[p_cur] in SYMBOLS_ALL || expStr[p_cur] == ' ')) p_cur+=1
                    token = expStr.slice(p_start,p_cur)
                    tokens.push([token,TYPE_REFERENCE])
                    p_cur-=1
                    //console.info(tokens)
                    //debugger
                }
                else if (token in OPS){
                    tokens.push([token,TYPE_OPS])
                    //console.info(tokens)
                    //debugger
                }
                else if (token in COMPARE_OPS || token == '!'){
                    if (p_cur >= length -1) throw `Unexpect expStr when do the tokenize: ${expStr}`
                    if (expStr[p_cur+1] == '='){
                        p_cur += 1       
                        token = token + expStr[p_cur]
                    }
                    else{
                        if (token == '!') throw `Unexpect expStr when do the tokenize: ${expStr}`
                    }
                    tokens.push([token, TYPE_COMPARE_OPS])
                    //console.info(tokens)
                    //debugger
                }
                else{
                    tokens.push([token, TYPE_SYMBOLS])
                    //console.info(tokens)
                    //debugger
                }
                p_cur+=1
            }
            else{
                p_start = p_cur
                while (p_cur < length && expStr[p_cur] != ' ' && !(expStr[p_cur] in SYMBOLS_ALL)){
                    p_cur += 1
                }
                const token = expStr.slice(p_start, p_cur)
                if (token in KEYWORDS_ALL){
                    if (token in KEYWORD_CONSTANT){
                        tokens.push([token, TYPE_KEYWORD_CONSTANT])
                        //console.info(tokens)
                        //debugger
                    }
                    else if (token in BOOLEAN_OPS){
                        tokens.push([token, TYPE_BOOLEAN_OPS])
                        //console.info(tokens)
                        //debugger
                    }
                    else if (token in COMPARE_OPS){
                        tokens.push([token, TYPE_COMPARE_OPS])
                        //console.info(tokens)
                        //debugger
                    }
                    else if (token in UNARYBOOLEAN_OP){
                        tokens.push([token, TYPE_UNARY_BOOLEAN_OPS])
                        //console.info(tokens)
                        //debugger
                    }
                    else {
                        throw `Unexpected keyword token ${token}`
                    }
                }
                else {
                    //string, float, interger
                    if (INTEGER_PATTERN.test(token)){
                        if (expStr[p_cur] == '.'){
                            const p_next = p_cur+1
                            if(!(SINGLE_INTEGER_PATTERN.test(expStr[p_next]))){
                                tokens.push([token, TYPE_INTEGER_CONSTANT])
                                //console.info(tokens)
                                //debugger
                            }
                            else{
                                p_cur+=1
                                while (SINGLE_INTEGER_PATTERN.test(expStr[p_cur])) p_cur+=1
                                const _token = expStr.slice(p_start, p_cur)
                                tokens.push([_token, TYPE_FLOAT_CONSTANT])
                                //console.info(tokens)
                                //debugger
                            }
                        }
                        else{
                            tokens.push([token, TYPE_INTEGER_CONSTANT])
                            //console.info(tokens)
                            //debugger
                        }
                    }
                    else{
                        tokens.push([token, TYPE_STR_CONSTANT])
                        //console.info(tokens)
                        //debugger
                    }
                }
            }
        }
            
        return tokens
    }
}

module.exports = Tokenizer
