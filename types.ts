export enum Token {
    Function,
    Var,
    If,
    Else,
    Return,
    LeftBrace,
    RightBrace,
    LeftParen,
    RightParen,
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
export type Expression = Identifier | Literal | Assignment
export type Identifier = {
    kind: Node.Identifier
    text: string
}
export type Literal = {
    kind: Node.Literal
    value: number
}
export type Assignment = {
    kind: Node.Assignment
    name: Identifier
    value: Expression
}
export type Statement = ExpressionStatement | Var
export type ExpressionStatement = {
    kind: Node.ExpressionStatement
    expr: Expression
}
export type Var = {
    kind: Node.Var
    name: Identifier
    typename?: Identifier | undefined
    init: Expression
}
export type Declaration = Var // plus others, like function, type, etc

export type Module = {
    env?: Map<Identifier, Var>
    statements: Statement[]
}
