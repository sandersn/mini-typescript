import { Expression, Module, Node, Location, SyntaxKind, Statement, TypeNode, Table, Declaration, Meaning } from './types.js'
import { error } from './error.js'
export const valueDeclarations = new Set([SyntaxKind.Var, SyntaxKind.Object, SyntaxKind.PropertyAssignment, SyntaxKind.PropertyDeclaration, SyntaxKind.Parameter])
export const typeDeclarations = new Set([SyntaxKind.TypeAlias])
export function bind(m: Module) {
    setParents(m, m.statements)
    for (const statement of m.statements) {
        bindStatement(m.locals, statement)
    }

    function bindStatement(locals: Table, statement: Statement) {
        switch (statement.kind) {
            case SyntaxKind.Var:
                setParents(statement, [statement.name, statement.typename, statement.initializer])
                bindExpression(statement.initializer)
                bindType(statement.typename)
                declareSymbol(locals, statement, Meaning.Value)
                break
            case SyntaxKind.TypeAlias:
                setParents(statement, [statement.name, statement.typename])
                bindType(statement.typename)
                declareSymbol(locals, statement, Meaning.Type)
                break
            case SyntaxKind.ExpressionStatement:
            case SyntaxKind.Return:
                setParents(statement, [statement.expression])
                bindExpression(statement.expression)
                break
            default:
                throw new Error(`Unexpected statement kind ${SyntaxKind[(statement as Statement).kind]}`)
        }
    }
    function bindExpression(expr: Expression) {
        switch (expr.kind) {
            case SyntaxKind.Object:
                setParents(expr, expr.properties)
                for (const property of expr.properties) {
                    setParents(property, [property.name, property.initializer])
                    bindExpression(property.initializer)
                    declareSymbol(expr.symbol.members, property, Meaning.Value)
                }
                break
            case SyntaxKind.Function:
                setParents(expr, [expr.name, ...expr.parameters, expr.typename, ...expr.body])
                bindType(expr.typename)
                for (const parameter of expr.parameters) {
                    setParents(parameter, [parameter.name, parameter.typename])
                    bindType(parameter.typename)
                    declareSymbol(expr.locals, parameter, Meaning.Value)
                }
                for (const statement of expr.body) {
                    bindStatement(expr.locals, statement)
                }
                break
            case SyntaxKind.Assignment:
                setParents(expr, [expr.name, expr.value])
                bindExpression(expr.value)
                break
            case SyntaxKind.Call:
                setParents(expr, [expr.expression, ...expr.arguments])
                bindExpression(expr.expression)
                for (const arg of expr.arguments) {
                    bindExpression(arg)
                }
                break
            case SyntaxKind.Identifier:
            case SyntaxKind.StringLiteral:
            case SyntaxKind.NumericLiteral:
                break
            default:
                throw new Error(`Unexpected expression kind ${SyntaxKind[(expr as Expression).kind]}`)
        }
    }
    function bindType(type: TypeNode | undefined) {
        switch (type?.kind) {
            case SyntaxKind.ObjectLiteralType:
                setParents(type, type.properties)
                for (const property of type.properties) {
                    setParents(property, [property.name, property.typename])
                    bindType(property.typename)
                    declareSymbol(type.symbol.members, property, Meaning.Value)
                }
                break
            case SyntaxKind.Identifier:
                break
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
function setParents(parent: Node, children: (Location | undefined)[]) {
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
        case SyntaxKind.Var:
        case SyntaxKind.TypeAlias:
        case SyntaxKind.PropertyAssignment:
        case SyntaxKind.PropertyDeclaration:
        case SyntaxKind.Parameter:
            return node.name.text
        case SyntaxKind.Object:
            return "__object"
        default:
            error((node as Declaration).pos, `Cannot get name of ${(node as Declaration).kind}`)
            return "__missing"
    }
}
