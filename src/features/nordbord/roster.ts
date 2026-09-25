import type { MedicionAntropo } from '@/features/antropometrias/types'
import { norm } from './calculations'
import type { RosterEntry } from './types'

/**
 * Ficha antropométrica → roster para el cruce (categoría + peso). Reemplaza el
 * `ROSTER` hardcodeado del HTML: sale de la ÚLTIMA medición de cada jugador en
 * cada categoría (Supabase, `useAntropometriasStore`). Si esa medición no trae
 * peso se usa el último peso disponible de esa categoría.
 */
export function rosterDesdeAntropometrias(mediciones: MedicionAntropo[]): RosterEntry[] {
  const porJugador = new Map<string, MedicionAntropo[]>()
  for (const m of mediciones) {
    const k = `${m.jugadorKey}|${m.categoria}`
    const arr = porJugador.get(k)
    if (arr) arr.push(m)
    else porJugador.set(k, [m])
  }
  const out: RosterEntry[] = []
  for (const serie of porJugador.values()) {
    const orden = [...serie].sort((a, b) => a.fecha.localeCompare(b.fecha))
    const ultima = orden[orden.length - 1]
    const conPeso = [...orden].reverse().find((m) => m.pesoKg !== null)
    out.push({ cat: ultima.categoria, n: ultima.jugador, bw: conPeso?.pesoKg ?? null })
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Cruce por apellido + inicial/nombre (fuzzy) — portado 1:1 del HTML
// ─────────────────────────────────────────────────────────────────────────────

function lev(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array<number>(n).fill(0)])
  for (let j = 1; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[m][n]
}
const sim = (a: string, b: string): number => 1 - lev(a, b) / Math.max(a.length, b.length, 1)

export interface RosterTok extends RosterEntry {
  t: string[]
}
export const tokenizarRoster = (roster: RosterEntry[]): RosterTok[] => roster.map((r) => ({ ...r, t: norm(r.n).split(' ') }))

export type ResultadoCruce = { r: RosterTok; sc: number } | { amb: RosterTok[] } | null

export function matchRoster(name: string, RN: RosterTok[]): ResultadoCruce {
  const t = norm(name).split(' ')
  if (t.length < 2) return null
  const splits: Array<{ first: string; init: boolean; sur: string[] }> = []
  if (t[0].length <= 2) splits.push({ first: t[0], init: true, sur: t.slice(1) })
  else for (let k = 1; k < t.length; k++) splits.push({ first: t.slice(0, k).join(' '), init: false, sur: t.slice(k) })
  const cands: Array<{ r: RosterTok; sc: number }> = []
  for (const r of RN)
    for (const sp of splits) {
      const m = sp.sur.length
      if (r.t.length <= m) continue
      const rs = r.t.slice(0, m).join(' ')
      const ss = sp.sur.join(' ')
      const sc = rs === ss ? 1 : sim(rs, ss)
      if (sc < 0.8) continue
      const rf = r.t[m]
      const okF = sp.init ? rf[0] === sp.first[0] : rf.startsWith(sp.first.slice(0, 3)) || sp.first.startsWith(rf.slice(0, 3))
      if (okF) cands.push({ r, sc })
    }
  if (!cands.length) return null
  const best = Math.max(...cands.map((c) => c.sc))
  const top = [...new Map(cands.filter((c) => c.sc === best).map((c) => [c.r.cat + c.r.n, c])).values()]
  return top.length > 1 ? { amb: top.map((c) => c.r) } : top[0]
}
