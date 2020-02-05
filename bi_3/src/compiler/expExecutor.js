/**
Created by Pengfei Gao on 2020-01-13
*/
const Function = require('../function/function.js')
const RESERVED_VARIABLES_MAP = require('./reservedVariablesMap')
const Util = require('./util.js')
const {
        OP_PRIORITY,
        TYPE_CONSTANT_ALL,
        TYPE_OPS_ALL,
        TYPE_BINARY_OPS_ALL,
        TYPE_UNARY_OPS_ALL,
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
        TYPE_RESERVED_VARIABLE,
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

class ExpExecutor{

    constructor(expEngine,rowsOfValue=[],row=-1,col=null,globalCache=null){
        this.expEngine = expEngine
        this.rowsOfValue = rowsOfValue
        this.row = row
        this.col = col
        this.globalCache = globalCache
        this.curIdx = 0
        this.leafNodes = []
        const tree = this.expEngine.tree
        tree.traversalLeafs(this.leafNodes)
        this.init()
    }

    exec(){
        let ret = null
        try{
            ret =  this.execExp(this.expEngine.tree.children[0])
        } catch(e){
            throw `Execution error occured: ${e}`
        }
        if (this.row != -1) this.rowsOfValue[this.row][this.col] = ret
        return ret
    }

    init(){
        const leafNodes = this.leafNodes
        const root = this.expEngine.tree
        const nodesPerLevel = {}
        const queue = [root]
        let maxLevel = 0
        //init nodesPerLevel
        while (queue.length > 0){
            const node = queue.shift()
            maxLevel = maxLevel > node.level ? maxLevel : node.level
            if (node.level in nodesPerLevel){
                nodesPerLevel[node.level].push(node)
            }
            else{
                nodesPerLevel[node.level] = [node]
            }
            for (const child of node.children) queue.push(child)
        }
        //init node idx in from leaf -> root
        for (let i = 0; i < leafNodes.length; i++){
            leafNodes[i].startIdx = i
            leafNodes[i].endIdx = i 
        }
        let curLevel = maxLevel-1
        while (curLevel > 0){
            const nodes = nodesPerLevel[curLevel]
            for (const node of nodes){
                if (node.children.length > 0){
                    node.startIdx = node.children[0].startIdx 
                    node.endIdx = node.children[node.children.length-1].endIdx
                }
            }
            curLevel-=1
        }
    }

    execReservedVariable(node){
        const rvFrontEnd = node.content
        const rvBackEnd = RESERVED_VARIABLES_MAP[rvFrontEnd]
        if (!rvBackEnd) throw `reserved variable ${rvFrontEnd} not found`
        const ret = this.globalCache['reservedVariables'][rvBackEnd]
        if (!ret) throw `reserved variable ${rvFrontEnd} not found in global cache`
        return ret
    }

    execParamList(paramListNode){
        const leafNodes = this.leafNodes
        const paramNodesOrigin = paramListNode.children
        if (paramNodesOrigin.length == 0) return []
        if (paramNodesOrigin.length % 2 == 0){
            throw `Invalid number of params of paramList ${paramNodes.length}`
        }
        const paramNodes = []
        for (let i = 0; i < paramNodesOrigin.length; i++){
            if (i % 2 == 0) paramNodes.push(paramNodesOrigin[i])
            else {
                const curNode = paramNodesOrigin[i]
                const startIdx = curNode.startIdx
                const endIdx = curNode.endIdx
                if (startIdx != endIdx || leafNodes[startIdx].content != ',' || leafNodes[startIdx].type != TYPE_SYMBOLS){
                    throw `Invalid token when exec paramList expected: , ${TYPE_SYMBOLS}`
                }
            }
        }
        const params = []
        for (const paramNode of paramNodes){
            const param = this.execExp(paramNode)
            params.push(param)
        }
        return params
    }

    execFuncCall(funcNode){
        const subFuncNodes = funcNode.children
        const funcName = subFuncNodes[0].content
        const lastIdx = subFuncNodes.length-1
        let paramList = []
        if (lastIdx < 2) throw `Invalid funcNode: ${funcName}`
        else if (lastIdx > 2){
            const paramListNode = subFuncNodes[2] 
            paramList = this.execParamList(paramListNode)
        }
        const ret = Function.exec(funcName,paramList)
        this.curIdx = funcNode.endIdx+1
        return ret
    }

    execSelectorCombo(SCNode){
        const subSCNodes = SCNode.children
        const tableName = subSCNodes[0].content
        const lastIdx = subSCNodes.length - 1
        const selectedColumn = subSCNodes[lastIdx].content
        if (lastIdx < 5) throw `Invalid SCNode: ${tableName}`
        let idxs = []
        const rows = this.globalCache.tables[tableName]
        const ret = []
        if (lastIdx == 5){
            //tableA.{}.colA
            for ( const row of rows){
                ret.push(row[selectedColumn])
            }
            return ret
        }
        else if (lastIdx == 6) {
            //tableA.{...}.colA
            idxs = this.execSelectorsSingle(subSCNodes[3])
        }
        else{
            //todo: tableA.{...}.{...}.colA
            idxs = this.execSelectorsMulti()
        }
        //console.info(selectedColumn)
        //console.info(idxs)
        for (let i of idxs){
            const row = rows[i]
            ret.push(row[selectedColumn])
        }
        return ret
    }

    execSelectorsSingle(selectorsNode){
        //(a>b) and (c>d) and (e=f)
        const subSelectorsNodes = selectorsNode.children
        const booleanOps = []
        const idxsArr = []
        for (let i = 0; i < subSelectorsNodes.length; i++){
            const subSelectorsNode = subSelectorsNodes[i]
            if (i%2 == 1) {
                if (subSelectorsNode.type != TYPE_BOOLEAN_OPS){
                    throw `Unexpected token type when exec selectors, expected ${TYPE_BOOLEAN_OPS}, actual ${subSelectorsNode.type}`
                }
                booleanOps.push(subSelectorsNode.content)
            }
            else {
                const idxs = this.execSelectorTerm(subSelectorsNode)
                idxsArr.push(idxs)
            }
        }
        let ret = []
        //console.info(idxsArr)
        //debugger
        if (booleanOps.length == 0){
            ret = idxsArr[0]
        }
        else{
            for (const booleanOp of booleanOps){
                const leftIdxs = idxsArr.shift()
                const rightIdxs = idxsArr.shift()
                if (booleanOp == 'and'){
                    const arr = this.arrAndOp(leftIdxs,rightIdxs)
                    //console.info(arr)
                    //debugger
                    idxsArr.unshift(arr)
                }
                else if (booleanOp == 'or'){
                    const arr = this.arrOrOp(leftIdxs,rightIdxs)
                    idxsArr.unshift(arr)
                }
                else {
                    throw `Unexpected op in selectors, when do the execution, expected: and, or, acutal ${booleanOp}`
                }
                //console.info(idxsArr)
                //debugger
            }
            ret = idxsArr[0]
        }
        return ret
    }

    arrAndOp(arrA,arrB){
        const valueSet = new Set()
        const ret = []
        for (const v of arrA) valueSet.add(v)
        for (const v of arrB){
            if (valueSet.has(v)) ret.push(v)
        }
        return ret
    }

    arrOrOp(arrA,arrB){
        const valueSet = new Set()
        for (const v of arrA) valueSet.add(v)
        for (const v of arrB) valueSet.add(v)
        return [...valueSet]
    }

    execSelectorTerm(selectorTermNode){
        let idxs = []
        const subSelectorTermNodes = selectorTermNode.children
        if (subSelectorTermNodes.length == 1){
            idxs = this.execSelector(subSelectorTermNodes[0])
        }
        else if (subSelectorTermNodes.length == 3){
            if (
                    subSelectorTermNodes[0].type != TYPE_SYMBOLS || subSelectorTermNodes[0].content != '(' ||
                    subSelectorTermNodes[2].type != TYPE_SYMBOLS || subSelectorTermNodes[2].content != ')'
                )
            {
                throw `Unexpected selectors term`
            }
            idxs = this.execSelectorsSingle(subSelectorTermNodes[1])
        }
        else {
            throw `Unexpected selectTerm length, expected 1 or 3, actual ${subSelectorTermNodes.length}`
        }
        return idxs
    }

    execSelector(selectorNode){
        if (selectorNode.children.length != 3){
            throw `Unexpected selector node length, expected: 3, actual ${selectorNode.length}`
        }
        const [colNameNode, opNode, expNode] = selectorNode.children 
        if (colNameNode.category != CATEGORY_COLUMNNAME ) throw `Unexpected colName node when call execSelector`
        if (opNode.type != TYPE_COMPARE_OPS ) throw `Unexpected op node when call execSelector`
        if (expNode.category != CATEGORY_EXPRESSION ) throw `Unexpected exp node when call execSelector`
        const table = this.globalCache.tables[colNameNode.note]
        const expRes = this.execExp(expNode)
        const colName = colNameNode.content
        const op = opNode.content
        let pattern = null
        const lastIdx = expRes.length-1
        if (op == '=' && expRes && (expRes[0] == '*' || expRes[lastIdx] == '*')){
            if (expRes[0] == '*' && expRes[lastIdx] == '*') pattern = new RegExp(expRes.slice(1,lastIdx))
            else if (expRes[0] == '*'){
                pattern = new RegExp(expRes.slice(1)+'$')
            }
            else{
                pattern = new RegExp('^'+expRes.slice(0,lastIdx))
            }
        }
        const idxs = []
        for (let i=0; i<table.length; i++){
            const row = table[i]
            if (op == '='){
                if (pattern && pattern.test(row[colName])) idxs.push(i)
                else if (row[colName] == expRes) idxs.push(i)
            }
            else if (op == '>'){
                if (row[colName] > expRes) idxs.push(i)
            }
            else if (op == '>='){
                if (row[colName] >= expRes) idxs.push(i)
            }
            else if (op == '<'){
                if (row[colName] < expRes) idxs.push(i)
            }
            else if (op == '<='){
                if (row[colName] <= expRes) idxs.push(i)
            }
        }
        //console.info(idxs)
        //debugger
        return idxs
    }
   
    execExp(expNode){
        const startIdx = expNode.startIdx
        const endIdx = expNode.endIdx
        const leafNodes = this.leafNodes
        const opStack = []
        const queue = []
        this.curIdx = startIdx
        while ( this.curIdx <= endIdx){
            const leafNode  = leafNodes[this.curIdx]
            if (leafNode.content == '[' && leafNode.type == TYPE_SYMBOLS) {
                this.curIdx += 1
                const firstParamListNode = leafNodes[this.curIdx]
                let paramListNode = firstParamListNode.parent
                while (paramListNode && paramListNode.category != CATEGORY_PARAMLIST){
                    paramListNode = paramListNode.parent
                }
                if (!paramListNode) throw 'Not found paramListNode'
                const ret = this.execParamList(paramListNode)
                const curNode = this.leafNodes[this.curIdx]
                if (curNode.content != ']' || curNode.type != TYPE_SYMBOLS){
                    throw `Unexpect node or type, expect: [, ${TYPE_SYMBOLS}, actual: ${curNode.content}, ${curNode.type}`
                }
                queue.push([ret,'t_list'])
                this.curIdx+=1
            }
            else if (leafNode.category == CATEGORY_FUNCTIONNAME){
                const res = this.execFuncCall(leafNode.parent)
                queue.push([res,'t_func'])
            }
            else if (leafNode.category == CATEGORY_TABLENAME){
                const res = this.execSelectorCombo(leafNode.parent)
                queue.push([res,'t_sc'])
                this.curIdx = leafNode.parent.endIdx+1
            }
            else if (leafNode.type == TYPE_REFERENCE){
                const rowsOfValue = this.rowsOfValue
                let [row,col] = Util.refToRowCol(leafNode.content,this.row+1)
                row-=1
                const res = rowsOfValue[row][col]
                queue.push([res,TYPE_REFERENCE])
                this.curIdx+=1
                //to do look ahead ':'
            }
            else if (leafNode.type == TYPE_RESERVED_VARIABLE){
                const res = this.execReservedVariable(leafNode)
                queue.push([res,TYPE_RESERVED_VARIABLE])
                this.curIdx+=1
            }
            else if (leafNode.type in TYPE_CONSTANT_ALL ){
                if (leafNode.type == TYPE_INTEGER_CONSTANT || leafNode.type == TYPE_FLOAT_CONSTANT){
                    queue.push([parseFloat(leafNode.content),leafNode.type])
                }
                else{
                    queue.push([leafNode.content,leafNode.type])
                }
                this.curIdx+=1
            }
            else if ((leafNode.type in TYPE_OPS_ALL) || leafNode.content == '(' || leafNode.content == ')' ){
                if (leafNode.type == TYPE_UNARY_OPS){
                    opStack.push(['-','unary',1])
                }
                else if (leafNode.content == '('){
                    opStack.push(['(','',0])
                }
                else if (leafNode.content == ')'){
                    let opNode = opStack.pop()
                    while (opNode[0] != '('){
                        queue.push(opNode)
                        opNode = opStack.pop()
                    }
                }
                else {
                    const priority = OP_PRIORITY[leafNode.content]
                    if (priority == undefined) throw `Op ${leafNode.content} has no priority`
                    opStack.push([leafNode.content,'binary',priority])
                    let curStackIdx = opStack.length - 1
                    while (curStackIdx > 0 && opStack[curStackIdx-1][0] != '(' && (opStack[curStackIdx][2] > opStack[curStackIdx-1][2])){
                        swap(opStack,curStackIdx,curStackIdx-1)
                        queue.push(opStack.pop())
                        curStackIdx-=1
                    }
                }
                this.curIdx += 1
            }
            else throw `Unexpected node type ${leafNode.type}`
        }
        while(opStack.length > 0){
            queue.push(opStack.pop())
        }
        //console.info(queue)
        //debugger
        const stack = []
        while (queue.length > 0){
            const item = queue.shift()
            if (item[1] == 'unary'){
                let result = stack.pop()
                if (item[0] == '-'){
                    result =  - result[0]
                }
                else if (item[0] == 'not'){
                    //to do
                }
                else throw `Unexpected unary operator ${item[0]}`
                stack.push([result,''])
            }
            else if (item[1] == 'binary'){
                let right = stack.pop()
                let left = stack.pop()
                let result = null
                if (['+','-','*','/','>','<','=','>=','<='].indexOf(item[0])!=-1){
                    right = right[0]
                    left = left[0]
                }
                if (item[0] == '+'){
                    result = left+right
                }
                else if (item[0] == '-'){
                    result = left-right
                }
                else if (item[0] == '*'){
                    result = left*right
                }
                else if (item[0] == '/'){
                    result = left/right
                }
                else{
                    //to do
                }
                stack.push([result,''])
            }
            else {
                stack.push(item)
            }
            //console.info(stack)
            //debugger
        }
        //debugger
        return stack[0][0]
    }
}

function swap(arr,i,j){
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
}

module.exports = ExpExecutor;
