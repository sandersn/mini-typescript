import { Node, Meaning } from './types.js'
import type { AllNodes, Container, Module, Statement, Type, Symbol, Expression, Declaration, Identifier, TypeAlias, Object, PropertyAssignment, ObjectType, Function, Parameter, Return, Table } from './types.js'
import { error } from './error.js'
import { getMeaning } from './bind.js'
let typeCount = 0
const stringType: Type = { id: typeCount++ }
const numberType: Type = { id: typeCount++ }
const errorType: Type = { id: typeCount++ }
const anyType: Type = { id: typeCount++ }
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
            case Node.Return:
                return checkExpression(statement.expr)
        }
    }
    function checkExpression(expression: Expression): Type {
        switch (expression.kind) {
            case Node.Identifier:
                const symbol = resolve(expression, expression.text, Meaning.Value)
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
            case Node.Function:
                return checkFunction(expression)
        }
    }
    function checkObject(object: Object): ObjectType {
        const members: Table = new Map()
        for (const p of object.properties) {
            const symbol = resolve(p, p.name.text, Meaning.Value)
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
    function checkFunction(func: Function): Type {
        const bodyType = checkBody(func.body)
        for (const parameters of func.parameters) {
            checkParameter(parameters)
        }
        const returnType = func.typename ? checkType(func.typename) : undefined
        // TODO: Check assignability of body type to return type
        return {
            id: typeCount++,
            signature: {
                parameters: func.parameters.map(p => p.symbol),
                returnType: returnType || bodyType,
            }
        }
    }
    function checkParameter(parameter: Parameter): Type {
        return parameter.typename ? checkType(parameter.typename) : anyType
    }
    function checkBody(body: Statement[]): Type {
        for (const statement of body) {
            checkStatement(statement)
        }
        // now find all return statements and munge their types together
        const types: Type[] = []
        forEachReturnStatement(body, returnStatement => {
            // TODO: Dedupe
            types.push(checkStatement(returnStatement))
        })
        // TODO: Union types, I guess
        return types[0]
    }
    function forEachReturnStatement(body: Statement[], callback: (returnStatement: Return) => void): void {
        for (const statement of body) {
            traverse(statement)
        }
        function traverse(node: Statement) {
            switch (node.kind) {
                case Node.ExpressionStatement:
                case Node.Var:
                case Node.TypeAlias:
                    return
                case Node.Return:
                    return callback(node)
                default:
                    const unused: never = node
                    console.log(`${unused} should *never* have been used`)
            }
        }
    }
    function checkType(name: Identifier): Type {
        switch (name.text) {
            case "string":
                return stringType
            case "number":
                return numberType
            default:
                const symbol = resolve(name, name.text, Meaning.Type)
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
            case Node.Parameter:
                return checkParameter(symbol.valueDeclaration)
            default:
                throw new Error("Unxpected value declaration kind " + Node[(symbol.valueDeclaration as Declaration).kind])
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
    function resolve(location: AllNodes, name: string, meaning: Meaning) {
        while (location) {
            if (location.kind === Node.Module || location.kind === Node.Function) {
                const symbol = getSymbol((location as Container).locals, name, meaning)
                if (symbol) {
                    return symbol
                }
            }
            else if (location.kind === Node.Object) {
                const symbol = getSymbol((location as Object).symbol.members, name, meaning)
                if (symbol) {
                    return symbol
                }
            }
            location = location.parent as AllNodes
        }
    }
    function getSymbol(locals: Table, name: string, meaning: Meaning) {
        const symbol = locals.get(name)
        if (symbol?.declarations.some(d => getMeaning(d) === meaning)) {
            return symbol
        }
        // TODO: Maybe move error from callers to here
    }
}
