import { Expression, Module, Node, Statement, Table, PropertyAssignment, Declaration, Meaning } from './types.js'
import { error } from './error.js'
export const valueKinds = new Set([Node.Var, Node.Object, Node.PropertyAssignment])
export const typeKinds = new Set([Node.TypeAlias])
export function bind(m: Module) {
    for (const statement of m.statements) {
        bindStatement(m.locals, statement)
    }

    function bindStatement(locals: Table, statement: Statement) {
        switch (statement.kind) {
            case Node.Var:
                bindExpression(statement.init)
                declareSymbol(locals, statement, Meaning.Value)
                break
            case Node.TypeAlias:
                declareSymbol(locals, statement, Meaning.Type)
                break
            case Node.ExpressionStatement:
                bindExpression(statement.expr)
                break
        }
    }
    function bindExpression(expr: Expression) {
        if (expr.kind === Node.Object) {
            for (const property of expr.properties) {
                bindProperty(expr.symbol.members, property)
            }
        }
    }
    function bindProperty(container: Table, property: PropertyAssignment) {
        if (property.kind === Node.PropertyAssignment) {
            bindExpression(property.initializer)
            declareSymbol(container, property, Meaning.Value)
        }
    }
    function declareSymbol(container: Table, declaration: Declaration, meaning: Meaning) {
        const name = getDeclarationName(declaration)
        const symbol = container.get(name)
        if (symbol) {
            const other = symbol.declarations.find(d => meaning === getMeaning(d))
            if (other) {
                error(declaration.pos, `Cannot redeclare ${name}; first declared at ${other.pos}`)
            }
            else {
                symbol.declarations.push(declaration)
                if (!symbol.valueDeclaration && meaning === Meaning.Value) {
                    symbol.valueDeclaration = declaration
                }
            }
        }
        else {
            container.set(name, {
                declarations: [declaration],
                valueDeclaration: meaning == Meaning.Value ? declaration : undefined,
            })
        }
    }
}
export function getMeaning(declaration: Declaration) {
    return valueKinds.has(declaration.kind) ? Meaning.Value : Meaning.Type
}
export function getDeclarationName(node: Declaration) {
    switch (node.kind) {
        case Node.Var:
        case Node.TypeAlias:
        case Node.PropertyAssignment:
            return node.name.text
        case Node.Object:
            return "__object"
        default:
            error((node as Declaration).pos, `Cannot get name of ${(node as Declaration).kind}`)
            return "__missing"
    }
}
export function resolve(locals: Table, name: string, meaning: Meaning) {
    const symbol = locals.get(name)
    if (symbol?.declarations.some(d => getMeaning(d) === meaning)) {
        return symbol
    }
    // TODO: Maybe move error from callers to here
}
