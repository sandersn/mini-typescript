import { Lexer, Token, Node, Statement, Identifier, Expression, Module } from './types'
import { error } from './error'
export function parse(lexer: Lexer): Module {
    lexer.scan()
    return parseModule()

    function parseModule(): Module {
        const statements = parseSeparated(parseStatement, () => tryParseToken(Token.Semicolon))
        parseExpected(Token.EOF)
        return { statements, locals: new Map() }
    }
    function parseExpression(): Expression {
        const pos = lexer.pos()
        const e = parseIdentifierOrLiteral()
        if (e.kind === Node.Identifier && tryParseToken(Token.Equals)) {
            return { kind: Node.Assignment, name: e, value: parseExpression(), pos }
        }
        else {
            return e
        }
    }
    function parseIdentifierOrLiteral(): Expression {
        const pos = lexer.pos()
        const t = parseToken()
        switch (t) {
            case Token.Identifier:
                return { kind: Node.Identifier, text: lexer.text(), pos }
            case Token.Literal:
                return { kind: Node.Literal, value: +lexer.text(), pos }
            default:
                error(pos, "Expected identifier or literal but got " + Token[t])
                return { kind: Node.Identifier, text: "(missing)", pos }
        }
    }
    function parseIdentifier(): Identifier {
        const pos = lexer.pos()
        let text = lexer.text()
        if (!parseExpected(Token.Identifier)) {
            text = "(missing)"
        }
        return { kind: Node.Identifier, text, pos }
    }
    function parseStatement(): Statement {
        const pos = lexer.pos()
        if (tryParseToken(Token.Var)) {
            const name = parseIdentifier()
            const typename = tryParseToken(Token.Colon) ? parseIdentifier() : undefined
            parseExpected(Token.Equals)
            const init = parseExpression()
            return { kind: Node.Var, name, typename, init, pos }
        }
        else {
            return { kind: Node.ExpressionStatement, expr: parseExpression(), pos }
        }
    }

    function parseToken() {
        const t = lexer.token()
        lexer.scan()
        return t
    }
    function tryParseToken(token: Token) {
        if (lexer.token() === token) {
            lexer.scan()
            return true
        }
        else {
            return false
        }
    }
    function parseExpected(expected: Token) {
        const pos = lexer.pos()
        const actual = parseToken()
        if (actual !== expected) {
            error(pos, `parseToken: Expected ${Token[expected]} but got ${Token[actual]}`)
        }
        return actual === expected
    }
    function parseSeparated<T>(element: () => T, separator: () => unknown) {
        const list = [element()]
        while (separator()) {
            list.push(element())
        }
        return list
    }
}