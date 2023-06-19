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
    Arrow,
    Whitespace,
    OpenBrace,
    CloseBrace,
    OpenParen,
    CloseParen,
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
export enum SyntaxKind {
    Module,
    Identifier,
    NumericLiteral,
    StringLiteral,
    Assignment,
    ExpressionStatement,
    Var,
    TypeAlias,
    Object,
    PropertyAssignment,
    ObjectLiteralType,
    PropertyDeclaration,
    Function,
    Signature,
    Parameter,
    Return,
    Call,
}
export type Error = {
    pos: number
    message: string
}
export interface Location {
    parent: Node
    pos: number
}
export type Expression = Identifier | NumericLiteral | StringLiteral | Assignment | Object | Function | Call
export type Statement = Var | TypeAlias | ExpressionStatement | Return
export type TypeNode = ObjectLiteralType | Identifier | SignatureDeclaration
export type Declaration = Var | TypeAlias | ObjectLiteralType | Object | Parameter | PropertyAssignment | PropertyDeclaration
export type Container = Module | Function
export type Node = Expression | Statement | Declaration | Module | TypeNode
export type Identifier = Location & {
    kind: SyntaxKind.Identifier
    text: string
}
export type NumericLiteral = Location & {
    kind: SyntaxKind.NumericLiteral
    value: number
}
export type StringLiteral = Location & {
    kind: SyntaxKind.StringLiteral
    value: string
}
export type ObjectLiteralType = Location & {
    kind: SyntaxKind.ObjectLiteralType
    properties: PropertyDeclaration[]
    symbol: ObjectSymbol
}
export type Object = Location & {
    kind: SyntaxKind.Object
    properties: PropertyAssignment[]
    symbol: ObjectSymbol
}
export type PropertyAssignment = Location & {
    kind: SyntaxKind.PropertyAssignment
    name: Identifier
    initializer: Expression
    symbol: Symbol
}
export type PropertyDeclaration = Location & {
    kind: SyntaxKind.PropertyDeclaration
    name: Identifier
    typename?: TypeNode
    symbol: Symbol
}
export type Assignment = Location & {
    kind: SyntaxKind.Assignment
    name: Identifier
    value: Expression
}
export type Function = Location & {
    kind: SyntaxKind.Function
    name?: Identifier
    parameters: Parameter[]
    typename?: TypeNode
    body: Statement[] // TODO: Maybe need to be Block
    locals: Table
}
export type SignatureDeclaration = Location & {
    kind: SyntaxKind.Signature
    parameters: Parameter[]
    typename: TypeNode
    locals: Table
}
export type Parameter = Location & {
    kind: SyntaxKind.Parameter
    name: Identifier
    typename?: TypeNode
    symbol: Symbol
}
export type ExpressionStatement = Location & {
    kind: SyntaxKind.ExpressionStatement
    expression: Expression
}
export type Var = Location & {
    kind: SyntaxKind.Var
    name: Identifier
    typename?: TypeNode
    initializer: Expression
    symbol: Symbol
}
export type TypeAlias = Location & {
    kind: SyntaxKind.TypeAlias
    name: Identifier
    typename: TypeNode
    symbol: Symbol
}
export type Return = Location & {
    kind: SyntaxKind.Return
    expression: Expression
}
export type Call = Location & {
    kind: SyntaxKind.Call
    expression: Expression
    // TODO: typeArguments, eventually
    arguments: Expression[]
}

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
export type Module = Location & {
    kind: SyntaxKind.Module
    locals: Table
    statements: Statement[]
}
export type SimpleType = { id: number }
export type PrimitiveType = SimpleType & {
    kind: Kind.Primitive
}
export enum Kind {
    Primitive,
    Object,
    Function,
}
export type ObjectType = SimpleType & {
    kind: Kind.Object
    members: Table
}
export type FunctionType = SimpleType & {
    kind: Kind.Function
    signature: Signature
}
export type Signature = {
    parameters: Symbol[]
    returnType: Type
}
export type Type = PrimitiveType | ObjectType | FunctionType
