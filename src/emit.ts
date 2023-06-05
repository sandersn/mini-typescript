import { Statement, Node, Expression } from './types'
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
    }
}

