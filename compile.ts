import { lex } from "./lex";
import { parse } from "./parse";
import { bind } from "./bind";
import { Module } from "./types";
import { check } from "./check";
import { transform } from "./transform";
import { emit } from "./emit";

export function compile(s: string): [Module, string[], string] {
    const [tree, parseErrors] = parse(lex(s))
    const bindErrors = bind(tree)
    const checkErrors = check(tree)
    const js = emit(transform(tree.statements))
    return [tree, [...parseErrors, ...bindErrors, ...checkErrors], js]
}
