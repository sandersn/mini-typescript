import * as fs from 'fs'
import { Error, Token, Node, Table } from './types.js'
import { lexAll } from './lex.js'
import { compile } from './compile.js'

const args = process.argv.slice(2);
const write = args.includes("--write")
const patterns = args.filter(a => !a.startsWith("--"))

const strong = (str: string) => console.log('\x1b[1m%s\x1b[0m', str);

function test(kind: string, name: string, value: unknown) {
    const reference = `baselines/reference/${name}.${kind}.baseline`
    const local = `baselines/local/${name}.${kind}.baseline`
    const actual = typeof value === 'string' ? value : JSON.stringify(value, undefined, 2)
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
    "stringLex": '"hello"',
    "braceLex": "{ x: 1, y: \"string\" }",
    "functionLex": "var f = function (x: number): number { return x }"
}
let lexResult = sum(Object.entries(lexTests)
    .filter(([name]) => patterns.length ? patterns.some(p => name.match(p)) : true)
    .map(([name, text]) =>
        test("lex", name, lexAll(text).map(t => t.text ? [Token[t.token], t.text] : [Token[t.token]]))))
let compileResult = sum(fs.readdirSync("tests")
    .filter(file => patterns.length ? patterns.some(p => file.match(p)) : true)
    .map(file => {
        const text = fs.readFileSync("tests/" + file, 'utf8')
        const [tree, errors, js] = compile(text)
        const name = file.slice(0, file.length - 3)
        return test("tree", name, display(tree))
            + test("errors", name, displayErrors(errors, text))
            + test("js", name, js)
}))
function displayErrors(errors: Error[], text: string) {
    return errors.map(e => ({ ...e, snippet: text.slice(e.pos - 10, e.pos) + "/*!!*/" + text.slice(e.pos, e.pos + 10) }))
}
function displayTable(table: Table) {
    const o = {} as any
    for (const [k,v] of table) {
        o[k] = v.declarations.map(({ kind, pos }) => ({ kind: Node[kind], pos }))
    }
    return o
}
function display(o: any) {
    const o2 = {} as any
    for (const k in o) {
        if (k === 'pos' || k === 'symbol' || k === 'parent') continue
        else if (k === 'kind') o2[k] = Node[o.kind]
        else if (k === 'locals') o2[k] = displayTable(o.locals)
        else if (Array.isArray(o[k])) o2[k] = o[k].map(display)
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
