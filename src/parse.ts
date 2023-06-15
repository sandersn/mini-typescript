import { Lexer, Token, SyntaxKind, Statement, Identifier, Expression, Module, PropertyAssignment, PropertyDeclaration, Object, ObjectLiteralType, Parameter, TypeNode } from './types.js'
import { error } from './error.js'
export function parse(lexer: Lexer): Module {
    lexer.scan()
    return parseModule()

    function parseModule(): Module {
        const statements = parseTerminated(parseStatement, Token.Semicolon, Token.EOF)
        return { kind: SyntaxKind.Module, statements, locals: new Map(), pos: 0, parent: undefined! }
    }
    function parseBlock(): Statement[] {
        parseExpected(Token.OpenBrace)
        const statements = parseTerminated(parseStatement, Token.Semicolon, Token.CloseBrace)
        return statements
    }
    function parseExpression(): Expression {
        const expression = parseExpressionBelowCall()
        if (tryParseToken(Token.OpenParen)) {
            return { kind: SyntaxKind.Call, expression, arguments: parseTerminated(parseExpression, Token.Comma, Token.CloseParen), pos: expression.pos, parent: undefined! }
        }
        return expression
    }
    function parseExpressionBelowCall(): Expression {
        const pos = lexer.pos()
        if (tryParseToken(Token.OpenBrace)) {
            const object = {
                kind: SyntaxKind.Object,
                properties: parseTerminated(parseProperty, Token.Comma, Token.CloseBrace),
                symbol: undefined!,
                pos,
                parent: undefined!,
            } as Object
            object.symbol = { valueDeclaration: object, declarations: [object], members: new Map() }
            return object
        }
        else if (tryParseToken(Token.Function)) {
            const name = lexer.token() === Token.Identifier ? parseIdentifier() : undefined
            parseExpected(Token.OpenParen)
            const parameters = parseTerminated(parseParameter, Token.Comma, Token.CloseParen)
            const typename = tryParseTypeAnnotation()
            const body = parseBlock()
            return { kind: SyntaxKind.Function, name, parameters, typename, body, locals: new Map(), pos, parent: undefined! }
        }
        const e = parseIdentifierOrLiteral()
        if (e.kind === SyntaxKind.Identifier && tryParseToken(Token.Equals)) {
            return { kind: SyntaxKind.Assignment, name: e, value: parseExpression(), pos, parent: undefined! }
        }
        return e
    }
    function parseParameter(): Parameter {
        const name = parseIdentifier()
        const typename = tryParseTypeAnnotation()
        return { kind: SyntaxKind.Parameter, name, typename, pos: name.pos, symbol: undefined!, parent: undefined! }
    }
    function tryParseTypeAnnotation(): TypeNode | undefined {
        if (tryParseToken(Token.Colon)) {
            return parseType()
        }
    }
    function parseType(): TypeNode {
        const pos = lexer.pos()
        if (tryParseToken(Token.OpenBrace)) {
            const object = {
                kind: SyntaxKind.ObjectLiteralType,
                properties: parseTerminated(parsePropertyDeclaration, Token.Comma, Token.CloseBrace),
                symbol: undefined!,
                pos,
                parent: undefined!,
            } as ObjectLiteralType
            object.symbol = { valueDeclaration: undefined, declarations: [object], members: new Map() }
            return object
        }
        return parseIdentifier()
    }
    function parseProperty(): PropertyAssignment {
        const name = parseIdentifierOrLiteral()
        if (name.kind !== SyntaxKind.Identifier) {
            throw new Error("Only identifiers are allowed as property names in deci-typescript")
        }
        parseExpected(Token.Colon)
        const initializer = parseExpression()
        return { kind: SyntaxKind.PropertyAssignment, name, initializer, pos: name.pos, symbol: undefined!, parent: undefined! }
    }
    function parsePropertyDeclaration(): PropertyDeclaration {
        const name = parseIdentifierOrLiteral()
        if (name.kind !== SyntaxKind.Identifier) {
            throw new Error("Only identifiers are allowed as property names in deci-typescript")
        }
        const typename = tryParseTypeAnnotation()
        return { kind: SyntaxKind.PropertyDeclaration, name, typename, pos: name.pos, symbol: undefined!, parent: undefined! }
    }
    function parseIdentifierOrLiteral(): Expression {
        const pos = lexer.pos()
        const token = lexer.token()
        const text = lexer.text()
        lexer.scan()
        switch (token) {
            case Token.Identifier:
                return { kind: SyntaxKind.Identifier, text, pos, parent: undefined! }
            case Token.NumericLiteral:
                return { kind: SyntaxKind.NumericLiteral, value: +text, pos, parent: undefined! }
            case Token.StringLiteral:
                return { kind: SyntaxKind.StringLiteral, value: text, pos, parent: undefined! }
            default:
                error(pos, "Expected identifier or literal but got " + Token[token] + " with text " + text)
                return { kind: SyntaxKind.Identifier, text: "(missing)", pos, parent: undefined! }
        }
    }
    function parseIdentifier(): Identifier {
        const e = parseIdentifierOrLiteral()
        if (e.kind === SyntaxKind.Identifier) {
            return e
        }
        error(e.pos, "Expected identifier but got a literal")
        return { kind: SyntaxKind.Identifier, text: "(missing)", pos: e.pos, parent: undefined! }
    }
    function parseStatement(): Statement {
        const pos = lexer.pos()
        switch (lexer.token()) {
            case Token.Var: {
                lexer.scan()
                const name = parseIdentifier()
                const typename = tryParseToken(Token.Colon) ? parseIdentifier() : undefined
                parseExpected(Token.Equals)
                const initializer = parseExpression()
                return { kind: SyntaxKind.Var, name, typename, initializer, pos, symbol: undefined!, parent: undefined! }
            }
            case Token.Type: {
                lexer.scan()
                const name = parseIdentifier()
                parseExpected(Token.Equals)
                const typename = parseIdentifier()
                return { kind: SyntaxKind.TypeAlias, name, typename, pos, symbol: undefined!, parent: undefined! }
            }
            case Token.Return: {
                lexer.scan()
                return { kind: SyntaxKind.Return, expression: parseExpression(), pos, parent: undefined! }
            }
            default:
                return { kind: SyntaxKind.ExpressionStatement, expression: parseExpression(), pos, parent: undefined! }
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
    function parseTerminated<T>(element: () => T, separator: Token, terminator: Token) {
        const list = []
        while (true) {
            if (tryParseToken(terminator)) {
                break
            }
            else {
                list.push(element())
                // You could parseExpected instead if you wanted to be annoying (or if the start of `element` is ambiguous with its end)
                tryParseToken(separator)
            }
        }
        return list
    }
}
