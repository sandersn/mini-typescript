import * as fs from 'fs'
import { Module, Statement, Token, Node, Identifier, Expression, Table } from './types'
import { lexAll } from './lex'
import { compile } from './compile'
function test(kind: string, name: string, value: unknown) {
    const reference = `baselines/reference/${name}.${kind}.baseline`
    const local = `baselines/local/${name}.${kind}.baseline`
    const actual = JSON.stringify(value, undefined, 2)
    const expected = fs.existsSync(reference) ? fs.readFileSync(reference, "utf8") : ""
    if (actual !== expected) {
        fs.writeFileSync(local, actual)
        return 1
    }
    return 0
}
function sum(ns: number[]) {
    let total = 0
    for (const n of ns) total += n
    return total
}
const lexTests = {
    "basicLex": "x",
    "firstLex": " 1200Hello    World1! 14d",
    "underscoreLex": "x_y is _aSingle Identifier_",
    "varLex": "var x = 1",
    "semicolonLex": "x; y",
    "newlineLex": "x\n y  \n" ,
}
function displayLex(token: { token: Token, text?: string }) {
    if (token.text)
        return [Token[token.token], token.text]
    else
        return [Token[token.token]]
}
function displayModule(m: Module) {
    return [displayTable(m.locals), m.statements.map(displayStatement)]
}
function displayTable(locals: Table) {
    let o = {} as any
    for (const [k,v] of locals) {
        o[k] = { kind: Node[v.declaration.kind], pos: v.declaration.pos, }
    }
    return o
}
function displayStatement(s: Statement) {
    switch (s.kind) {
        case Node.ExpressionStatement:
            return { kind: Node[Node.ExpressionStatement], expr: displayExpression(s.expr) }
        case Node.Var:
            return {
                kind: Node[Node.Var],
                name: displayIdentifier(s.name),
                typename: s.typename ? displayIdentifier(s.typename) : undefined,
                init: displayExpression(s.init)
            }
    }
}
function displayExpression(e: Expression): object {
    switch (e.kind) {
        case Node.Identifier:
            return { kind: Node[Node.Identifier], text: e.text }
        case Node.Literal:
            return { kind: Node[Node.Literal], value: e.value }
        case Node.Assignment:
            return {
                kind: Node[Node.Assignment],
                name: displayIdentifier(e.name),
                value: displayExpression(e.value)
            }
    }
}
function displayIdentifier(id: Identifier) {
    return { kind: Node[Node.Identifier], text: id.text }
}
let lexResult = sum(Object.entries(lexTests).map(
    ([name, text]) => test("lex", name, lexAll(text).map(displayLex))))
let compileResult = sum(fs.readdirSync("tests").map(file => {
    const [tree, errors, js] = compile(fs.readFileSync("tests/" + file, 'utf8'))
    const name = file.slice(0, file.length - 3)
    return test("tree", name, displayModule(tree))
        + test("errors", name, errors)
        + test("js", name, js)
}))
let result = lexResult + compileResult
if (result === 0) {
    console.log("All tests passed")
}
else {
    console.log(result, "tests failed.")
}
process.exit(result)
