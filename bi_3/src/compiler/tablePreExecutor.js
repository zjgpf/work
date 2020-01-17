/**
Created by Pengfei Gao on 2020-01-16
*/
const {PRE_EXEC_TABLE_COLUMN_MAP} = require('./config')
const Table = require('./table')
const ExpExecutor = require('./expExecutor')
const Util = require('./util')
class TablePreExecutor {

    constructor(rowsNameVersion,tableName){
        this.rowsNameVersion = rowsNameVersion
        this.tableName= tableName
        this.table = new Table(rowsNameVersion, tableName)
        this.tableIssues = {}
        this.initTableIssues()
    }

    /**
        tableIssues:
        {
            '余额表': set('2020-01', '2020-02'),
            '固定资产': set('2020-03', '2020-04')
        }
    */
    initTableIssues(){
        const table = this.table
        const refTableInfo = table.refTableInfo
        const tableIssues = this.tableIssues
        for ( const tableNameOrigin in refTableInfo){
            let tableNameNew = tableNameOrigin
            if (tableNameOrigin.indexOf('_') != -1) tableNameNew = tableNameOrigin.split('_')[0]
            if (!(tableNameNew in PRE_EXEC_TABLE_COLUMN_MAP)) continue
            const mandatoryColumn = PRE_EXEC_TABLE_COLUMN_MAP[tableNameNew]
            const positions = refTableInfo[tableNameOrigin][mandatoryColumn]
            if (!positions) throw `mandatory column ${mandatoryColumn} not found for ${tableNameOrigin}`
            if (!(tableNameOrigin in tableIssues)){
                tableIssues[tableNameOrigin] = new Set()
            }
            for (const position of positions){
                const timeRange = this.getTimeRangeSingleCell(position[0],position[1],tableNameOrigin,mandatoryColumn) 
                for (const time of [...timeRange]){
                    tableIssues[tableNameOrigin].add(time)
                }
            }
        }
        //console.info(tableIssues)
        //debugger
    }

    getTimeRangeSingleCell(row,col,tableName,mandatoryColumn){
        const table = this.table
        const cell = table.rowsOfExpCell[row][col]
        console.info(table.rowsOfValue)
        if (cell.refs.size > 0){
            const refs = [...cell.refs]
            for (const ref of refs){
                let [refRowNum,refCol] = Util.refToRowCol(ref,cell.row)
                const refCell = table.rowsOfExpCell[refRowNum-1][refCol]
                table.execCell(refCell.row-1,refCell.col)
            }
        }
        console.info(table.rowsOfValue)
        const ret = new Set()
        //console.info(cell.expStr)
        const expExecutor = new ExpExecutor(cell.engine,table.rowsOfValue,row,col)
        const selectNodes = cell.engine.getSelectorNodesPerColumnName(tableName,mandatoryColumn)
        for (const node of selectNodes){
            const rightNode = node.children[2]
            const res = expExecutor.execExp(rightNode)
            //console.info(res)
            //debugger
            ret.add(res)
        }
        console.info(ret)
        debugger
        return ret
    }
}

module.exports = TablePreExecutor
