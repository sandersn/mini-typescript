import { Error, Module } from "./types.js"
import { errors } from './error.js'
import { lex } from "./lex.js"
import { parse } from "./parse.js"
import { bind } from "./bind.js"
import { check } from "./check.js"
import { transform } from "./transform.js"
import { emit } from "./emit.js"

export function compile(s: string): [Module, Error[], string] {
    errors.clear()
    const tree = parse(lex(s))
    bind(tree)
    check(tree)
    const js = emit(transform(tree.statements))
    return [tree, Array.from(errors.values()), js]
}
