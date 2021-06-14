import { Error } from './types'
export const errors: Map<number,Error> = new Map()
export function error(pos: number, message: string) {
    if (!errors.has(pos)) {
        errors.set(pos, { pos, message })
    }
}
