export enum Token {
    Function,
    Var,
    Type,
    Return,
    Equals,
    NumericLiteral,
    StringLiteral,
    Identifier,
    Newline,
    Semicolon,
    Comma,
    Colon,
    Whitespace,
    OpenBrace,
    CloseBrace,
    Unknown,
    BOF,
    EOF,
}
export type Lexer = {
    scan(): void
    token(): Token
    pos(): number
    text(): string
}
export enum Node {
    Identifier,
    NumericLiteral,
    StringLiteral,
    Assignment,
    ExpressionStatement,
    Var,
    TypeAlias,
    Object,
    PropertyAssignment,
    ObjectType,
    PropertyDeclaration,
}
export type Error = {
    pos: number
    message: string
}
export interface Location {
    pos: number
}
export type Expression = Identifier | NumericLiteral | StringLiteral | Assignment | Object
export type Identifier = Location & {
    kind: Node.Identifier
    text: string
}
export type NumericLiteral = Location & {
    kind: Node.NumericLiteral
    value: number
}
export type StringLiteral = Location & {
    kind: Node.StringLiteral
    value: string
}
export type Object = Location & {
    kind: Node.Object
    properties: PropertyAssignment[]
    symbol: ObjectSymbol
}
export type PropertyAssignment = Location & {
    kind: Node.PropertyAssignment
    name: Identifier
    initializer: Expression
}
export type Assignment = Location & {
    kind: Node.Assignment
    name: Identifier
    value: Expression
}
export type Statement = ExpressionStatement | Var | TypeAlias
export type ExpressionStatement = Location & {
    kind: Node.ExpressionStatement
    expr: Expression
}
export type Var = Location & {
    kind: Node.Var
    name: Identifier
    typename?: Identifier | undefined
    init: Expression
    symbol: Symbol
}
export type TypeAlias = Location & {
    kind: Node.TypeAlias
    name: Identifier
    typename: Identifier
    symbol: Symbol
}
export type Declaration = Var | TypeAlias | Object | PropertyAssignment
export type Symbol = {
    valueDeclaration: Declaration | undefined
    declarations: Declaration[]
}
export type ObjectSymbol = Symbol & {
    members: Table
}
export enum Meaning {
    Value,
    Type,
}
export type Table = Map<string, Symbol>
export type Module = {
    locals: Table
    statements: Statement[]
}
export type SimpleType = { id: number }
export type ObjectType = SimpleType & {
    members: Table
}
export type Type = SimpleType | ObjectType
