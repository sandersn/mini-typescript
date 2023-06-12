import { AllNodes, Error } from './types.js'
export const errors: Map<number,Error> = new Map()
export function error(location: AllNodes | number, message: string) {
    const pos = typeof location === 'number' ? location : location.pos
    if (!errors.has(pos)) {
        errors.set(pos, { pos, message })
    }
}
