import { SyntaxKind, Meaning, Kind } from './types.js'
import type { Node, Container, Module, Statement, Type, Symbol, Expression, Declaration, TypeNode, TypeAlias, Object, ObjectLiteralType, PropertyAssignment, PropertyDeclaration, ObjectType, Function, SignatureDeclaration, Parameter, Return, Call, Table } from './types.js'
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
            case SyntaxKind.ExpressionStatement:
                return checkExpression(statement.expression)
            case SyntaxKind.Var:
                const i = checkExpression(statement.initializer)
                if (!statement.typename) {
                    return i
                }
                const t = checkType(statement.typename)
                if (!isAssignableTo(i, t))
                    error(statement.initializer, `Cannot assign initialiser of type '${typeToString(i)}' to variable with declared type '${typeToString(t)}'.`)
                return t
            case SyntaxKind.TypeAlias:
                return checkType(statement.typename)
            case SyntaxKind.Return:
                return checkExpression(statement.expression)
        }
    }
    function checkExpression(expression: Expression): Type {
        switch (expression.kind) {
            case SyntaxKind.Identifier:
                const symbol = resolve(expression, expression.text, Meaning.Value)
                if (symbol) {
                    return getValueTypeOfSymbol(symbol)
                }
                error(expression, "Could not resolve " + expression.text)
                return errorType
            case SyntaxKind.NumericLiteral:
                return numberType
            case SyntaxKind.StringLiteral:
                return stringType
            case SyntaxKind.Object:
                return checkObject(expression)
            case SyntaxKind.Assignment:
                const v = checkExpression(expression.value)
                const t = checkExpression(expression.name)
                if (!isAssignableTo(v, t))
                    error(expression.name, `Cannot assign value of type '${typeToString(v)}' to variable of type '${typeToString(t)}'.`)
                return t
            case SyntaxKind.Function:
                return checkFunction(expression)
            case SyntaxKind.Call:
                return checkCall(expression)
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
        for (const parameters of func.parameters) {
            checkParameter(parameters)
        }
        const declaredType = func.typename && checkType(func.typename)
        const bodyType = checkBody(func.body, declaredType)
        const parameters = func.parameters.map(p => p.symbol)
        const returnType = declaredType || bodyType
        return { kind: Kind.Function, id: typeCount++, signature: { parameters, returnType, } }
    }
    function checkCall(call: Call): Type {
        const expressionType = checkExpression(call.expression)
        if (expressionType.kind !== Kind.Function) {
            error(call.expression, `Cannot call expression of type '${typeToString(expressionType)}'.`)
            return errorType
        }
        const sig = expressionType.signature
        if (sig.parameters.length !== call.arguments.length) {
            error(call.expression, `Expected ${sig.parameters.length} arguments, but got ${call.arguments.length}.`)
        }
        const argTypes = call.arguments.map(checkExpression)
        for (let i = 0; i < Math.min(argTypes.length, sig.parameters.length); i++) {
            const parameterType = checkParameter(sig.parameters[i].valueDeclaration as Parameter)
            if (!isAssignableTo(argTypes[i], parameterType)) {
                error(call.arguments[i], `Expected argument of type '${typeToString(parameterType)}', but got '${typeToString(argTypes[i])}'.`)
            }
        }
        return sig.returnType
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
                    error(returnStatement, `Returned type '${typeToString(returnType)}' does not match declared return type '${typeToString(declaredType)}'.`)
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
                case SyntaxKind.ExpressionStatement:
                case SyntaxKind.Var:
                case SyntaxKind.TypeAlias:
                    return
                case SyntaxKind.Return:
                    return callback(node)
                default:
                    const unused: never = node
                    console.log(`${unused} should *never* have been used`)
            }
        }
    }
    function checkType(type: TypeNode): Type {
        switch (type.kind) {
            case SyntaxKind.Identifier:
                switch (type.text) {
                    case "string":
                        return stringType
                    case "number":
                        return numberType
                    default:
                        const symbol = resolve(type, type.text, Meaning.Type)
                        if (symbol) {
                            // TODO: find a better way to write this
                            for (const d of symbol.declarations) {
                                switch (d.kind) {
                                    case SyntaxKind.TypeAlias:
                                        return checkType(d.typename)
                                    case SyntaxKind.TypeParameter:
                                        // TODO: This requires caching, because it's going to use nominal assignability (at least in inference)
                                        return { id: typeCount++, kind: Kind.Primitive }
                                }
                            }
                        }
                        error(type, "Could not resolve type " + type.text)
                        return errorType
                }
            case SyntaxKind.ObjectLiteralType:
                return checkObjectLiteralType(type)
            case SyntaxKind.Signature:
                return checkSignature(type)
        }
    }
    function checkObjectLiteralType(object: ObjectLiteralType): ObjectType {
        const members: Table = new Map()
        for (const p of object.properties) {
            const symbol = resolve(p, p.name.text, Meaning.Value)
            if (!symbol) {
                // TODO: Throws on function return type (which is admittedly checked first)
                throw new Error(`Binder did not correctly bind property ${p.name.text} of object literal type with keys ${Object.keys(object.symbol.members)}`)
            }
            members.set(p.name.text, symbol)
            checkPropertyDeclaration(p)
        }
        return { kind: Kind.Object, id: typeCount++, members }
    }
    function checkSignature(signature: SignatureDeclaration): Type {
        for (const parameters of signature.parameters) {
            checkParameter(parameters)
        }
        const parameters = signature.parameters.map(p => p.symbol)
        const returnType = signature.typename && checkType(signature.typename) || anyType
        return { kind: Kind.Function, id: typeCount++, signature: { parameters, returnType } }
    }
    function checkPropertyDeclaration(property: PropertyDeclaration): Type {
        if (property.typename) {
            return checkType(property.typename)
        }
        return anyType
    }
    function getValueTypeOfSymbol(symbol: Symbol): Type {
        if (!symbol.valueDeclaration) {
            throw new Error("Cannot get value type of symbol without value declaration")
        }
        // TODO: Caching
        // TODO: symbol flags
        switch (symbol.valueDeclaration.kind) {
            case SyntaxKind.Var:
            case SyntaxKind.TypeAlias:
                return checkStatement(symbol.valueDeclaration)
            case SyntaxKind.Object:
                return checkExpression(symbol.valueDeclaration)
            case SyntaxKind.PropertyAssignment:
                return checkProperty(symbol.valueDeclaration)
            case SyntaxKind.PropertyDeclaration:
                return symbol.valueDeclaration.typename ? checkType(symbol.valueDeclaration.typename) : anyType;
            case SyntaxKind.Parameter:
                return checkParameter(symbol.valueDeclaration)
            default:
                throw new Error("Unxpected value declaration kind " + SyntaxKind[(symbol.valueDeclaration as Declaration).kind])
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
    function resolve(location: Node, name: string, meaning: Meaning) {
        while (location) {
            if (location.kind === SyntaxKind.Module || location.kind === SyntaxKind.Function) {
                const symbol = getSymbol((location as Container).locals, name, meaning)
                if (symbol) {
                    return symbol
                }
            }
            else if (location.kind === SyntaxKind.Object || location.kind === SyntaxKind.ObjectLiteralType) {
                const symbol = getSymbol((location as Object).symbol.members, name, meaning)
                if (symbol) {
                    return symbol
                }
            }
            location = location.parent as Node
        }
    }
    function getSymbol(locals: Table, name: string, meaning: Meaning) {
        const symbol = locals.get(name)
        if (symbol?.declarations.some(d => getMeaning(d) === meaning)) {
            return symbol
        }
    }
    function isAssignableTo(source: Type, target: Type): boolean {
        if (source === anyType || target === anyType || source === errorType || target === errorType)
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
