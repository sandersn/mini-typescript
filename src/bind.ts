import { Module, Node, Statement, Table } from './types'
import { error } from './error'
export function bind(m: Module) {
    for (const statement of m.statements) {
        bindStatement(m.locals, statement)
    }

    function bindStatement(locals: Table, statement: Statement) {
        if (statement.kind === Node.Var) {
            if (locals.has(statement.name.text)) {
                error(statement.pos, `Cannot redeclare ${statement.name.text}`)
            }
            else {
                locals.set(statement.name.text, { declaration: statement })
            }
        }
    }
}
export function resolve(locals: Table, name: string) {
    return locals.get(name)
}
