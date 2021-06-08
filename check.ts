import { Module, Statement, Type, Node, Expression, Identifier } from './types'
import { error } from './error'
import { resolve } from './bind'
const stringType: Type = { id: "string" }
const numberType: Type = { id: "number" }
const errorType: Type = { id: "error" }
function typeToString(type: Type) {
    return type.id
}
export function check(module: Module) {
    return module.statements.map(checkStatement)

    function checkStatement(statement: Statement): Type {
        switch (statement.kind) {
            case Node.ExpressionStatement:
                return checkExpression(statement.expr)
            case Node.Var:
                const i = checkExpression(statement.init)
                if (!statement.typename) {
                    return i
                }
                const t = checkType(statement.typename)
                if (t !== i)
                    error(statement.init.pos, `Cannot assign initialiser of type '${typeToString(i)}' to variable with declared type '${typeToString(t)}'.`)
                return t
        }
    }
    function checkExpression(expression: Expression): Type {
        switch (expression.kind) {
            case Node.Identifier:
                const symbol = resolve(module.locals, expression.text)
                if (symbol) {
                    return checkStatement(symbol.declaration)
                }
                error(expression.pos, "Could not resolve " + expression.text)
                return errorType
            case Node.Literal:
                return typeof expression.value === 'string' ? stringType : numberType
            case Node.Assignment:
                const v = checkExpression(expression.value)
                const t = checkExpression(expression.name)
                if (t !== v)
                    error(expression.value.pos, `Cannot assign value of type '${typeToString(v)}' to variable of type '${typeToString(t)}'.`)
                return t
        }
    }
    function checkType(name: Identifier): Type {
        switch (name.text) {
            case "string":
                return stringType
            case "number":
                return numberType
            default:
                error(name.pos, "Could not resolve type " + name.text)
                return errorType
        }
    }
}
