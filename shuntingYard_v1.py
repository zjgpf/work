import pdb

'''
):0
-3,-:1
*,/:2
+,-:3
=,>,in:4
not:5
and:6
or:7
(:999
'''

exp = "-3+(8-3*2)+2*3"

operators = '()+-*/'
tokens = [
    ['-',1],
    ['3',-1],
    ['+',3],
    ['(',999],
    ['8',-1],
    ['-',3],
    ['3',-1],
    ['*',2],
    ['2',-1],
    [')',0],
    ['+',3],
    ['2',-1],
    ['*',2],
    ['3',-1]
]
def shuntingYard_v1(tokens):
    outputQueue = []
    operatorStack = []
    for t in tokens:
        if t[0] in operators: 
            if t[0] == '(':
                operatorStack.append(t)
            elif t[0] == ')':
                op = operatorStack.pop()
                while op[0] != '(':
                    outputQueue.append(op)
                    op = operatorStack.pop()
            else:
                operatorStack.append(t)
                lastIdx = len(operatorStack)-1
                curIdx = lastIdx
                while curIdx > 0 and operatorStack[curIdx][1] > operatorStack[curIdx-1][1]:
                    operatorStack[curIdx], operatorStack[curIdx-1] = operatorStack[curIdx-1], operatorStack[curIdx]
                    curIdx-=1
                count = lastIdx - curIdx
                while count:
                    outputQueue.append(operatorStack.pop()) 
                    count-=1
        else:
            outputQueue.append(t)
    while operatorStack:
        outputQueue.append(operatorStack.pop())
    return outputQueue

def rpn(queue):
    stack = []
    while queue:
        item = queue.pop(0)
        if item[1] == -1:
            stack.append(item[0])
        else:
            if item[1] == 1:
                num = int(stack.pop())
                num = - num
                stack.append(num)
            else:
                right = int(stack.pop())
                left = int(stack.pop())
                op = item[0]
                ret = None
                if op == '+':
                    ret = left+right 
                elif op == '-':
                    ret = left-right
                elif op == '*':
                    ret = left*right
                else:
                    ret = left/right
                stack.append(ret)
    return stack[0]


print(rpn(shuntingYard_v1(tokens)))
