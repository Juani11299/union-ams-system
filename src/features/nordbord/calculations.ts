import { ASYM_A, ASYM_R, CAT_ORDER, M, PREV_GAP_DAYS } from './constants'
import type { CatRef, Dataset, Estado, Lvl, MetricKey, NbRow, NbTest, Stats, Ventana } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers numéricos / de formato (portados 1:1 del HTML original)
// ─────────────────────────────────────────────────────────────────────────────

export const ok = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function fmt(v: number | null | undefined, d = 1): string {
  if (!ok(v)) return '—'
  return v.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d })
}

export const fdate = (d: Date | null | undefined): string =>
  d ? d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const fdShort = (d: Date): string =>
  `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`

export const norm = (s: string): string =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[,.;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const sideName = (s: 'I' | 'D'): string => (s === 'I' ? 'Izquierda' : 'Derecha')
export const initials = (n: string): string =>
  n
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function stats(vals: Array<number | null | undefined>): Stats {
  const v = vals.filter(ok)
  const n = v.length
  if (!n) return { n: 0, mean: NaN, sd: NaN, min: NaN, max: NaN, cv: NaN, vals: [] }
  const mean = v.reduce((a, b) => a + b, 0) / n
  const sd = n > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0
  return { n, mean, sd, min: Math.min(...v), max: Math.max(...v), cv: mean ? (sd / Math.abs(mean)) * 100 : 0, vals: v }
}

export function zOf(v: number | null | undefined, s: Stats, inv?: boolean): number | null {
  if (!ok(v) || !s.sd) return null
  return ((v - s.mean) / s.sd) * (inv ? -1 : 1)
}

export function pctOf(v: number | null | undefined, s: Stats, inv?: boolean): number | null {
  if (!ok(v) || !s.n) return null
  const c = s.vals.filter((x) => (inv ? x >= v : x <= v)).length
  return (c / s.n) * 100
}

/** Semáforo de asimetría estricto: < 10 % verde · 10–20 % ámbar · > 20 % rojo. */
export type AsymLvl = 'g' | 'a' | 'r' | 'n'
export const asymLvl = (a: number | null | undefined): AsymLvl => (!ok(a) ? 'n' : a < ASYM_A ? 'g' : a <= ASYM_R ? 'a' : 'r')
export const ASYM_TXT: Record<AsymLvl, string> = { g: 'Aceptable', a: 'Precaución', r: 'Alerta médica', n: '—' }
export const asymTxt = (a: number | null | undefined): string => ASYM_TXT[asymLvl(a)]

/** Simetría en escala absoluta 0–100: 0 % → 100 · 10 % → 75 · 20 % → 50 · ≥ 40 % → 0. */
export const symScore = (a: number | null | undefined): number | null => (ok(a) ? Math.max(0, Math.min(100, 100 - 2.5 * a)) : null)

/** Valor de una métrica de un test (todas las MetricKey son number | null en NbTest). */
export const val = (t: NbTest, k: MetricKey): number | null => t[k]

// ─────────────────────────────────────────────────────────────────────────────
// Pools / filtros
// ─────────────────────────────────────────────────────────────────────────────

export const monthKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

function windowTests(data: Dataset, win: Ventana): NbTest[] {
  return win === 'latest' ? data.tests : data.tests.filter((t) => monthKey(t.date) === win)
}

/** Un test por atleta dentro de la ventana: el mejor intento (fuerza media) del ÚLTIMO día evaluado. */
export function poolFor(data: Dataset, win: Ventana, cat: string, pos: string): NbTest[] {
  const by: Record<string, NbTest[]> = {}
  for (const t of windowTests(data, win)) (by[t.key] = by[t.key] || []).push(t)
  const out: NbTest[] = []
  for (const arr of Object.values(by)) {
    const lastDay = arr.reduce((m, t) => (t.date > m ? t.date : m), arr[0].date).toDateString()
    const same = arr.filter((t) => t.date.toDateString() === lastDay)
    out.push(same.reduce((b, t) => (t.forceMean > b.forceMean ? t : b)))
  }
  return out.filter((t) => (cat === 'all' || t.ath.cat === cat) && (pos === 'all' || t.ath.pos === pos))
}

/** Evaluación previa = sesión anterior separada ≥ PREV_GAP_DAYS; se toma el mejor intento de esa sesión. */
export function prevTest(t: NbTest): NbTest | null {
  const d0 = new Date(t.date.getFullYear(), t.date.getMonth(), t.date.getDate() - PREV_GAP_DAYS + 1)
  const a = t.ath.tests.filter((x) => x.date < d0) // ath.tests está ordenado cronológicamente
  if (!a.length) return null
  const day = a[a.length - 1].date.toDateString()
  return a.filter((x) => x.date.toDateString() === day).reduce((b, x) => (x.forceMean > b.forceMean ? x : b))
}

/** Agrega z-score / percentil / normalizado 0–100 de la métrica elegida (no muta los tests). */
export function enrich(pool: NbTest[], mk: MetricKey): { rows: NbRow[]; s: Stats } {
  const m = M[mk]
  const s = stats(pool.map((t) => t[mk]))
  const rows = pool.map((t): NbRow => {
    const v = t[mk]
    let n = ok(v) && s.max > s.min ? ((v - s.min) / (s.max - s.min)) * 100 : null
    if (m.inv && n != null) n = 100 - n
    return { ...t, _z: zOf(v, s, m.inv), _p: pctOf(v, s, m.inv), _n: n }
  })
  return { rows, s }
}

/** Bandera roja del resumen grupal: asimetría > 20 % o Z ≤ −1,5 en la métrica elegida. */
export const isRed = (t: NbRow): boolean => t.asymAbs > ASYM_R || (t._z != null && t._z <= -1.5)

export function catOrder(cats: string[]): string[] {
  const idx = (c: string) => (CAT_ORDER.indexOf(c) < 0 ? 99 : CAT_ORDER.indexOf(c))
  return [...cats].sort((a, b) => idx(a) - idx(b))
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado funcional único (DT, ficha individual y tabla): asimetría + fuerza vs su
// categoría + tendencia respecto del test anterior
// ─────────────────────────────────────────────────────────────────────────────

export function buildCatRef(data: Dataset, win: Ventana): CatRef {
  const all = poolFor(data, win, 'all', 'all')
  const v: CatRef = {}
  for (const c of new Set(all.map((t) => t.ath.cat))) {
    const g = all.filter((t) => t.ath.cat === c)
    v[c] = { rel: stats(g.map((t) => t.forceRel)), abs: stats(g.map((t) => t.forceMean)) }
  }
  return v
}

export function statusOf(t: NbTest, catRef: CatRef): Estado {
  const r = catRef[t.ath.cat] || { rel: stats([]), abs: stats([]) }
  const zS = ok(t.forceRel) && r.rel.n >= 5 ? zOf(t.forceRel, r.rel) : r.abs.n >= 5 ? zOf(t.forceMean, r.abs) : null
  const prev = prevTest(t)
  const delta = prev ? ((t.forceMean - prev.forceMean) / prev.forceMean) * 100 : null
  const severe = zS != null && zS <= -1.5
  const low = zS != null && zS <= -1
  const drop = delta != null && delta <= -15
  const dropM = delta != null && delta <= -8
  const aR = t.asymAbs > ASYM_R
  const aA = t.asymAbs >= ASYM_A
  const lvl: Lvl = aR || severe || drop ? 'r' : aA || low || dropM ? 'a' : 'g'
  return { lvl, zS, delta, prev, severe, low, drop, dropM, aR, aA }
}

/** Lenguaje de campo para el vestuario (Resumen DT & PF). */
export function dtAdvice(t: NbTest, so: Estado): { care: string; rec: string } {
  const side = sideName(t.weakSide)
  const sl = side.toLowerCase()
  const care = t.asymAbs >= ASYM_A ? `Pierna ${side} −${fmt(t.asymAbs, 0)} %` : 'Equilibrado'
  let rec: string
  if (so.lvl === 'r') {
    if (so.aR)
      rec = `Limitar sprints máximos con fatiga · derivar a Kinesio · compensatorio unilateral pierna ${sl} post-entreno${so.severe ? ' · sumar plan de fuerza de isquios' : ''}`
    else if (so.drop)
      rec = `Perdió ${fmt(Math.abs(so.delta ?? 0), 0)} % de fuerza respecto del test anterior: chequear fatiga o molestias con Kinesio antes de la sesión`
    else rec = 'Isquios muy por debajo de su categoría: sprints máximos solo al inicio de la sesión · plan de fuerza con el PF (nórdicos 2×/semana)'
  } else if (so.lvl === 'a') {
    if (so.aA) rec = `Dosificar sprints máximos y frenadas · vitamina de isquios ${side === 'Izquierda' ? 'izq.' : 'der.'} post-entreno`
    else if (so.dropM) rec = 'Bajó algo de fuerza respecto del test anterior: controlar volumen de alta velocidad'
    else rec = 'Entrena normal + bloque extra de nórdicos (2×5) en gimnasio'
  } else rec = 'Entrena sin restricciones'
  return { care, rec }
}
