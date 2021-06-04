import { lex } from "./lex";
import { parse } from "./parse";
import { bind } from "./bind";
import { Module } from "./types";
import { check } from "./check";

export function compile(s: string): [Module, string[]] {
    const [tree, parseErrors] = parse(lex(s))
    const bindErrors = bind(tree)
    const checkErrors = check(tree)
    return [tree, [...parseErrors, ...bindErrors, ...checkErrors]]
}
