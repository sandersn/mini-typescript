import { Statement, Node, Expression, PropertyAssignment, Parameter } from './types.js'
export function emit(statements: Statement[]) {
    return statements.map(emitStatement).join(";\n")
}
function emitStatement(statement: Statement): string {
    switch (statement.kind) {
        case Node.ExpressionStatement:
            return emitExpression(statement.expr)
        case Node.Var:
            const typestring = statement.typename ? ": " + statement.name : ""
            return `var ${statement.name.text}${typestring} = ${emitExpression(statement.init)}`
        case Node.TypeAlias:
            return `type ${statement.name.text} = ${statement.typename.text}`
        case Node.Return:
            return `return ${emitExpression(statement.expr)}`
    }
}
function emitExpression(expression: Expression): string {
    switch (expression.kind) {
        case Node.Identifier:
            return expression.text
        case Node.NumericLiteral:
            return ""+expression.value
        case Node.StringLiteral:
            return expression.value
        case Node.Assignment:
            return `${expression.name.text} = ${emitExpression(expression.value)}`
        case Node.Object:
            return `{${expression.properties.map(emitProperty).join(", ")}}`
        case Node.Function:
            return `function ${expression.name ? expression.name.text : ""}(${expression.parameters.map(emitParameter).join(", ")}) {
    ${expression.body.map(emitStatement).join(";\n    ")}
}`
    }
}
function emitProperty(property: PropertyAssignment): string {
    return `${property.name.text}: ${emitExpression(property.initializer)}`
}
function emitParameter(parameter: Parameter): string {
    if (parameter.typename) {
        return `${parameter.name.text}: ${parameter.typename.text}`
    }
    return parameter.name.text
}
