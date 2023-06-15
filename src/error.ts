import { Node, Error } from './types.js'
export const errors: Map<number,Error> = new Map()
export function error(location: Node | number, message: string) {
    const pos = typeof location === 'number' ? location : location.pos
    if (!errors.has(pos)) {
        errors.set(pos, { pos, message })
    }
}
