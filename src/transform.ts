import { Statement, Expression, Node, PropertyAssignment, Parameter } from './types.js'
export function transform(statements: Statement[]) {
    return typescript(statements)
}
/** Convert TS to JS: remove type annotations and declarations */
function typescript(statements: Statement[]) {
    return statements.flatMap(transformStatement)

    function transformStatement(statement: Statement): Statement[] {
        switch (statement.kind) {
            case Node.ExpressionStatement:
                return [{ ...statement, expr: transformExpression(statement.expr) }]
            case Node.Var:
                return [{ ...statement, typename: undefined, initializer: transformExpression(statement.initializer) }]
            case Node.TypeAlias:
                return []
            case Node.Return:
                return [{ ...statement, expr: transformExpression(statement.expr) }]
        }
    }
    function transformExpression(expr: Expression): Expression {
        switch (expr.kind) {
            case Node.Identifier:
            case Node.NumericLiteral:
            case Node.StringLiteral:
                return expr
            case Node.Object:
                return { ...expr, properties: expr.properties.map(transformProperty) }
            case Node.Function:
                return { ...expr, parameters: expr.parameters.map(transformParameter), typename: undefined, body: expr.body.flatMap(transformStatement) }
            case Node.Assignment:
                return { ...expr, value: transformExpression(expr.value) }
        }
    }
    function transformProperty(property: PropertyAssignment): PropertyAssignment {
        return { ...property, initializer: transformExpression(property.initializer) }
    }
    function transformParameter(parameter: Parameter): Parameter {
        return { ...parameter, typename: undefined }
    }
}
