import { Statement, Expression, SyntaxKind, PropertyAssignment, Parameter } from './types.js'
export function transform(statements: Statement[]) {
    return typescript(statements)
}
/** Convert TS to JS: remove type annotations and declarations */
function typescript(statements: Statement[]) {
    return statements.flatMap(transformStatement)

    function transformStatement(statement: Statement): Statement[] {
        switch (statement.kind) {
            case SyntaxKind.ExpressionStatement:
                return [{ ...statement, expression: transformExpression(statement.expression) }]
            case SyntaxKind.Var:
                return [{ ...statement, typename: undefined, initializer: transformExpression(statement.initializer) }]
            case SyntaxKind.TypeAlias:
                return []
            case SyntaxKind.Return:
                return [{ ...statement, expression: transformExpression(statement.expression) }]
        }
    }
    function transformExpression(expr: Expression): Expression {
        switch (expr.kind) {
            case SyntaxKind.Identifier:
            case SyntaxKind.NumericLiteral:
            case SyntaxKind.StringLiteral:
                return expr
            case SyntaxKind.Object:
                return { ...expr, properties: expr.properties.map(transformProperty) }
            case SyntaxKind.Function:
                return { ...expr, parameters: expr.parameters.map(transformParameter), typename: undefined, body: expr.body.flatMap(transformStatement) }
            case SyntaxKind.Assignment:
                return { ...expr, value: transformExpression(expr.value) }
            case SyntaxKind.Call:
                return { ...expr, expression: transformExpression(expr.expression), arguments: expr.arguments.map(transformExpression) }
        }
    }
    function transformProperty(property: PropertyAssignment): PropertyAssignment {
        return { ...property, initializer: transformExpression(property.initializer) }
    }
    function transformParameter(parameter: Parameter): Parameter {
        return { ...parameter, typename: undefined }
    }
}
