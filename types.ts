export enum SyntaxKind {
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
    IntLiteral, // of text: string * value: int,
    Identifier, // of text: string,
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
    token(): SyntaxKind
    pos(): number
    text(): string
}
