import { C } from './constants'
import { asymLvl, fmt, ok } from './calculations'

export { fmt, ok }

export const zColor = (z: number | null): string => (z == null ? '#475569' : z >= 1 ? C.green : z > -1 ? C.blue : z > -2 ? C.orange : C.red)

export const asymColor = (a: number | null | undefined): string =>
  ({ g: C.green, a: C.amber, r: C.red, n: '#64748b' })[asymLvl(a)]
