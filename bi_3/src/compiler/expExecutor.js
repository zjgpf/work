/**
Created by Pengfei Gao on 2020-01-13
*/
const Function = require('../function/function.js')
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

    constructor(expEngine,rowsOfValue=[],row=-1,col=null){
        this.expEngine = expEngine
        this.rowsOfValue = rowsOfValue
        this.row = row
        this.col = col
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
                const res = this.execFuncCall(leafNodes[this.curIdx].parent)
                queue.push([res,'t_func'])
            }
            else if (leafNode.category == CATEGORY_TABLENAME){

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
