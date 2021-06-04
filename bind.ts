import { Module, Node, Statement, Table } from './types'
export function bind(m: Module) {
    const errors: string[] = []
    function bindStatement(locals: Table, statement: Statement) {
        if (statement.kind === Node.Var) {
            if (locals.has(statement.name.text)) {
                errors.push(`Cannot redeclare ${statement.name.text}`)
            }
            else {
                locals.set(statement.name.text, { declaration: statement })
            }
        }
    }
    for (const statement of m.statements) {
        bindStatement(m.locals, statement)
    }
    return errors
}
export function resolve(locals: Table, name: string) {
    return locals.get(name)
}
