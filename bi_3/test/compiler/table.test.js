const assert = require('assert');
const Table = require('../../src/compiler/table.js');

describe('table test', function () {
    describe('table test', function () {

        it('test1', async () => {
            const rowsNameVersion =  
                   [
                        { 
                            colA: '固定资产.{(账期=issue("2019-12",-3)) and (资产名称=aaa)}.资产名称',
                            colB: '123',
                            colC: '固定资产.{(账期=issue("2019-12",3)) and (资产名称=aaa)}.资产名称',
                            _id: '1',
                        },
                        { 
                            colA: '余额表.{账期="2019-12"}.本期借',
                            colB: '固定资产.{(账期=issue("2019-12",3)) and (资产名称=aaa)}.资产名称',
                            colC: '456',
                            _id: '2',
                        },
                    ];
            const tableName = 'table1'
            const table = new Table(rowsNameVersion, tableName);
            const refTableInfo = table.refTableInfo
            for (const tableName in refTableInfo){
                console.info(tableName)
                console.info(refTableInfo[tableName])
            }
        });

        it('test2', async () => {
            const rowsNameVersion =  
                   [
                        { 
                            colA: '$2.colC',
                            colB: '123',
                            colC: '321',
                            _id: '1',
                        },
                        { 
                            colA: '111',
                            colB: '222',
                            colC: '$$.colA+$$.colB',
                            _id: '2',
                        },
                    ];
            const tableName = 'table1'
            const table = new Table(rowsNameVersion, tableName);
            table.execCell(0,'colA')
            const actual = table.rowsOfValue
            const expected = [ { colA: 333 }, { colB: 222, colA: 111, colC: 333 } ]
            assert.deepEqual(expected, actual)
        });


    });
});
