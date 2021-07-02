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
        return e
    }
    function parseIdentifierOrLiteral(): Expression {
        const pos = lexer.pos()
        if (tryParseToken(Token.Identifier)) {
            return { kind: Node.Identifier, text: lexer.text(), pos }
        }
        else if (tryParseToken(Token.Literal)) {
            return { kind: Node.Literal, value: +lexer.text(), pos }
        }
        error(pos, "Expected identifier or literal but got " + Token[lexer.token()])
        lexer.scan()
        return { kind: Node.Identifier, text: "(missing)", pos }
    }
    function parseIdentifier(): Identifier {
        const e = parseIdentifierOrLiteral()
        if (e.kind === Node.Identifier) {
            return e
        }
        error(e.pos, "Expected identifier but got a literal")
        return { kind: Node.Identifier, text: "(missing)", pos: e.pos }
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
        return { kind: Node.ExpressionStatement, expr: parseExpression(), pos }
    }
    function tryParseToken(expected: Token) {
        const ok = lexer.token() === expected
        if (ok) {
            lexer.scan()
        }
        return ok
    }
    function parseExpected(expected: Token) {
        if (!tryParseToken(expected)) {
            error(lexer.pos(), `parseToken: Expected ${Token[expected]} but got ${Token[lexer.token()]}`)
        }
    }
    function parseSeparated<T>(element: () => T, separator: () => unknown) {
        const list = [element()]
        while (separator()) {
            list.push(element())
        }
        return list
    }
}