import { Module, Statement, Type, Node, Expression, Identifier } from './types'
import { resolve } from './bind'
const stringType: Type = { id: "string" }
const numberType: Type = { id: "number" }
const errorType: Type = { id: "error" }
function typeToString(type: Type) {
    return type.id
}
export function check(module: Module) {
    return module.statements.flatMap(st => checkStatement(st)[1])
    function checkStatement(statement: Statement): [Type, string[]] {
        switch (statement.kind) {
            case Node.ExpressionStatement:
                return checkExpression(statement.expr)
            case Node.Var:
                const [i, e] = checkExpression(statement.init)
                if (!statement.typename) {
                    return [i, e]
                }
                const [t, e2] = checkType(statement.typename)
                const error = t === i
                    ? []
                    : [`Cannot assign initialiser of type ${typeToString(i)} to variable with declared type '%{typeToString(t)'.`]
                return [t, [...e, ...e2, ...error]]
        }
    }
    function checkExpression(expression: Expression): [Type, string[]] {
        switch (expression.kind) {
            case Node.Identifier:
                const symbol = resolve(module.locals, expression.text)
                if (symbol) {
                    return checkStatement(symbol.declaration)
                }
                return [errorType, ["Could not resolve " + expression.text]]
            case Node.Literal:
                return [numberType, []]
            case Node.Assignment:
                const [v, e] = checkExpression(expression.value)
                const [n] = checkExpression(expression.name)
                const error = v === n
                    ? []
                    : [`Cannot assign initialiser of type ${typeToString(n)} to variable of type '%{typeToString(v)'.`]
                return [n, [...e, ...error]]
        }
    }
    function checkType(name: Identifier): [Type, string[]] {
        switch (name.text) {
            case "string":
                return [stringType, []]
            case "number":
                return [numberType, []]
            default:
                return [errorType, ["Could not resolve type " + name]]
        }
    }
}
