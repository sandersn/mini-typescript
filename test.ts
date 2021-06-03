import * as fs from 'fs'
import { Token } from './types'
import { lexAll } from './lex'
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
    "functionLex": "function f (x) { return x }",
    "ifLex": "if (f(x)) y else { z }",
    "semicolonLex": "x; y",
    "newlineLex": "x\n y  \n" ,
}
function displayLex(token: { token: Token, text?: string }) {
    if (token.text)
        return [Token[token.token], token.text]
    else
        return [Token[token.token]]
}
let result = sum(Object.entries(lexTests).map(
    ([name, text]) => test("lex", name, lexAll(text).map(displayLex))))
if (result === 0) {
    console.log("All tests passed")
}
else {
    console.log(result, "tests failed.")
}
process.exit(result)
