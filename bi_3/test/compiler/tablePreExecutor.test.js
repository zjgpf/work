const assert = require('assert');
const TablePreExecutor = require('../../src/compiler/tablePreExecutor.js');

describe('tablePreExecutor test', function () {
    describe('tablePreExecutor test', function () {
        it('test1', async () => {
            const rowsNameVersion =  
                   [
                        { 
                            colA: 'sum(tableA.{账期="2019-11"}.colB,固定资产.{(账期="2019-12") and (资产名称=aaa)}.colB)',
                            colB: '业务数据.{(日期="2019-12-02") and (资产名称=aaa)}.资产名称',
                            colC: 'tableA.{(账期="2019-12") and (资产名称=aaa)}.资产名称',
                            _id: '1',
                        },
                        { 
                            colA: '余额表.{账期="2019-12"}.本期借',
                            colB: '固定资产.{(账期="2019-13") and (资产名称=aaa)}.资产名称',
                            colC: '456',
                            _id: '2',
                        },
                    ];
            const tableName = 'table1'
            const tablePreExecutor = new TablePreExecutor(rowsNameVersion, tableName);
            console.info(tablePreExecutor.tableIssues)
        });

        it('test2', async () => {
            const rowsNameVersion =  
                   [
                        { 
                            colA: 'sum(tableA.{账期="2020-01"}.colA, 固定资产.{(账期=issue("2019-12",-3)) and (资产名称=aaa)}.colB)',
                            colB: '业务数据_aaa.{(日期="2019-12-02") and (资产名称=aaa)}.资产名称',
                            colC: 'tableA.{(账期=issue("2019-12",3)) and (资产名称=aaa)}.资产名称',
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
            const tablePreExecutor = new TablePreExecutor(rowsNameVersion, tableName);
            console.info(tablePreExecutor.tableIssues)
        });

        it.only('test3', async () => {
            const rowsNameVersion =  
                   [
                        { 
                            colA: 'sum(tableA.{账期="2019-11"}.colB,固定资产.{(账期=$2.colC) and (资产名称=aaa)}.colB)',
                            colB: '业务数据.{(日期="2019-12-02") and (资产名称=aaa)}.资产名称',
                            colC: 'tableA.{(账期="2019-12") and (资产名称=aaa)}.资产名称',
                            _id: '1',
                        },
                        { 
                            colA: '余额表.{账期="2019-12"}.本期借',
                            colB: '固定资产.{(账期="2019-13") and (资产名称=aaa)}.资产名称',
                            colC: 'issue("2019-12",3)',
                            _id: '2',
                        },
                    ];
            const tableName = 'table1'
            const tablePreExecutor = new TablePreExecutor(rowsNameVersion, tableName);
            console.info(tablePreExecutor.tableIssues)
        });

    });
});
