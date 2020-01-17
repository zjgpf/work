/**
Created by Pengfei Gao on 2019-12-18
*/
const ExpCell = require('./expCell')
const Util = require('./util')
const ExpExecutor = require('./expExecutor')
class Table {

    constructor(rowsNameVersion, tableName){
        this.rowsNameVersion = rowsNameVersion
        this.tableName = tableName
        this.rowsOfExpCell = []
        this.rowsOfValue = []
        this.refTableInfo = {}
        this.G = null
        //reverse of G
        this.GR = null
        if(!rowsNameVersion || rowsNameVersion.length == 0) return
        this.init()
    }

    init(){
        const rowsNameVersion = this.rowsNameVersion
        const rowsOfExpCell = this.rowsOfExpCell
        for (let i = 0; i < rowsNameVersion.length; i++){
            const rowNameVersion = rowsNameVersion[i]
            const rowOfExpCell = {}
            for (const col in rowNameVersion){
                if (col == '_id') continue
                const expCell = new ExpCell(rowNameVersion[col], i+1, col)
                this.setRefTableInfo(expCell, i, col)
                rowOfExpCell[col] = expCell
            }
            rowsOfExpCell.push(rowOfExpCell)
            this.rowsOfValue.push({})
        }
        this.buildGraph()
        this.checkRef()
    }

    execCell(row,col){
        const rowsOfValue = this.rowsOfValue 
        const rowsOfExpCell = this.rowsOfExpCell
        if (col in rowsOfValue[row]) return rowsOfValue[row][col]
        const adj = this.GR.adj
        //const reverseOrder = ['$'+(row+1)+'.'+col]
        const reverseOrder = [Util.rowColToRef(row+1,col)]
        let i = 0
        while ( i < reverseOrder.length) {
            const v = reverseOrder[i]
            for (const w of adj[v]){
                reverseOrder.push(w)
            }
            i++
        }
        console.info(reverseOrder) 
        while (reverseOrder.length > 0){
            const v = reverseOrder.pop()
            let [row,col] = Util.refToRowCol(v)
            row -= 1
            if (col in rowsOfValue[row]) continue
            else {
                const cell = rowsOfExpCell[row][col] 
                const expExecutor = new ExpExecutor(cell.engine,rowsOfValue,row,col)
                const res = expExecutor.exec()
            }
        }
        return rowsOfValue[row][col]
    }

    buildGraph(){
        const rows= this.rowsOfExpCell
        const V = []
        const edges = []
        for (let i = 0; i < rows.length; i++){
            const numOfRow = i+1
            for (const col in rows[i]){
                const v = '$'+numOfRow+'.'+col
                V.push(v)
                const refs = [...rows[i][col].refs]
                if (refs.length > 0){
                    for (let w of refs){
                        if (w[1] == '$') {
                            let colDep = w.split('.')[1]
                            w = '$'+numOfRow+'.'+colDep
                        }
                        edges.push([w,v])
                    }
                }
            }
        }
        this.G = new Digraph(V)
        const graph = this.G
        for (const edge of edges){
            try {
                graph.addEdge(edge[0],edge[1])
            }catch (e) {
                throw `dependency ${edge[0]} not exist at ${edge[1]}`
            }
        }
        this.GR = graph.reverse()
    }

    /**
        refTableInfo: 
        {
            table1: 
            {
                col1: [[row1,col1],[row2,col2]]
                col2: [[row2,col2]]
            }
            table2:  
            {
                col1: [[row1,col1]]
                col2: [[row2,col2]]
            }
        }
    */
    setRefTableInfo(expCell,row,col){
        if (expCell.tableNames.size == 0) return
        const refTableInfo = this.refTableInfo
        const columnNames = expCell.columnNames
        for (const tableName in columnNames){
            if (!(tableName in refTableInfo)) refTableInfo[tableName] = {}
            for (const columnName of [...columnNames[tableName]]){
                if (!(columnName in refTableInfo[tableName])) refTableInfo[tableName][columnName] = [[row,col]]
                else refTableInfo[tableName][columnName].push([row,col])
            }
        }
    }

    checkRef(){
       checkCycle(this.G)
    }
}

class Digraph{

    constructor(V){
        this.V = V
        const adj = {}
        for (const v of V) adj[v] = []
        this.adj = adj
    }

    addEdge(v,w){
        this.adj[v].push(w) 
    }

    reverse(){
        const adj = this.adj
        const V = this.V
        const adjR = {}
        const G_R = new Digraph(V)
        for (const v in adj){
            for(const w of adj[v]){
                G_R.addEdge(w,v)
            }
        }
        return G_R
    }

}

const UNVISITED = 0
const VISITING = 1
const VISITED = 2

function checkCycle(G){
    const states = {}
    for (const v of G.V) states[v] = UNVISITED
    for (const v of G.V){
        if (states[v] == VISITED) continue
        if (DFS(G,v,states)) throw `Cycle detected for ${v}`
    }
}

function DFS(G,v,states){
    if (states[v] == VISITED) return false
    if (states[v] == VISITING) return true
    states[v] = VISITING
    for (const w of G.adj[v]){
        if (DFS(G,w,states)) return true
    }
    states[v] = VISITED
    return false
}


module.exports = Table;
