import { Statement, SyntaxKind, Expression, PropertyAssignment, Parameter, TypeNode } from './types.js'
export function emit(statements: Statement[]) {
    return statements.map(emitStatement).join(";\n")
}
function emitStatement(statement: Statement): string {
    switch (statement.kind) {
        case SyntaxKind.ExpressionStatement:
            return emitExpression(statement.expression)
        case SyntaxKind.Var:
            const typestring = statement.typename ? ": " + statement.name : ""
            return `var ${statement.name.text}${typestring} = ${emitExpression(statement.initializer)}`
        case SyntaxKind.TypeAlias:
            return `type ${statement.name.text} = ${emitType(statement.typename)}`
        case SyntaxKind.Return:
            return `return ${emitExpression(statement.expression)}`
    }
}
function emitType(type: TypeNode): string {
    switch (type.kind) {
        case SyntaxKind.Identifier:
            return type.text
        case SyntaxKind.ObjectLiteralType:
            return "not done yet!"
    }
}
function emitExpression(expression: Expression): string {
    switch (expression.kind) {
        case SyntaxKind.Identifier:
            return expression.text
        case SyntaxKind.NumericLiteral:
            return ""+expression.value
        case SyntaxKind.StringLiteral:
            return expression.value
        case SyntaxKind.Assignment:
            return `${expression.name.text} = ${emitExpression(expression.value)}`
        case SyntaxKind.Object:
            return `{ ${expression.properties.map(emitProperty).join(", ")} }`
        case SyntaxKind.Function:
            return `function ${expression.name ? expression.name.text : ""}(${expression.parameters.map(emitParameter).join(", ")}) {
    ${expression.body.map(emitStatement).join(";\n    ")}
}`
        case SyntaxKind.Call:
            return `${emitExpression(expression.expression)}(${expression.arguments.map(emitExpression).join(", ")})`
    }
}
function emitProperty(property: PropertyAssignment): string {
    return `${property.name.text}: ${emitExpression(property.initializer)}`
}
function emitParameter(parameter: Parameter): string {
    if (parameter.typename) {
        return `${parameter.name.text}: ${emitType(parameter.typename)}`
    }
    return parameter.name.text
}
