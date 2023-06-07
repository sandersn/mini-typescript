import { Lexer, Token, Node, Statement, Identifier, Expression, Module, PropertyAssignment, Object, Parameter } from './types.js'
import { error } from './error.js'
export function parse(lexer: Lexer): Module {
    lexer.scan()
    return parseModule()

    function parseModule(): Module {
        const statements = parseSeparated(parseStatement, () => tryParseToken(Token.Semicolon))
        parseExpected(Token.EOF)
        return { kind: Node.Module, statements, locals: new Map(), pos: 0, parent: undefined! }
    }
    function parseBlock(): Statement[] {
        parseExpected(Token.OpenBrace)
        const statements = parseSeparated(parseStatement, () => tryParseToken(Token.Semicolon))
        parseExpected(Token.CloseBrace)
        return statements
    }
    function parseExpression(): Expression {
        const pos = lexer.pos()
        if (tryParseToken(Token.OpenBrace)) {
            const object = {
                kind: Node.Object,
                properties: parseSeparated(parseProperty, () => tryParseToken(Token.Comma)),
                symbol: undefined!,
                pos,
                parent: undefined!,
            } as Object
            parseExpected(Token.CloseBrace)
            object.symbol = { valueDeclaration: object, declarations: [object], members: new Map() }
            return object
        }
        else if (tryParseToken(Token.Function)) {
            const name = lexer.token() === Token.Identifier ? parseIdentifier() : undefined
            parseExpected(Token.OpenParen)
            const parameters = parseSeparated(parseParameter, () => tryParseToken(Token.Comma))
            parseExpected(Token.CloseParen)
            const typename = tryParseTypeAnnotation()
            const body = parseBlock()
            return { kind: Node.Function, name, parameters, typename, body, locals: new Map(), pos, parent: undefined! }
        }
        const e = parseIdentifierOrLiteral()
        if (e.kind === Node.Identifier && tryParseToken(Token.Equals)) {
            return { kind: Node.Assignment, name: e, value: parseExpression(), pos, parent: undefined! }
        }
        return e
    }
    function parseParameter(): Parameter {
        const name = parseIdentifier()
        const typename = tryParseTypeAnnotation()
        return { kind: Node.Parameter, name, typename, pos: name.pos, symbol: undefined!, parent: undefined! }
    }
    // TODO: Needs to return a real Type node
    function tryParseTypeAnnotation(): Identifier | undefined {
        if (tryParseToken(Token.Colon)) {
            return parseIdentifier()
        }
    }
    function parseProperty(): PropertyAssignment {
        const name = parseIdentifierOrLiteral()
        if (name.kind !== Node.Identifier) {
            throw new Error("Only identifiers are allowed as property names in deci-typescript")
        }
        parseExpected(Token.Colon)
        const initializer = parseExpression()
        return { kind: Node.PropertyAssignment, name, initializer, pos: name.pos, symbol: undefined!, parent: undefined! }
    }
    function parseIdentifierOrLiteral(): Expression {
        const pos = lexer.pos()
        const token = lexer.token()
        const text = lexer.text()
        lexer.scan()
        switch (token) {
            case Token.Identifier:
                return { kind: Node.Identifier, text, pos, parent: undefined! }
            case Token.NumericLiteral:
                return { kind: Node.NumericLiteral, value: +text, pos, parent: undefined! }
            case Token.StringLiteral:
                return { kind: Node.StringLiteral, value: text, pos, parent: undefined! }
            default:
                error(pos, "Expected identifier or literal but got " + Token[token] + " with text " + text)
                return { kind: Node.Identifier, text: "(missing)", pos, parent: undefined! }
        }
    }
    function parseIdentifier(): Identifier {
        const e = parseIdentifierOrLiteral()
        if (e.kind === Node.Identifier) {
            return e
        }
        error(e.pos, "Expected identifier but got a literal")
        return { kind: Node.Identifier, text: "(missing)", pos: e.pos, parent: undefined! }
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
                return { kind: Node.Var, name, typename, init, pos, symbol: undefined!, parent: undefined! }
            }
            case Token.Type: {
                lexer.scan()
                const name = parseIdentifier()
                parseExpected(Token.Equals)
                const typename = parseIdentifier()
                return { kind: Node.TypeAlias, name, typename, pos, symbol: undefined!, parent: undefined! }
            }
            case Token.Return: {
                lexer.scan()
                return { kind: Node.Return, expr: parseExpression(), pos, parent: undefined! }
            }
            default:
                return { kind: Node.ExpressionStatement, expr: parseExpression(), pos, parent: undefined! }
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
