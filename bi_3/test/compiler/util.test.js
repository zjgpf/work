const assert = require('assert');
const Util = require('../../src/compiler/util');

const IdNameMap = {
    'idNameMap':
    {
        'tableId1':['tableName1', {'colId1':'colName1','colId2':'colName2'}],
        'tableId2':['tableName2', {'colId1':'colName1','colId2':'colName2'}],
    },
    'nameIdMap':
    {
        'tableName1':['tableId1', {'colName1':'colId1','colName2':'colId2'}],
        'tableName2':['tableId2', {'colName1':'colId1','colName2':'colId2'}],
    }

}

describe('Util', function () {
    describe('', function () {
        it.only('test1', async () => {
            const expStr = 'tableName1.{colName1 = aaa}.colName2'
            const ret = Util.expNameVersionToIdVersion(expStr,IdNameMap)
            console.info(ret)
            assert.equal(ret,'tableId1.{colId1=aaa}.colId2')
        });

        it('test2', async () => {
            const expStr = 'tableId1.{colId1 = aaa}.colId2'
            const ret = Util.expIdVersionToNameVersion(expStr,IdNameMap)
            console.info(ret)
            assert.equal(ret,'tableName1.{colName1=aaa}.colName2')
        });

    });
});
