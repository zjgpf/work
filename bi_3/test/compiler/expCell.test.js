const assert = require('assert');
const ExpCell = require('../../src/compiler/expCell');

describe('expCell', function () {
    describe('', function () {

        it('test1', async () => {
            const expStr = '(10*$$.colA+sum(余额表.{(账期>=issue("2019-01",sum(1,3)) and 账期 <= 选择账期) and ((科目编码 = $$.colB or 科目编码 = 1001*) and 科目编码 != 10012 ) and (本期借>=0)}.本期借, 10, $$.colD, sum(1,2)))/-(sum($10.colC: $20.colC))'
            const cell = new ExpCell(expStr,1,'colA')
            //assert.deepEqual(tokens, expected)
        });

        it.skip('test2', async () => {
            const expStr = '(10*$$.colA++sum(余额表.{(账期>=issue("2019-01",sum(1,3)) and 账期 <= 选择账期) and ((科目编码 = $$.colB or 科目编码 = 1001*) and 科目编码 != 10012 ) and (本期借>=0)}.本期借, 10, $$.colD, sum(1,2)))/-(sum($10.colC: $20.colC))'
            const cell = new ExpCell(expStr,1,'colA')
            //assert.deepEqual(tokens, expected)
        });

        it('test3', async () => {
            const expStr = '(10*$$.colA+sum(余额表.{(账期>=issue("2019-01"，sum(1,3)) and 账期 <= 选择账期) and ((科目编码 = $$.colB or 科目编码 = 1001*) and 科目编码 != 10012 ) and (本期借>=0)}.本期借, 10, $$.colD, sum(1,2)))/-(sum($10.colC: $20.colC))'
            const cell = new ExpCell(expStr,1,'colA')
            //assert.deepEqual(tokens, expected)
        });

    });
});
