/**
Created by Pengfei Gao on 2019-12-06
*/

const Tokenizer = require('./expTokenizer')
const Engine = require('./expEngine')

class ExpCell {
    
    constructor(expStr,row,col){
        expStr = expStr.replace(/（/g, '(').replace(/）/g, ')').replace(/，/g, ',').replace(/：/g,':');   
        this.expStr = expStr

        this.row = row
        this.col = col
        try {
            this.tokens = Tokenizer.tokenize(expStr)
            this.engine = new Engine(this.tokens)
        }
        catch (e) {
            throw `Compile error on row:${row} col:${col}. ${e}`
        }
        this.refs = this.engine.refs
        this.funcNames = this.engine.funcNames
        this.tableNames = this.engine.tableNames
        this.columnNames = this.engine.columnNames
    }

    substitute(source, target, type = null, category = null){
        if (!source || !target || (type == null && category == null)) throw `Invalid params for function call expCell.substitute, source:${source}, target:${target}, type:${type}, category:${category}`
        this.engine.substitute(source, target, type, category)
    }

    substituteColumn(tableName,origin,target){
        this.engine.substituteColumn(tableName,origin,target)
    }

    getContent(){
        return this.engine.generateContent()
    }
    
}

module.exports = ExpCell
