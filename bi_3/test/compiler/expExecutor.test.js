const assert = require('assert');
const Engine = require('../../src/compiler/expEngine');
const Tokenizer = require('../../src/compiler/expTokenizer');
const Executor = require('../../src/compiler/expExecutor');

describe('expEngine', function () {
    describe('', function () {
       it('test1', async () => {
            const expStr = '-3+(8-3*2)+2*3'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new Engine(tokens)
            const executor = new Executor(engine)
            const actual = executor.exec()
            assert.equal(actual,5)

        });
       it('test2', async () => {
            const expStr = '[1,1,-3+(8-3*2)+2*3]'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new Engine(tokens)
            const executor = new Executor(engine)
            const actual = executor.exec()
            const expected = [1,1,5]
            assert.deepEqual(actual,expected)
        });
       it('test3', async () => {
            const expStr = '1+sum(3+2*3,1)'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new Engine(tokens)
            const executor = new Executor(engine)
            const actual = executor.exec()
            assert.equal(actual,11)
        });
       it('test4', async () => {
            const expStr = '1+sum(3+2*3,sum(4,2))'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new Engine(tokens)
            const executor = new Executor(engine)
            const actual = executor.exec()
            assert.equal(actual,16)
        });
       it('test5', async () => {
            const expStr = '1+sum(3+2*3,sum(3+4,2))'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new Engine(tokens)
            const executor = new Executor(engine)
            const actual = executor.exec()
            assert.equal(actual,19)
        });
       it('test6', async () => {
            const expStr = 'sum(1+sum(3+2*3,sum(3+4,2)),1)'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new Engine(tokens)
            const executor = new Executor(engine)
            const actual = executor.exec()
            assert.equal(actual,20)
        });
       it('test7', async () => {
            const expStr = 'sum(1+sum(3+2*3,sum(3+4,2.1)),1)'
            const tokens = Tokenizer.tokenize(expStr)
            const engine = new Engine(tokens)
            const executor = new Executor(engine)
            const actual = executor.exec()
            assert.equal(actual,20.1)
        });
    });
});
