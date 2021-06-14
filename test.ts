import * as fs from 'fs'
import { Module, Statement, Token, Node, Identifier, Expression, Table } from './types'
import { lexAll } from './lex'
import { compile } from './compile'

const args = process.argv.slice(2);
const write = args.includes("--write")

const strong = (str: string) => console.log('\x1b[1m%s\x1b[0m', str);

function test(kind: string, name: string, value: unknown) {
    const reference = `baselines/reference/${name}.${kind}.baseline`
    const local = `baselines/local/${name}.${kind}.baseline`
    const actual = JSON.stringify(value, undefined, 2)
    const expected = fs.existsSync(reference) ? fs.readFileSync(reference, "utf8") : ""
    if (actual !== expected) {
        if (!fs.existsSync("./baselines/local")) fs.mkdirSync("./baselines/local")
        fs.writeFileSync(local, actual)

        strong(`${name} failed: Expected baselines to match`)
        if (actual && expected) {
            console.log(` - result   - ${local}`)
            console.log(` - expected - ${reference}`)
            console.log(` - run: diff ${local} ${reference}`)
        } else if (actual && !expected) {
            console.log(` - result   - ${local}`)
            console.log(` - missing  - ${reference}`)
            if (!write) {
                console.log(` - run with '--write' to update the baselines`)
            } else {
                console.log(` - updated baselines`)
                fs.writeFileSync(reference, actual)
            }
        }
        console.log(``)
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
let lexResult = sum(Object.entries(lexTests).map(
    ([name, text]) => test("lex", name, lexAll(text).map(t => t.text ? [Token[t.token], t.text] : [Token[t.token]]))))
let compileResult = sum(fs.readdirSync("tests").map(file => {
    const [tree, errors, js] = compile(fs.readFileSync("tests/" + file, 'utf8'))
    const name = file.slice(0, file.length - 3)
    return test("tree", name, displayModule(tree))
        + test("errors", name, errors)
        + test("js", name, js)
}))
function displayModule(m: Module) {
    return { locals: displayTable(m.locals), statements: m.statements.map(display) }
}
function displayTable(table: Table) {
    const o = {} as any
    for (const [k,v] of table) {
        o[k] = { kind: Node[v.declaration.kind], pos: v.declaration.pos, }
    }
    return o
}
function display(o: any) {
    const o2 = {} as any
    for (const k in o) {
        if (k === 'pos') continue
        else if (k === 'kind') o2[k] = Node[o.kind]
        else if (typeof o[k] === 'object') o2[k] = display(o[k])
        else o2[k] = o[k]
    }
    return o2
}

let result = lexResult + compileResult
if (result === 0) {
    strong("All tests passed")
}
else {
    console.log(result, "tests failed.")
}
console.log("")
process.exit(result)
