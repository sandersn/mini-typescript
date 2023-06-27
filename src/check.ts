import { SyntaxKind, Meaning, Kind } from './types.js'
import type { Node, Container, Module, Statement, Type, Symbol, InstantiatedSymbol, Expression, Declaration, TypeNode, TypeParameter, Object, ObjectLiteralType, PropertyAssignment, PropertyDeclaration, ObjectType, Function, SignatureDeclaration, Parameter, Return, Call, Table, Signature, Mapper, TypeVariable } from './types.js'
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
        // No caching here because Typescript doesn't cache object types either 
        return { kind: Kind.Object, id: typeCount++, members }
    }
    function checkProperty(property: PropertyAssignment): Type {
        return checkExpression(property.initializer)
    }
    function checkFunction(func: Function): Type {
        return getValueTypeOfSymbol(func.symbol)
    }
    function checkCall(call: Call): Type {
        // TODO: after instantiation is done, check how Typescript does it.
        const expressionType = checkExpression(call.expression)
        if (expressionType.kind !== Kind.Function) {
            error(call.expression, `Cannot call expression of type '${typeToString(expressionType)}'.`)
            return errorType
        }
        let sig = expressionType.signature
        if (sig.typeParameters) {
            if (!call.typeArguments) {
                error(call.expression, "TODO: Cannot call generic function without type arguments because inference isn't implemented yet")
            }
            else if (sig.typeParameters.length !== call.typeArguments.length) {
                // TODO: Match them anyway, filling in any for missing ones -OR- do whatever Typescript does
                error(call.expression, `Expected ${sig.typeParameters.length} type arguments, but got ${call.typeArguments.length}.`)
                sig = instantiateSignature(sig, { sources: sig.typeParameters.map(getTypeTypeOfSymbol) as TypeVariable[], targets: sig.typeParameters.map((_,i) => call.typeArguments![i] ? checkType(call.typeArguments![i]) : anyType) })
            }
            else {
                sig = instantiateSignature(sig, { sources: sig.typeParameters.map(getTypeTypeOfSymbol) as TypeVariable[], targets: call.typeArguments.map(checkType) })
            }
        }
        if (sig.parameters.length !== call.arguments.length) {
            error(call.expression, `Expected ${sig.parameters.length} arguments, but got ${call.arguments.length}.`)
        }
        const argTypes = call.arguments.map(checkExpression)
        for (let i = 0; i < Math.min(argTypes.length, sig.parameters.length); i++) {
            const parameterType = getValueTypeOfSymbol(sig.parameters[i])
            if (!isAssignableTo(argTypes[i], parameterType)) {
                error(call.arguments[i], `Expected argument of type '${typeToString(parameterType)}', but got '${typeToString(argTypes[i])}'.`)
            }
        }
        return sig.returnType
    }
    function instantiateSignature(signature: Signature, mapper: Mapper): Signature {
        return {
            typeParameters: undefined, // TODO: Optionally retain type parameters
            parameters: signature.parameters.map(p => instantiateSymbol(p, mapper)),
            returnType: instantiateType(signature.returnType, mapper), // TODO: Lazily calculate return type (getReturnTypeOfSignature dispatches several kinds of calculation, and the kind we need here is simple)
            target: signature,
            mapper,
        }
    }
    function instantiateType(type: Type, mapper: Mapper): Type {
        // TODO: Caching??!
        switch (type.kind) {
            case Kind.Primitive:
                return type
            case Kind.Function:
                return { kind: Kind.Function, id: typeCount++, signature: instantiateSignature(type.signature, mapper) }
            case Kind.Object:
                const members: Table = new Map()
                for (const [m, s] of type.members) {
                    members.set(m, instantiateSymbol(s, mapper))
                }
                return { kind: Kind.Object, id: typeCount++, members }
            case Kind.TypeVariable:
                for (let i = 0; i < mapper.sources.length; i++) {
                    if (mapper.sources[i] === type) {
                        return mapper.targets[i]
                    }
                }
                return type
            default:
                throw new Error("Unexpected type kind " + Kind[(type as Type).kind])
        }
    }
    function instantiateSymbol(symbol: Symbol, mapper: Mapper): InstantiatedSymbol {
        return {
            declarations: symbol.declarations,
            valueDeclaration: symbol.valueDeclaration,
            target: symbol,
            mapper,
            valueType: symbol.valueType && instantiateType(symbol.valueType, mapper),
            typeType: symbol.typeType && instantiateType(symbol.typeType, mapper),
        }
    }

    function checkParameter(parameter: Parameter): Type {
        return parameter.typename ? checkType(parameter.typename) : anyType
    }
    function checkTypeParameter(typeParameter: TypeParameter): Type {
        return getTypeTypeOfSymbol(typeParameter.symbol)
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
                        // TODO: Extract to getTypeTypeOfSymbol ?
                        if (symbol) {
                            return getTypeTypeOfSymbol(symbol)
                        }
                        error(type, "Could not resolve type " + type.text)
                        return errorType
                }
            case SyntaxKind.ObjectLiteralType:
                return checkObjectLiteralType(type)
            case SyntaxKind.Signature:
                return getTypeTypeOfSymbol(type.symbol)
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
        return object.symbol.typeType = { kind: Kind.Object, id: typeCount++, members }
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
        if (symbol.valueType) 
            return symbol.valueType
        if ('target' in symbol) {
            const alias = symbol as InstantiatedSymbol
            return instantiateType(getValueTypeOfSymbol(alias.target), alias.mapper)
        }
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
            case SyntaxKind.Function:
                return getTypeOfFunction(symbol.valueDeclaration)
            default:
                throw new Error("Unxpected value declaration kind " + SyntaxKind[(symbol.valueDeclaration as Declaration).kind])
        }
    }
    function getTypeOfFunction(func: Function): Type {
        for (const typeParameter of func.typeParameters || []) {
            checkTypeParameter(typeParameter)
        }
        for (const parameter of func.parameters) {
            checkParameter(parameter)
        }
        const declaredType = func.typename && checkType(func.typename)
        const bodyType = checkBody(func.body, declaredType)
        const signature = {
            typeParameters: func.typeParameters?.map(p => p.symbol),
            parameters: func.parameters.map(p => p.symbol),
            returnType: declaredType || bodyType,
        }
        return func.symbol.valueType = { kind: Kind.Function, id: typeCount++, signature }
    }
    function getTypeOfSignature(decl: SignatureDeclaration): Type {
        for (const typeParameter of decl.typeParameters || []) {
            checkTypeParameter(typeParameter)
        }
        for (const parameter of decl.parameters) {
            checkParameter(parameter)
        }
        const signature = {
            typeParameters: decl.typeParameters?.map(p => p.symbol),
            parameters: decl.parameters.map(p => p.symbol),
            returnType: decl.typename && checkType(decl.typename) || anyType,
        }
        return decl.symbol.typeType = { kind: Kind.Function, id: typeCount++, signature }
    }
    function getTypeTypeOfSymbol(symbol: Symbol): Type {
        if (symbol.typeType) 
            return symbol.typeType
        if ('target' in symbol) {
            const alias = symbol as InstantiatedSymbol
            return instantiateType(getTypeTypeOfSymbol(alias.target), alias.mapper)
        }
        // TODO: symbol flags
        for (const d of symbol.declarations) {
            switch (d.kind) {
                case SyntaxKind.TypeAlias:
                    return checkType(d.typename)
                case SyntaxKind.TypeParameter:
                    return symbol.typeType = { id: typeCount++, kind: Kind.TypeVariable, name: d.name.text }
                case SyntaxKind.Signature:
                    return getTypeOfSignature(d)
            }
        }
        throw new Error(`Symbol has no type declarations`)
    }
    function typeToString(type: Type): string {
        switch (type.kind) {
            case Kind.Primitive:
                switch (type.id) {
                    case stringType.id: return 'string'
                    case numberType.id: return 'number'
                    case errorType.id: return 'error'
                    case anyType.id: return 'any'
                    default: throw new Error("Unknown primitive type with id " + type.id)
                }
            case Kind.Object:
                const propertiesToString = ([name,symbol]: [string, Symbol]) => `${name}: ${typeToString(getValueTypeOfSymbol(symbol))}`
                return `{ ${Array.from(type.members).map(propertiesToString).join(', ')} }`
            case Kind.Function:
                const parametersToString = (p: Symbol) => `${(p.valueDeclaration as Parameter).name.text}: ${typeToString(getValueTypeOfSymbol(p))}`
                return `(${type.signature.parameters.map(parametersToString).join(', ')}) => ${typeToString(type.signature.returnType)}`
            case Kind.TypeVariable:
                return type.name
        }
        return '(anonymous)'
    }
    function resolve(location: Node, name: string, meaning: Meaning) {
        while (location) {
            if (location.kind === SyntaxKind.Module || location.kind === SyntaxKind.Function || location.kind === SyntaxKind.Signature) {
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
        if (source === target 
            || source === anyType || target === anyType 
            || source === errorType || target === errorType)
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
            let targetSignature = target.signature
            if (source.signature.typeParameters) {
                if (target.signature.typeParameters) {
                    const mapper = {
                        sources: target.signature.typeParameters.map(getTypeTypeOfSymbol) as TypeVariable[],
                        targets: source.signature.typeParameters.map(getTypeTypeOfSymbol)
                    }
                    targetSignature = instantiateSignature(target.signature, mapper)
                }
            }
            return isAssignableTo(source.signature.returnType, targetSignature.returnType)
                && targetSignature.parameters.length >= source.signature.parameters.length
                && targetSignature.parameters.every((p, i) =>
                    i >= source.signature.parameters.length
                    || isAssignableTo(getValueTypeOfSymbol(p), getValueTypeOfSymbol(source.signature.parameters[i])))
        }
        return false
    }
}
