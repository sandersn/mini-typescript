import { Lexer, Token, Node, Statement, Identifier, Expression, Module, PropertyAssignment, Var, TypeAlias, Object } from './types.js'
import { error } from './error.js'
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
        if (tryParseToken(Token.OpenBrace)) {
            const object = {
                kind: Node.Object,
                properties: parseSeparated(parseProperty, () => tryParseToken(Token.Comma)),
                symbol: undefined!,
                pos
            } as Object
            parseExpected(Token.CloseBrace)
            object.symbol = { valueDeclaration: object, declarations: [object], members: new Map() }
            return object
        }
        const e = parseIdentifierOrLiteral()
        if (e.kind === Node.Identifier && tryParseToken(Token.Equals)) {
            return { kind: Node.Assignment, name: e, value: parseExpression(), pos }
        }
        return e
    }
    function parseProperty(): PropertyAssignment {
        const pos = lexer.pos()
        const name = parseIdentifierOrLiteral()
        if (name.kind !== Node.Identifier) {
            throw new Error("Only identifiers are allowed as property names in deci-typescript")
        }
        parseExpected(Token.Colon)
        const initializer = parseExpression()
        return { kind: Node.PropertyAssignment, name, initializer , pos }
    }
    function parseIdentifierOrLiteral(): Expression {
        const pos = lexer.pos()
        const token = lexer.token()
        const text = lexer.text()
        lexer.scan()
        switch (token) {
            case Token.Identifier:
                return { kind: Node.Identifier, text, pos }
            case Token.NumericLiteral:
                return { kind: Node.NumericLiteral, value: +text, pos }
            case Token.StringLiteral:
                return { kind: Node.StringLiteral, value: text, pos }
            default:
                error(pos, "Expected identifier or literal but got " + Token[token] + " with text " + text)
                return { kind: Node.Identifier, text: "(missing)", pos }
        }
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
        switch (lexer.token()) {
            case Token.Var: {
                lexer.scan()
                const name = parseIdentifier()
                const typename = tryParseToken(Token.Colon) ? parseIdentifier() : undefined
                parseExpected(Token.Equals)
                const init = parseExpression()
                const v = { kind: Node.Var, name, typename, init, pos } as Var
                v.symbol = { valueDeclaration: v, declarations: [v] }
                return v
            }
            case Token.Type: {
                lexer.scan()
                const name = parseIdentifier()
                parseExpected(Token.Equals)
                const typename = parseIdentifier()
                const t = { kind: Node.TypeAlias, name, typename, pos } as TypeAlias
                t.symbol = { valueDeclaration: undefined, declarations: [t] }
                return t
            }
            default:
                return { kind: Node.ExpressionStatement, expr: parseExpression(), pos }
        }
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
