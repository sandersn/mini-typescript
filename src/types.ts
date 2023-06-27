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
    LessThan,
    GreaterThan,
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
    TypeParameter,
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
export type Declaration = Var | TypeAlias | ObjectLiteralType | Object | Parameter | TypeParameter | PropertyAssignment | PropertyDeclaration | Function | SignatureDeclaration
export type DeclarationBase = {
    symbol: Symbol
}
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
export type ObjectLiteralType = Location & DeclarationBase & {
    kind: SyntaxKind.ObjectLiteralType
    properties: PropertyDeclaration[]
    symbol: ObjectSymbol
}
export type Object = Location & DeclarationBase & {
    kind: SyntaxKind.Object
    properties: PropertyAssignment[]
    symbol: ObjectSymbol
}
export type PropertyAssignment = Location & DeclarationBase & {
    kind: SyntaxKind.PropertyAssignment
    name: Identifier
    initializer: Expression
}
export type PropertyDeclaration = Location & DeclarationBase & {
    kind: SyntaxKind.PropertyDeclaration
    name: Identifier
    typename?: TypeNode
}
export type Assignment = Location & {
    kind: SyntaxKind.Assignment
    name: Identifier
    value: Expression
}
export type Function = Location & DeclarationBase & {
    kind: SyntaxKind.Function
    name?: Identifier
    typeParameters?: TypeParameter[]
    parameters: Parameter[]
    typename?: TypeNode
    body: Statement[] // TODO: Maybe needs to be Block
    locals: Table
}
export type SignatureDeclaration = Location & DeclarationBase & {
    kind: SyntaxKind.Signature
    typeParameters?: TypeParameter[]
    parameters: Parameter[]
    typename: TypeNode
    locals: Table
}
export type TypeParameter = Location & DeclarationBase & {
    kind: SyntaxKind.TypeParameter
    name: Identifier
}
export type Parameter = Location & DeclarationBase & {
    kind: SyntaxKind.Parameter
    name: Identifier
    typename?: TypeNode
}
export type ExpressionStatement = Location & {
    kind: SyntaxKind.ExpressionStatement
    expression: Expression
}
export type Var = Location & DeclarationBase & {
    kind: SyntaxKind.Var
    name: Identifier
    typename?: TypeNode
    initializer: Expression
}
export type TypeAlias = Location & DeclarationBase & {
    kind: SyntaxKind.TypeAlias
    name: Identifier
    typename: TypeNode
}
export type Return = Location & {
    kind: SyntaxKind.Return
    expression: Expression
}
export type Call = Location & {
    kind: SyntaxKind.Call
    expression: Expression
    typeArguments?: TypeNode[]
    arguments: Expression[]
}

export type Symbol = {
    valueDeclaration: Declaration | undefined
    declarations: Declaration[]
    valueType?: Type
    typeType?: Type
}
// TODO: SymbolFlags to distinguish Object and Instantiated symbols
export type ObjectSymbol = Symbol & {
    members: Table
}
export type InstantiatedSymbol = Symbol & {
    target: Symbol
    mapper: Mapper
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
    TypeVariable,
}
// TODO: Having separate Object/Function types is way easier, but it's NOT like TS does it, because JS allows properties and signatures on the same objects.
export type ObjectType = SimpleType & {
    kind: Kind.Object
    members: Table
}
export type FunctionType = SimpleType & {
    kind: Kind.Function
    signature: Signature
}
export type TypeVariable = SimpleType & {
    name: string // it's nominal babyyyyyyyyyyy (TODO: Not needed in Typescript because types optionally have a symbol)
    kind: Kind.TypeVariable
}
export type Signature = {
    typeParameters?: Symbol[]
    target?: Signature
    mapper?: Mapper
    // TODO: Maybe need instantiations?: Map<string, Signature> too? It's technically caching I think, and I'm not doing that yet
    parameters: Symbol[]
    returnType: Type
}
export type Type = PrimitiveType | ObjectType | FunctionType | TypeVariable
export type Mapper = { sources: TypeVariable[], targets: Type[] }
