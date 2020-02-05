const ExpCell = require('./expCell')
const {
    CATEGORY_TABLENAME,
    CATEGORY_COLUMNNAME,
    TYPE_REFERENCE,
} = require('./lexical')
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

    static compileAndGetRowsReverseVersion(rowsCurVersion,tableNameOrId,IdNameMap,isFromNameToId){
        //console.info(rowsCurVersion)
        if (!rowsCurVersion || rowsCurVersion.length == 0){
            return []
        }
        let  colIdNameMapOrReverse = null 
        if (isFromNameToId){
            if (!(tableNameOrId in IdNameMap.nameIdMap)) throw `${tableNameOrId} not exist in IdNameMap`
            colIdNameMapOrReverse = IdNameMap.nameIdMap[tableNameOrId][1]
        }
        else {
            if (!(tableNameOrId in IdNameMap.idNameMap)) throw `${tableNameOrId} not exist in IdNameMap`
            colIdNameMapOrReverse = IdNameMap.idNameMap[tableNameOrId][1]
        }
        checkColumns(rowsCurVersion[0], colIdNameMapOrReverse)
        const rowsReverseVersion = []
        let depTablesIdOrName = new Set()
        const depColsIdOrName = {}
        for (let i = 0; i < rowsCurVersion.length; i++) {
            const rowCurVersion = rowsCurVersion[i]
            const rowReverseVersion = {}
            for (const colCurVersion in rowCurVersion){
                if (colCurVersion == '_id') rowReverseVersion['_id'] = rowCurVersion['_id']  
                else{
                    const colReverseVersion = colIdNameMapOrReverse[colCurVersion]
                    if (!colReverseVersion) throw `col: ${colCurVersion} not found in colIdNameMapOrReverse`
                    const expCell = new ExpCell(rowCurVersion[colCurVersion],i+1,colCurVersion) 
                    const refsCurVersion = [...expCell.refs]
                    for (const refCurVersion of refsCurVersion){
                        const [colCurPre, colCur] = refCurVersion.split('.')
                        const colReverse = colIdNameMapOrReverse[colCur]
                        if (!colReverse) throw `col: ${col} not found in colIdNameMapOrReverse`
                        const refReverseVersion = colCurPre + '.' + colReverse
                        expCell.substitute(refCurVersion, refReverseVersion, TYPE_REFERENCE, null)
                    }
                    const tablesCurVersion = [...expCell.tableNames]
                    for (const tableCurVersion of tablesCurVersion){
                        if (isFromNameToId){
                            const tableIdCols = IdNameMap.nameIdMap[tableCurVersion]
                            if (!tableIdCols) throw `table: ${tableCurVersion} not found in IdNameMap.nameIdMap`
                            const tableIdVersion = IdNameMap.nameIdMap[tableCurVersion][0]
                            expCell.substitute(tableCurVersion, tableIdVersion, null, CATEGORY_TABLENAME)
                            depTablesIdOrName.add(tableIdVersion)
                        } else {
                            const tableNameCols = IdNameMap.idNameMap[tableCurVersion]
                            if (!tableNameCols) throw `table: ${tableCurVersion} not found in IdNameMap.idNameMap`
                            const tableNameVersion = IdNameMap.idNameMap[tableCurVersion][0]
                            expCell.substitute(tableCurVersion, tableNameVersion, null, CATEGORY_TABLENAME)
                            depTablesIdOrName.add(tableNameVersion)
                        }
                    }
                    const colsCurVersionMap = expCell.columnNames
                    for (const tableCur in colsCurVersionMap){
                        if (isFromNameToId){
                            const tableIdCols = IdNameMap.nameIdMap[tableCur]
                            if (!tableIdCols) throw `table: ${tableCur} not found in IdNameMap.nameIdMap`
                            const tableId = tableIdCols[0]
                            if (!(tableId in depColsIdOrName)){
                                depColsIdOrName[tableId] = new Set()
                            }
                            const colsNameIdMap = tableIdCols[1]
                            const colsNameVersionOtherTable = [...colsCurVersionMap[tableCur]]
                            for (const colCurVersionOtherTable of colsNameVersionOtherTable){
                                const colReverseVersionOtherTable = colsNameIdMap[colCurVersionOtherTable]
                                if (!colReverseVersionOtherTable) throw `col: ${colCurVersionOtherTable} for table ${tableCur} not found in IdNameMap`
                                //expCell.substitute(colCurVersionOtherTable, colReverseVersionOtherTable, null, CATEGORY_COLUMNNAME)
                                expCell.substituteColumn(tableCur, colCurVersionOtherTable, colReverseVersionOtherTable)
                                depColsIdOrName[tableId].add(colReverseVersionOtherTable)
                            }
                        } else {
                            const tableNameCols = IdNameMap.idNameMap[tableCur]
                            if (!tableNameCols) throw `table: ${tableCur} not found in IdNameMap.idNameMap`
                            const tableName = tableNameCols[0]
                            if (!(tableName in depColsIdOrName)){
                                depColsIdOrName[tableName] = new Set()
                            }
                            const colsIdNameMap = tableNameCols[1]
                            const colsIdVersionOtherTable = [...colsCurVersionMap[tableCur]]
                            for (const colCurVersionOtherTable of colsIdVersionOtherTable){
                                const colReverseVersionOtherTable = colsIdNameMap[colCurVersionOtherTable]
                                if (!colReverseVersionOtherTable) throw `col: ${colCurVersionOtherTable} for table ${tableCur} not found in IdNameMap`
                                //expCell.substitute(colCurVersionOtherTable, colReverseVersionOtherTable, null, CATEGORY_COLUMNNAME)
                                expCell.substituteColumn(tableCur, colCurVersionOtherTable, colReverseVersionOtherTable)
                                depColsIdOrName[tableName].add(colReverseVersionOtherTable)
                            }
                        }
                    }
                    const expReverseVersion = expCell.getContent()
                    rowReverseVersion[colReverseVersion] = expReverseVersion
                }
            }
            rowsReverseVersion.push(rowReverseVersion)
        }
        //console.info(rowsReverseVersion)
        depTablesIdOrName = [...depTablesIdOrName]
        for (const tableIdOrName in depColsIdOrName){
            const cols = [...depColsIdOrName[tableIdOrName]]
            depColsIdOrName[tableIdOrName] = cols
        }
        return [rowsReverseVersion, depTablesIdOrName, depColsIdOrName]
    }
}

function checkColumns(colsFromRow, colsFromMap){
    for (const col in colsFromRow){
        if (col == '_id') continue
        if (!(col in colsFromMap)) throw `col: ${col} not found in IdNameMap, data inconsistent`
    }
    for (const col in colsFromMap){
        if ((col != '主键') && (col != '_PK') && !(col in colsFromRow)) throw `col: ${col} exist in IdNameMap, however not found in row, data inconsistent`
    }
}

module.exports = Util;
