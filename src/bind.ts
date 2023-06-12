import { Expression, Module, AllNodes, Location, Node, Statement, Table, Declaration, Meaning } from './types.js'
import { error } from './error.js'
export const valueDeclarations = new Set([Node.Var, Node.Object, Node.PropertyAssignment, Node.Parameter])
export const typeDeclarations = new Set([Node.TypeAlias])
export function bind(m: Module) {
    setParents(m, m.statements)
    for (const statement of m.statements) {
        bindStatement(m.locals, statement)
    }

    function bindStatement(locals: Table, statement: Statement) {
        switch (statement.kind) {
            case Node.Var:
                setParents(statement, [statement.name, statement.typename, statement.initializer])
                bindExpression(statement.initializer)
                declareSymbol(locals, statement, Meaning.Value)
                break
            case Node.TypeAlias:
                setParents(statement, [statement.name, statement.typename])
                declareSymbol(locals, statement, Meaning.Type)
                break
            case Node.ExpressionStatement:
            case Node.Return:
                setParents(statement, [statement.expression])
                bindExpression(statement.expression)
                break
            default:
                throw new Error(`Unexpected statement kind ${Node[(statement as Statement).kind]}`)
        }
    }
    function bindExpression(expr: Expression) {
        switch (expr.kind) {
            case Node.Object:
                setParents(expr, expr.properties)
                for (const property of expr.properties) {
                    setParents(property, [property.name, property.initializer])
                    bindExpression(property.initializer)
                    declareSymbol(expr.symbol.members, property, Meaning.Value)
                }
                break
            case Node.Function:
                setParents(expr, [expr.name, ...expr.parameters, expr.typename, ...expr.body])
                for (const parameter of expr.parameters) {
                    setParents(parameter, [parameter.name, parameter.typename])
                    declareSymbol(expr.locals, parameter, Meaning.Value)
                }
                for (const statement of expr.body) {
                    bindStatement(expr.locals, statement)
                }
                break
            case Node.Assignment:
                setParents(expr, [expr.name, expr.value])
                bindExpression(expr.value)
                break
            case Node.Call:
                setParents(expr, [expr.expression, ...expr.arguments])
                bindExpression(expr.expression)
                for (const arg of expr.arguments) {
                    bindExpression(arg)
                }
                break
            case Node.Identifier:
            case Node.StringLiteral:
            case Node.NumericLiteral:
                break
            default:
                throw new Error(`Unexpected expression kind ${Node[(expr as Expression).kind]}`)
        }
    }
    function declareSymbol(container: Table, declaration: Declaration, meaning: Meaning) {
        const name = getDeclarationName(declaration)
        let symbol = container.get(name)
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
            symbol = {
                declarations: [declaration],
                valueDeclaration: meaning == Meaning.Value ? declaration : undefined,
            }
            container.set(name, symbol)
        }
        declaration.symbol = symbol
    }
}
function setParents(parent: AllNodes, children: (Location | undefined)[]) {
    for (const child of children) {
        if (child)
            child.parent = parent
    }
}
export function getMeaning(declaration: Declaration) {
    return valueDeclarations.has(declaration.kind) ? Meaning.Value : Meaning.Type
}
export function getDeclarationName(node: Declaration) {
    switch (node.kind) {
        case Node.Var:
        case Node.TypeAlias:
        case Node.PropertyAssignment:
        case Node.Parameter:
            return node.name.text
        case Node.Object:
            return "__object"
        default:
            error((node as Declaration).pos, `Cannot get name of ${(node as Declaration).kind}`)
            return "__missing"
    }
}
