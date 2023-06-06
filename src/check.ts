import { Module, Statement, Type, Symbol, Node, Expression, Declaration, Identifier, TypeAlias, Object, PropertyAssignment, ObjectType, Table, Meaning } from './types.js'
import { error } from './error.js'
import { resolve } from './bind.js'
let typeCount = 0
const stringType: Type = { id: typeCount++ }
const numberType: Type = { id: typeCount++ }
const errorType: Type = { id: typeCount++ }
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
                if (t !== i && t !== errorType)
                    error(statement.init.pos, `Cannot assign initialiser of type '${typeToString(i)}' to variable with declared type '${typeToString(t)}'.`)
                return t
            case Node.TypeAlias:
                return checkType(statement.typename)
        }
    }
    function checkExpression(expression: Expression): Type {
        switch (expression.kind) {
            case Node.Identifier:
                const symbol = resolve(module.locals, expression.text, Meaning.Value)
                if (symbol) {
                    return getValueTypeOfSymbol(symbol)
                }
                error(expression.pos, "Could not resolve " + expression.text)
                return errorType
            case Node.NumericLiteral:
                return numberType
            case Node.StringLiteral:
                return stringType
            case Node.Object:
                return checkObject(expression)
            case Node.Assignment:
                const v = checkExpression(expression.value)
                const t = checkExpression(expression.name)
                if (t !== v)
                    error(expression.value.pos, `Cannot assign value of type '${typeToString(v)}' to variable of type '${typeToString(t)}'.`)
                return t
        }
    }
    function checkObject(object: Object): ObjectType {
        const members: Table = new Map()
        for (const p of object.properties) {
            const symbol = resolve(object.symbol.members, p.name.text, Meaning.Value)
            if (!symbol) {
                throw new Error(`Binder did not correctly bind property ${p.name.text} of object with keys ${Object.keys(object.symbol.members)}`)
            }
            members.set(p.name.text, symbol)
            checkProperty(p)
        }
        return { id: typeCount++, members }
    }
    function checkProperty(property: PropertyAssignment): Type {
        return checkExpression(property.initializer)
    }
    function checkType(name: Identifier): Type {
        switch (name.text) {
            case "string":
                return stringType
            case "number":
                return numberType
            default:
                const symbol = resolve(module.locals, name.text, Meaning.Type)
                if (symbol) {
                    return checkType((symbol.declarations.find(d => d.kind === Node.TypeAlias) as TypeAlias).typename)
                }
                error(name.pos, "Could not resolve type " + name.text)
                return errorType
        }
    }
    function getValueTypeOfSymbol(symbol: Symbol): Type {
        if (!symbol.valueDeclaration) {
            throw new Error("Cannot get value type of symbol without value declaration")
        }
        // TODO: Caching
        // TODO: symbol flags
        switch (symbol.valueDeclaration.kind) {
            case Node.Var:
            case Node.TypeAlias:
                return checkStatement(symbol.valueDeclaration)
            case Node.Object:
                return checkExpression(symbol.valueDeclaration)
            case Node.PropertyAssignment:
                return checkProperty(symbol.valueDeclaration)
            default:
                throw new Error("Unxpected value declaration kind " + (symbol.valueDeclaration as Declaration).kind)
        }
    }
    function typeToString(type: Type): string {
        switch (type.id) {
            case stringType.id: return 'string'
            case numberType.id: return 'number'
            case errorType.id: return 'error'
            default:
                if ('members' in type) {
                    return `{ ${Object.keys(type.members).map(m => `${m}: ${typeToString(getValueTypeOfSymbol(type.members.get(m)!))}`).join(', ')} }`
                }
                return '(anonymous)'
        }
    }
}
