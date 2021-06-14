export enum Token {
    Function,
    Var,
    Return,
    Equals,
    Literal,
    Identifier,
    Newline,
    Semicolon,
    Colon,
    Whitespace,
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
    Literal,
    Assignment,
    ExpressionStatement,
    Var
}
export type Error = {
    pos: number,
    message: string,
}
export interface Location {
    pos: number
}
export type Expression = Identifier | Literal | Assignment
export type Identifier = Location & {
    kind: Node.Identifier
    text: string
}
export type Literal = Location & {
    kind: Node.Literal
    value: number
}
export type Assignment = Location & {
    kind: Node.Assignment
    name: Identifier
    value: Expression
}
export type Statement = ExpressionStatement | Var
export type ExpressionStatement = Location & {
    kind: Node.ExpressionStatement
    expr: Expression
}
export type Var = Location & {
    kind: Node.Var
    name: Identifier
    typename?: Identifier | undefined
    init: Expression
}
export type Declaration = Var // plus others, like function, type, etc
export type Symbol = { declaration: Declaration }
export type Table = Map<string, Symbol>
export type Module = {
    locals: Table
    statements: Statement[]
}
export type Type = { id: string }
