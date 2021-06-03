import { lex } from "./lex";
import { parse } from "./parse";
import { bind } from "./bind";
import { Module } from "./types";

export function compile(s: string): [Module, string[]] {
    const [tree, parseErrors] = parse(lex(s))
    const bindErrors = bind(tree)
    return [tree, [...parseErrors, ...bindErrors]]
}
