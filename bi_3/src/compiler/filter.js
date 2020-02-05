const ExpExecutor = require('./expExecutor') 
const ExpCell = require('./expCell') 

class Filter {
    /*
        rowsOfData: rows from table to be filter
        resultFilter: input from frontend to filter the rows
    **/
    static filter(rowsOfData, resultFilter){
        if (rowsOfData.length == 0) return []
        if (!('主键' in rowsOfData[0])) throw '主键 not found when do the filtering'
        let ret = []
        let selector = resultFilter.trim() 
        if (selector[0] != '{') selector = '{ ' + selector + ' }'
        const expCell = new ExpCell('this.'+selector+'.主键',-1,'colA')
        const tmpCache = {
            'tables':{
                'this': rowsOfData
            }
        }
        const expExecutor = new ExpExecutor(expCell.engine, [], -1, null, tmpCache)
        const selectedPKs = expExecutor.exec()
        const pkSet = new Set(selectedPKs)
        for (const row of rowsOfData){
            if (pkSet.has(row['主键'])) continue
            ret.push(row)
        }
        return ret
    }
   
}

module.exports = Filter
