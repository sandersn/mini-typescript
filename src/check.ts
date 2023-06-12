import { Node, Meaning, Kind } from './types.js'
import type { AllNodes, Container, Module, Statement, Type, Symbol, Expression, Declaration, Identifier, TypeAlias, Object, PropertyAssignment, ObjectType, Function, Parameter, Return, Table } from './types.js'
import { error } from './error.js'
import { getMeaning } from './bind.js'
let typeCount = 0
const stringType: Type = { kind: Kind.Primitive, id: typeCount++ }
const numberType: Type = { kind: Kind.Primitive, id: typeCount++ }
const errorType: Type = { kind: Kind.Primitive, id: typeCount++ }
const anyType: Type = { kind: Kind.Primitive, id: typeCount++ }
export function check(module: Module) {
    return module.statements.map(checkStatement)

    function checkStatement(statement: Statement): Type {
        switch (statement.kind) {
            case Node.ExpressionStatement:
                return checkExpression(statement.expression)
            case Node.Var:
                const i = checkExpression(statement.initializer)
                if (!statement.typename) {
                    return i
                }
                const t = checkType(statement.typename)
                if (t !== i && t !== errorType)
                    error(statement.initializer.pos, `Cannot assign initialiser of type '${typeToString(i)}' to variable with declared type '${typeToString(t)}'.`)
                return t
            case Node.TypeAlias:
                return checkType(statement.typename)
            case Node.Return:
                return checkExpression(statement.expression)
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
                if (!isAssignableTo(v, t))
                    error(expression.name.pos, `Cannot assign value of type '${typeToString(v)}' to variable of type '${typeToString(t)}'.`)
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
        return { kind: Kind.Object, id: typeCount++, members }
    }
    function checkProperty(property: PropertyAssignment): Type {
        return checkExpression(property.initializer)
    }
    function checkFunction(func: Function): Type {
        const declaredType = func.typename && checkType(func.typename)
        const bodyType = checkBody(func.body, declaredType)
        const returnType = declaredType || bodyType
        for (const parameters of func.parameters) {
            checkParameter(parameters)
        }
        return {
            kind: Kind.Function,
            id: typeCount++,
            signature: {
                parameters: func.parameters.map(p => p.symbol),
                returnType,
            }
        }
    }
    function checkParameter(parameter: Parameter): Type {
        return parameter.typename ? checkType(parameter.typename) : anyType
    }
    function checkBody(body: Statement[], declaredType?: Type): Type {
        for (const statement of body) {
            checkStatement(statement)
        }
        // now find all return statements and munge their types together
        const types: Type[] = []
        forEachReturnStatement(body, returnStatement => {
            // TODO: Dedupe
            const returnType = checkStatement(returnStatement)
            if (declaredType && returnType !== declaredType) {
                if (!isAssignableTo(returnType, declaredType))
                    error(returnStatement.pos, `Returned type '${typeToString(returnType)}' does not match declared return type '${typeToString(declaredType)}'.`)
            }
            types.push(returnType)
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
            case anyType.id: return 'any'
        }
        if (type.kind === Kind.Object) {
            const propertiesToString = ([name,symbol]: [string, Symbol]) => `${name}: ${typeToString(getValueTypeOfSymbol(symbol))}`
            return `{ ${Array.from(type.members).map(propertiesToString).join(', ')} }`
        }
        if (type.kind === Kind.Function) {
            const parametersToString = (p: Symbol) => `${(p.valueDeclaration as Parameter).name.text}: ${typeToString(getValueTypeOfSymbol(p))}`
            return `(${type.signature.parameters.map(parametersToString).join(', ')}) => ${typeToString(type.signature.returnType)}`
        }
        return '(anonymous)'
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
    }
    function isAssignableTo(source: Type, target: Type): boolean {
        if (source === anyType || target === anyType)
            return true
        else if (source.kind === Kind.Primitive || target.kind === Kind.Primitive)
            return source === target
        else if (source.kind === Kind.Object && target.kind === Kind.Object) {
            for (const [key, targetSymbol] of target.members) {
                const sourceSymbol = source.members.get(key)
                if (!sourceSymbol || !isAssignableTo(getValueTypeOfSymbol(sourceSymbol), getValueTypeOfSymbol(targetSymbol))) {
                    return false
                }
            }
            return true
        }
        else if (source.kind === Kind.Function && target.kind === Kind.Function) {
            return isAssignableTo(source.signature.returnType, target.signature.returnType)
                && target.signature.parameters.length >= source.signature.parameters.length
                && target.signature.parameters.every((p, i) =>
                    i >= source.signature.parameters.length
                    || isAssignableTo(getValueTypeOfSymbol(p), getValueTypeOfSymbol(source.signature.parameters[i])))
        }
        return false
    }
}
