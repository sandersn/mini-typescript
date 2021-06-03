import { Lexer, Token, Node, Statement, Identifier, Expression, Module } from './types'
export function parse(lexer: Lexer): [Module, string[]] {
    const errors: string[] = []
    lexer.scan()
    return [parseModule(), errors]

    function parseModule(): Module {
        const statements = parseSeparated(parseStatement, () => tryParseToken(Token.Semicolon))
        parseExpected(Token.EOF)
        return { statements, locals: new Map() }
    }
    function parseExpression(): Expression {
        const t = parseToken()
        switch (t) {
            case Token.Identifier:
                const name = { kind: Node.Identifier, text: lexer.text() } as const
                if (tryParseToken(Token.Equals)) {
                    return { kind: Node.Assignment, name, value: parseExpression() }
                }
                else {
                    return name
                }
            case Token.Literal:
                return { kind: Node.Literal, value: +lexer.text() }
            default:
                errors.push("Expected identifier or literal but got " + Token[t])
                return { kind: Node.Identifier, text: "(missing)" }
        }
    }
    function parseStatement(): Statement {
        if (tryParseToken(Token.Var)) {
            const name = parseIdentifier()
            const typename = tryParseToken(Token.Colon) ? parseIdentifier() : undefined
            parseExpected(Token.Equals)
            const init = parseExpression()
            return { kind: Node.Var, name, typename, init }
        }
        else {
            return { kind: Node.ExpressionStatement, expr: parseExpression() }
        }
    }
    function parseIdentifier(): Identifier {
        let text = lexer.text()
        const t = parseToken()
        if (t !== Token.Identifier) {
            errors.push("parseIdentifier: Expected Identifier but got " + Token[t])
            text = "(missing)"
        }
        return { kind: Node.Identifier, text }
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
        const actual = parseToken()
        if (actual !== expected) {
            errors.push(`parseToken: Expected ${Token[expected]} but got ${Token[actual]}`)
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
