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
export enum Node {
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
    ObjectType,
    PropertyDeclaration,
    Function,
    Parameter,
    Return,
    Call,
}
export type Error = {
    pos: number
    message: string
}
export interface Location {
    parent: AllNodes
    pos: number
}
export type Expression = Identifier | NumericLiteral | StringLiteral | Assignment | Object | Function
export type Statement = Var | TypeAlias | ExpressionStatement | Return
export type Declaration = Var | TypeAlias | Object | Parameter | PropertyAssignment
export type Container = Module | Function
export type AllNodes = Expression | Statement | Declaration | Module
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
    symbol: Symbol
}
export type Assignment = Location & {
    kind: Node.Assignment
    name: Identifier
    value: Expression
}
export type Function = Location & {
    kind: Node.Function
    name?: Identifier
    parameters: Parameter[]
    typename?: Identifier | undefined // TODO: This needs to be more complex
    body: Statement[] // TODO: Maybe need to be Block
    locals: Table
}
export type Parameter = Location & {
    kind: Node.Parameter
    name: Identifier
    typename?: Identifier // TODO: This needs to be more complex
    symbol: Symbol
}
export type ExpressionStatement = Location & {
    kind: Node.ExpressionStatement
    expression: Expression
}
export type Var = Location & {
    kind: Node.Var
    name: Identifier
    typename?: Identifier | undefined // TODO: This needs to be more complex
    initializer: Expression
    symbol: Symbol
}
export type TypeAlias = Location & {
    kind: Node.TypeAlias
    name: Identifier
    typename: Identifier // TODO: This needs to be more complex
    symbol: Symbol
}
export type Return = Location & {
    kind: Node.Return
    expression: Expression
}
export type Call = Location & {
    kind: Node.Call
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
    kind: Node.Module
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
