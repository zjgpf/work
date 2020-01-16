const assert = require('assert');
const ExpEngine = require('../../src/compiler/expEngine');
const Tokenizer = require('../../src/compiler/expTokenizer');

describe('expEngine', function () {
    describe('', function () {

        it('test1', async () => {
            const expStr = '(10*$$.colA+sum(余额表.{(账期>=issue("2019-01",sum(1,3)) and 账期 <= 选择账期) and ((科目编码 = $$.colB or 科目编码 = "1001*") and 科目编码 != "10012" ) and (本期借>=0)}.本期贷, 10, $$.colD, sum(1,2)))/-(sum($10.colC: $20.colC))'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new ExpEngine(tokens)
            const content = engine.generateContent()
            assert.equal(content, '(10*$$.colA+sum(余额表.{(账期>=issue(2019-01,sum(1,3)) and 账期<=选择账期) and ((科目编码=$$.colB or 科目编码=1001*) and 科目编码!=10012) and (本期借>=0)}.本期贷,10,$$.colD,sum(1,2)))/-(sum($10.colC:$20.colC))')
            const refs = [...engine.refs]
            const tableNames = [...engine.tableNames]
            const funcNames = [...engine.funcNames]
            const columnNames = engine.columnNames
            for(const t in columnNames){
                columnNames[t] = [...columnNames[t]]
            }
            assert.equal(refs.length,14)
            const expectedRefs = 
                [ '$$.colA',
                    '$$.colB',
                    '$$.colD',
                    '$10.colC',
                    '$11.colC',
                    '$12.colC',
                    '$13.colC',
                    '$14.colC',
                    '$15.colC',
                    '$16.colC',
                    '$17.colC',
                    '$18.colC',
                    '$19.colC',
                    '$20.colC' ]
            for (const ref of refs){
                if (expectedRefs.indexOf(ref) == -1) throw "unexpected result"
            }
            assert.equal(funcNames.length,2)
            const expectedFuncNames = 
                ['sum','issue']
            for (const funcName of funcNames){
                if (expectedFuncNames.indexOf(funcName) == -1) throw "unexpected result"
            }
            assert.equal(tableNames.length,1)
            const expectedTableNames = 
                ['余额表']
            for (const tableName of tableNames){
                if (expectedTableNames.indexOf(tableName) == -1) throw "unexpected result"
            }
            assert.equal(Object.keys(columnNames).length,1)
            const colNames = columnNames['余额表']
            assert.equal(colNames.length,4)
            const expectedColNames = 
                [ '账期', '科目编码', '本期借', '本期贷' ]
            for (const colName of colNames){
                if (expectedColNames.indexOf(colName) == -1) throw "unexpected result"
            }
        });

        it('test2', async () => {
            const expStr = '余额表.{科目编码 != 科目表.{}.科目代码}.本期贷'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new ExpEngine(tokens)
            const content = engine.generateContent()
            const refs = [...engine.refs]
            const tablenames = [...engine.tableNames]
            const funcnames = [...engine.funcNames]
            const columnnames = engine.columnNames
            for(const t in columnnames){
                columnnames[t] = [...columnnames[t]]
            }
            assert.equal(refs.length,0)
            assert.equal(funcnames.length,0)
            assert.equal(tablenames.length,2)
            const expectedtablenames = 
                ['余额表','科目表']
            for (const tablename of tablenames){
                if (expectedtablenames.indexOf(tablename) == -1) throw "unexpected result"
            }
            assert.equal(Object.keys(columnnames).length,2)
            const colnames = columnnames['余额表']
            assert.equal(colnames.length,2)
            const expectedcolnames = 
                [ '科目编码', '本期贷' ]
            for (const colname of colnames){
                if (expectedcolnames.indexOf(colname) == -1) throw "unexpected result"
            }
            const colnames2 = columnnames['科目表']
            assert.equal(colnames2.length,1)
            const expectedcolnames2 = 
                ['科目代码']
            for (const colname of colnames2){
                if (expectedcolnames2.indexOf(colname) == -1) throw "unexpected result"
            }
            //assert.deepEqual(tokens, expected)
        });

        it('test3', async () => {
            const expStr = '2>3'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new ExpEngine(tokens)
            const content = engine.generateContent()
        });

        it('test4', async () => {
            const expStr = '末级科目余额表.{  科目编码 != 变动费用末级科目余额表.{主键="*"}.科目编码  }.主键'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new ExpEngine(tokens)
            engine.substitute('科目编码', 'abc', null, 'c_columnName')
            const content = engine.generateContent()
            assert.equal(content,'末级科目余额表.{abc!=变动费用末级科目余额表.{主键=*}.abc}.主键')
        });

        it('test5', async () => {
            const expStr = '末级科目余额表.{  科目编码 != 变动费用末级科目余额表.{主键="*"}.科目编码  }.主键'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new ExpEngine(tokens)
            engine.substituteColumn('变动费用末级科目余额表', '科目编码', 'abc')
            const content = engine.generateContent()
            assert.equal(content,'末级科目余额表.{科目编码!=变动费用末级科目余额表.{主键=*}.abc}.主键')
        });

        it('test6', async () => {
            const expStr = '余额表.{  (账期 = 选择账期)  and  (科目编码 = "1001")  }.主键'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new ExpEngine(tokens)
            const node = engine.selectNodeFirstOnly('c_selector', '','账期') 
            const content = node.getLeafContent()
            assert.equal(content,'账期=选择账期')
        });

        it('test7', async () => {
            const expStr = 'str($$.colA,"-",a)'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new ExpEngine(tokens)
            const content = engine.tree.getLeafContent()
            console.info(content)
        });

        it('test8', async () => {
            const expStr = '(-10.1*$$.colA+sum(余额表.{(账期>=issue("2019-01",sum(1,3)) and 账期 <= 选择账期) and ((科目编码 in $$.colB or 科目编码 = "1001*") and (科目编码 not_in [10012, 1230])) and     (本期借>=0)}.本期借, -10.3, $$.colD, sum(1,2.6)))/-(sum($10.colC:$20.colC))'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new ExpEngine(tokens)
            const content = engine.tree.getLeafContent()
            console.info(content)
        });

    });
});
