import { lex } from "./lex";
import { parse } from "./parse";
import { Module } from "./types";

export function compile(s: string): [Module, string[]] {
    const [tree, parseErrors] = parse(lex(s))
    return [tree, parseErrors]
}
