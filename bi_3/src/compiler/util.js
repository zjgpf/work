const ExpCell = require('./expCell')
const CATEGORY_TABLENAME = 'c_tableName'
class Util {

    static expNameVersionToIdVersion(expNameVersion, IdNameMap, isReverse=false){
        let ret = ''
        const expCell = new ExpCell(expNameVersion,-1,'colA') 
        const tablesNameVersion = [...expCell.tableNames]
        for (const tableNameVersion of tablesNameVersion){
            let tableIdCols = ""
            if (isReverse){
                tableIdCols = IdNameMap.idNameMap[tableNameVersion]
            }
            else{
                tableIdCols = IdNameMap.nameIdMap[tableNameVersion]
            }
            if (!tableIdCols) throw `table: ${tableNameVersion} not found in IdNameMap.nameIdMap`
            let tableIdVersion = ''
            if (isReverse){
                tableIdVersion = IdNameMap.idNameMap[tableNameVersion][0]
            }
            else{
                tableIdVersion = IdNameMap.nameIdMap[tableNameVersion][0]
            }
            expCell.substitute(tableNameVersion, tableIdVersion, null, CATEGORY_TABLENAME)
        }
        const colsNameVersionMap = expCell.columnNames
        for (const tableName in colsNameVersionMap){
            let tableIdCols = ""
            if (isReverse){
                tableIdCols = IdNameMap.idNameMap[tableName]
            }
            else{
                tableIdCols = IdNameMap.nameIdMap[tableName]
            }
            if (!tableIdCols) throw `table: ${tableCur} not found in IdNameMap.nameIdMap`
            const tableId = tableIdCols[0]
            const colsNameIdMap = tableIdCols[1]
            const colsNameVersionOtherTable = [...colsNameVersionMap[tableName]]
            for (const colNameVersionOtherTable of colsNameVersionOtherTable){
                const colIdVersionOtherTable = colsNameIdMap[colNameVersionOtherTable]
                if (!colIdVersionOtherTable) throw `col: ${colNameVersionOtherTable} for table ${tableName} not found in IdNameMap`
                expCell.substituteColumn(tableName, colNameVersionOtherTable, colIdVersionOtherTable)
            }
        }
        ret = expCell.getContent()
        return ret
    }
    
    static expIdVersionToNameVersion(expIdVersion, IdNameMap){
        return Util.expNameVersionToIdVersion(expIdVersion, IdNameMap, true)
   }

    static rowColToRef(rowNum,col){
        return '$'+rowNum+'.'+col
    }

    static refToRowCol(ref,curRowNum=-1){
        let [rowNum, col] = ref.split('.')
        if (curRowNum != -1 && rowNum[1] == '$'){
            rowNum = curRowNum
        }
        else {
            rowNum = parseInt(rowNum.slice(1))
        }
        return [rowNum,col]
    }
    
}

module.exports = Util;
