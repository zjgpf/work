/**
Created by Pengfei Gao on 2019-12-04
*/

const {
        KEYWORDS_ALL,
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
} = require("./lexical")


class TreeNode {

    constructor(parent,content,level,category,type='',note=''){
        this.parent = parent
        this.content = content
        this.note = note
        this.level = level
        this.category = category
        this.type = type
        this.children = []
        this.value = null
    }

    traversalLeafs(arr){
        if (this.children.length == 0) arr.push(this)
        for (const child of this.children) child.traversalLeafs(arr)
    }

    getLeafContent(delimiter = ''){
        const nodeArr = []
        this.traversalLeafs(nodeArr)
        const contentFromNode = nodeArr.map(x => x.content).join(delimiter)
        return contentFromNode
    }

    printBFS(){
        const queue = [this]
        while (queue.length > 0){
            const node = queue.shift()
            console.info("*****************************")
            console.info(`level:${node.level},content:${node.content},category:${node.category},type:${node.type},note:${node.note}`)
            for (const child of node.children) {
                queue.push(child)
            }
        }
    }


    print(){
        console.info("*****************************")
        console.info(`level:${this.level},content:${this.content},category:${this.category},type:${this.type},note:${this.note}`)
        for ( const child of this.children) {
            child.print()   
        }
    }
}

class expEngine {

    constructor(tokens) {
        this.tokens = tokens
        this.tree = new TreeNode(null,'',0,CATEGORY_ROOT)
        this.curIdx = 0
        this.refs = new Set()
        this.tableNames = new Set()
        this.columnNames = {}
        this.funcNames = new Set()
        if (this.tokens.length == 0) return
        this.compileExp(this.tree)
        this.check()
    }

    getSelectorNodesPerColumnName(tableName,mandatoryColumn){
        const ret = []
        const leafNodes = []   
        this.tree.traversalLeafs(leafNodes)
        let i = 0
        while ( i < leafNodes.length){
            let node = leafNodes[i]
            if (node.category != CATEGORY_TABLENAME || node.content != tableName){ 
                i++
                continue
            }
            //.{
            i+=3
            node = leafNodes[i]
            let lookupTable = false
            while (node.category != CATEGORY_COLUMNNAME || node.content != mandatoryColumn){
                i+=1
                node = leafNodes[i]
                if (node.type == TYPE_SYMBOLS && node.content == '}') {
                    lookupTable = true
                }
            }
            if (lookupTable) continue
            ret.push(node.parent)
        }
        return ret
    }

    selectNodeFirstOnly(category, type = '', note = ''){
        const queue = [this.tree]
        while (queue.length > 0){
            const node = queue.shift()
            if (node.note == note && node.type == type && node.category == category){
                return node
            } 
            for (const child of node.children){
                queue.push(child)
            }
        }
        return null
    }

    substitute(origin, target, type, category) {
        this._substitute(this.tree, origin, target, type, category)
    }

    _substitute(node, origin, target, type, category) {
        if (!node) return
        if ( origin == node.content && (type == node.type || category == node.category)) {
            node.content = target
            //todo update refs, tableNames, columnNames (maybe, depending on lazy approach or eager approach)
        }
        for (const child of node.children) this._substitute(child, origin, target, type, category)
    }

    substituteColumn(tableName, originCol, newCol){
        const queue = [this.tree]
        while (queue.length > 0){
            const node = queue.shift()
            if (node.note == tableName && node.content == originCol && node.category == CATEGORY_COLUMNNAME){
                node.content = newCol
            } 
            for (const child of node.children){
                queue.push(child)
            }
        }
    }

    check(){
        const contentFromTree = this.getContentFromTree()
        const contentFromToken = this.tokens.map( a => a[0]).join('')
        if (contentFromToken != contentFromTree) throw `content from tokens and trees are not equal, contentFromToken:${contentFromToken}, contentFromTree:${contentFromTree}`
    }

    getContentFromTree(delimiter=''){
        const nodeArr = []
        this.tree.traversalLeafs(nodeArr)
        const contentFromTree = nodeArr.map(x => x.content).join(delimiter)
        return contentFromTree
    }

    generateContent(){
        const nodeArr = []
        this.tree.traversalLeafs(nodeArr)
        let ret = ''
        for (const node of nodeArr){
            if (node.content in KEYWORDS_ALL) ret = ret + ' ' + node.content + ' '
            else ret += node.content
        }
        return ret
    }

    consume(tree, e_token='', e_type='', category = '', note = '') {
        this.verify(this.curIdx, e_token, e_type)
        const tokens = this.tokens
        const [token,type] = [tokens[this.curIdx][0],tokens[this.curIdx][1]]
        tree.children.push(new TreeNode(tree, token, tree.level+1,category,type,note))
        this.curIdx += 1
    }

    verify(idx, e_token, e_type){
        const tokens = this.tokens
        const [token,type] = [tokens[this.curIdx][0],tokens[this.curIdx][1]]
        if (e_token){
            if (typeof e_token == typeof '' ){
                if (e_token != token) throw `Unexpected token, expected: ${e_token}, actual: ${token}`
            }
            else if (e_token instanceof Array){
                if (e_token.indexOf(token) == -1) throw `Unexpected token, expected: ${e_token}, actual: ${token}`
            }
        }
        if (e_type){
            if (typeof e_type == typeof '' ){
                if (e_type != type) throw `Unexpected type, expected: ${e_type}, actual: ${type}`
            }
            else if (e_type instanceof Array){
                if (e_type.indexOf(type) == -1) throw `Unexpected type, expected: ${e_type}, actual: ${type}`
            }
        }
    }
    

    /**
        term ((op term)*|(booleanOp term)*|(compareOp term)*)
    */
    compileExp(parentTree) {
        const tokens = this.tokens
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_EXPRESSION)
        parentTree.children.push(tree)
        this.compileTerm(tree)
        while (this.curIdx < tokens.length && (tokens[this.curIdx][1] == TYPE_OPS || tokens[this.curIdx][1] == TYPE_COMPARE_OPS || tokens[this.curIdx][1] == TYPE_BOOLEAN_OPS)){
            const op = tokens[this.curIdx][0]
            this.consume(tree, op, [TYPE_OPS, TYPE_COMPARE_OPS, TYPE_BOOLEAN_OPS]) 
            this.compileTerm(tree)
        }
    }
    
    /**
        stringConstant |  keywordConstant | integerConstant | floatConstant | reference | functionCall | selectorCombo | ’(‘ expression ‘)’ | unaryOp term  | unaryBooleanOp term | ‘[‘ paramList ‘]’ 
    */
    compileTerm(parentTree) {
        const tokens = this.tokens
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_TERM)
        parentTree.children.push(tree)
        const [cur_token, cur_type] = tokens[this.curIdx]
        let next_token = null
        if (this.curIdx < tokens.length -1){
            next_token = tokens[this.curIdx+1][0]
        }
        if (cur_token == '(') {
            this.consume(tree,'(',TYPE_SYMBOLS)
            this.compileExp(tree)
            this.consume(tree,')',TYPE_SYMBOLS)
        }
        else if (cur_token == '[') {
            this.consume(tree,'[',TYPE_SYMBOLS)
            this.compileParamList(tree)
            this.consume(tree,']',TYPE_SYMBOLS)
        }
        else if (cur_type == TYPE_REFERENCE) {
            this.refs.add(cur_token)
            this.consume(tree,cur_token,TYPE_REFERENCE)
        }
        else if (cur_token == '-' && cur_type != TYPE_STR_CONSTANT) {
            this.tokens[this.curIdx][1] = TYPE_UNARY_OPS
            this.consume(tree,'-',TYPE_UNARY_OPS)
            this.compileTerm(tree)
        }
        else if (cur_token == 'not' && cur_type != TYPE_STR_CONSTANT) {
            this.consume(tree,'not',TYPE_UNARY_BOOLEAN_OPS)
            this.compileTerm(tree)
        }
        else if (cur_type == TYPE_STR_CONSTANT && next_token == '.') {
            this.compileSelectorCombo(tree)
        }
        else if (cur_type == TYPE_STR_CONSTANT && next_token == '(') {
            this.compileFuncCall(tree)
        }
        else{
            this.consume(tree,cur_token,[TYPE_STR_CONSTANT,TYPE_INTEGER_CONSTANT,TYPE_FLOAT_CONSTANT,TYPE_KEYWORD_CONSTANT])
        }
    }

    compileFuncCall(parentTree) {
        const tokens = this.tokens
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_FUNCTIONCALL)
        parentTree.children.push(tree)
        const [funcName_str, funcName_type] = tokens[this.curIdx]
        this.funcNames.add(funcName_str)
        this.consume(tree, funcName_str, TYPE_STR_CONSTANT, CATEGORY_FUNCTIONNAME)
        this.consume(tree, '(', TYPE_SYMBOLS)
        this.compileParamList(tree)
        this.consume(tree, ')', TYPE_SYMBOLS)
    }

    compileParamList(parentTree) {
        const tokens = this.tokens
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_PARAMLIST)
        parentTree.children.push(tree)
        if (tokens[this.curIdx] == ')') return
        this.compileParamter(tree)
        while ( tokens[this.curIdx][0] == ',' ) {
            this.consume(tree, ',', TYPE_SYMBOLS)
            this.compileParamter(tree)
        }
    }

    compileParamter(parentTree) {
        const tokens = this.tokens
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_PARAMETER)
        parentTree.children.push(tree)
        const [cur_token, cur_type] = tokens[this.curIdx]
        let next_token = null
        if (this.curIdx < tokens.length -1){
            next_token = tokens[this.curIdx+1][0]
        }
        if (cur_type == TYPE_REFERENCE && next_token == ':'){
            this.compileRefRange(parentTree)
        }
        else {
            this.compileExp(tree)
        }
    }

    compileRefRange(parentTree) {
        const tokens = this.tokens
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_PARAMETER)
        parentTree.children.push(tree)
        const startRef = tokens[this.curIdx][0]
        this.consume(tree,tokens[this.curIdx],TYPE_REFERENCE) 
        this.consume(tree,':',TYPE_OPS) 
        const endRef = tokens[this.curIdx][0]
        const refs = getRefRanges(startRef,endRef)
        for (const ref of refs) this.refs.add(ref)
        this.consume(tree,tokens[this.curIdx],TYPE_REFERENCE) 
    }

    compileSelectorCombo(parentTree) {
        const tokens = this.tokens
        const columnNames = this.columnNames
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_SELECTORCOMBO)
        parentTree.children.push(tree)
        const tableName = tokens[this.curIdx][0]
        this.tableNames.add(tableName)
        this.consume(tree, tableName, TYPE_STR_CONSTANT, CATEGORY_TABLENAME)
        this.consume(tree, '.', TYPE_SYMBOLS)
        this.consume(tree, '{', TYPE_SYMBOLS)
        if (tokens[this.curIdx][0] != '}'){
            this.compileSelectors(tree,tableName)
        }
        this.consume(tree,'}', TYPE_SYMBOLS)
        while (tokens[this.curIdx+1][0] == '{' ) {
            this.consume(tree,'.',TYPE_SYMBOLS)
            this.consume(tree,'{',TYPE_SYMBOLS)
            this.compileSelectors(tree,tableName)
            this.consume(tree,'}', TYPE_SYMBOLS)
        }
        this.consume(tree,'.',TYPE_SYMBOLS)
        const columnName = tokens[this.curIdx][0]
        if (tableName in columnNames){
            columnNames[tableName].add(columnName)
        }
        else{
            const set = new Set()
            set.add(columnName)
            columnNames[tableName] = set
        }
        this.consume(tree, tokens[this.curIdx][0], TYPE_STR_CONSTANT, CATEGORY_COLUMNNAME, tableName)
    }

    compileSelectors(parentTree,tableName) {
        const tokens = this.tokens
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_SELECTORS)
        parentTree.children.push(tree)
        this.compileSelectorsTerm(tree,tableName)
        while (tokens[this.curIdx][1] == TYPE_BOOLEAN_OPS){
            this.consume(tree, tokens[this.curIdx][0], TYPE_BOOLEAN_OPS)
            this.compileSelectorsTerm(tree,tableName)
        }
    }

    compileSelectorsTerm(parentTree,tableName) {
        const tokens = this.tokens
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_SELECTORSTERM)
        parentTree.children.push(tree)
        if (tokens[this.curIdx][0] == '('){
            this.consume(tree, '(', TYPE_SYMBOLS)
            this.compileSelectors(tree,tableName)
            this.consume(tree, ')', TYPE_SYMBOLS)
        }
        else {
            this.compileSelector(tree,tableName)
        }
    }

    compileSelector(parentTree,tableName) {
        const tokens = this.tokens
        const columnNames = this.columnNames
        const tree = new TreeNode(parentTree,'',parentTree.level+1,CATEGORY_SELECTOR)
        parentTree.children.push(tree)
        const columnName = tokens[this.curIdx][0]
        tree.note = columnName
        if (tableName in columnNames){
            columnNames[tableName].add(columnName)
        }
        else{
            const set = new Set()
            set.add(columnName)
            columnNames[tableName] = set
        }
        this.consume(tree, columnName, TYPE_STR_CONSTANT, CATEGORY_COLUMNNAME, tableName)
        this.consume(tree, tokens[this.curIdx][0], TYPE_COMPARE_OPS)
        this.compileExp(tree)
    }

}

function getRefRanges(startRange,endRange){
    let [startIdx,startCol] = startRange.split('.')
    let [endIdx,endCol] = endRange.split('.')
    if (startCol != endCol) throw `Unexpected startCol: ${startCol}, endCol: ${endCol}`
    const ret = []
    startIdx = parseInt(startIdx.slice(1))
    endIdx = parseInt(endIdx.slice(1))
    for (let i = startIdx; i<=endIdx; i++){
        const ref = '$'+i+'.'+startCol
        ret.push(ref)
    }
    return ret
}

module.exports = expEngine;
