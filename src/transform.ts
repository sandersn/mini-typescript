import { Statement, Node } from './types'
export function transform(statements: Statement[]) {
    return typescript(statements)
}
/** Convert TS to JS: remove type annotations */
function typescript(statements: Statement[]) {
    return statements.map(transformStatement)

    function transformStatement(statement: Statement): Statement {
        switch (statement.kind) {
            case Node.ExpressionStatement:
                return statement
            case Node.Var:
                return { ...statement, typename: undefined }
        }
    }
}
