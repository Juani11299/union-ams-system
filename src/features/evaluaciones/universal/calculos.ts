import { asymLvlGenerico } from './semaforo'
import { fmt, monthKey, ok, pctOf, stats, zOf } from '@/features/nordbord/calculations'
import type { CatRefU, DatasetU, EstadoU, LvlU, MetricaU, RegistroU, RowU, Ventana } from './tipos'

export { fmt, monthKey, ok, pctOf, stats, zOf }

/** Días mínimos entre sesiones para considerar una evaluación "anterior" (un re-test del día siguiente es la misma campaña). */
export const PREV_GAP_DAYS = 14

export const fmtV = (v: number | null | undefined, m: Pick<MetricaU, 'd' | 'unidad'>): string =>
  fmt(v, m.d) + (m.unidad === '%' ? ' %' : m.unidad ? ` ${m.unidad}` : '')

/** Último registro de cada atleta dentro de la ventana ("YYYY-MM" o "latest" = histórico) y categoría. */
export function poolU(ds: DatasetU, win: Ventana, cat: string): RegistroU[] {
  const out: RegistroU[] = []
  for (const a of Object.values(ds.atletas)) {
    const enVentana = win === 'latest' ? a.tests : a.tests.filter((t) => monthKey(t.fecha) === win)
    if (!enVentana.length) continue
    out.push(enVentana[enVentana.length - 1])
  }
  return out.filter((t) => cat === 'all' || t.ath.cat === cat)
}

/** Evaluación previa = sesión anterior separada ≥ PREV_GAP_DAYS. */
export function prevU(t: RegistroU): RegistroU | null {
  const d0 = new Date(t.fecha.getFullYear(), t.fecha.getMonth(), t.fecha.getDate() - PREV_GAP_DAYS + 1)
  const a = t.ath.tests.filter((x) => x.fecha < d0)
  return a.length ? a[a.length - 1] : null
}

/** Z-score, percentil y normalizado 0–100 (100 = mejor) de una métrica sobre un pool. */
export function enrichU(pool: RegistroU[], m: MetricaU): { rows: RowU[]; s: ReturnType<typeof stats> } {
  const conValor = pool.filter((t) => ok(t.valores[m.key]))
  const s = stats(conValor.map((t) => t.valores[m.key]))
  const rows = conValor.map((t): RowU => {
    const v = t.valores[m.key]
    let n = s.max > s.min ? ((v - s.min) / (s.max - s.min)) * 100 : null
    if (m.menosEsMejor && n != null) n = 100 - n
    return { t, v, z: zOf(v, s, m.menosEsMejor), p: pctOf(v, s, m.menosEsMejor), n }
  })
  return { rows, s }
}

/** Mejor → peor según el sentido de la métrica. */
export const ordenarMejorPrimero = (rows: RowU[], m: MetricaU): RowU[] => [...rows].sort((a, b) => (m.menosEsMejor ? a.v - b.v : b.v - a.v))

export function buildCatRefU(ds: DatasetU, win: Ventana): CatRefU {
  const all = poolU(ds, win, 'all')
  const ref: CatRefU = {}
  for (const c of new Set(all.map((t) => t.ath.cat))) {
    const g = all.filter((t) => t.ath.cat === c)
    ref[c] = Object.fromEntries(ds.clave.map((m) => [m.key, stats(g.map((t) => t.valores[m.key]))]))
  }
  return ref
}

/**
 * Estado funcional universal: semáforo clínico de asimetrías (5 / 10 %) + peor
 * Z-score de las métricas clave contra su categoría + caída de la métrica
 * primaria vs el test anterior. Todo se itera sobre `key_metrics`.
 */
export function estadoU(t: RegistroU, ds: DatasetU, catRef: CatRefU): EstadoU {
  const ref = catRef[t.ath.cat] ?? {}
  let zMin: number | null = null
  let zMetrica: MetricaU | null = null
  for (const m of ds.clave) {
    const s = ref[m.key]
    if (!s || s.n < 5 || m.esAsim) continue
    const z = zOf(t.valores[m.key], s, m.menosEsMejor)
    if (z !== null && (zMin === null || z < zMin)) [zMin, zMetrica] = [z, m]
  }
  let asimMax: number | null = null
  let asimMetrica: MetricaU | null = null
  for (const m of ds.asimetrias) {
    const v = t.valores[m.key]
    if (ok(v) && (asimMax === null || v > asimMax)) [asimMax, asimMetrica] = [v, m]
  }
  const prev = prevU(t)
  let delta: number | null = null
  const p = ds.primaria
  if (prev && p && ok(t.valores[p.key]) && ok(prev.valores[p.key]) && prev.valores[p.key] !== 0) {
    const cruda = ((t.valores[p.key] - prev.valores[p.key]) / Math.abs(prev.valores[p.key])) * 100
    delta = p.menosEsMejor ? -cruda : cruda
  }
  const aR = asimMax !== null && asymLvlGenerico(asimMax) === 'r'
  const aA = asimMax !== null && asymLvlGenerico(asimMax) === 'a'
  const severe = zMin !== null && zMin <= -1.5
  const low = zMin !== null && zMin <= -1
  const drop = delta !== null && delta <= -15
  const dropM = delta !== null && delta <= -8
  const lvl: LvlU = aR || severe || drop ? 'r' : aA || low || dropM ? 'a' : 'g'
  const motivos: string[] = []
  if (asimMax !== null && asimMetrica && (aR || aA)) motivos.push(`Asimetría ${fmt(asimMax, 1)} % (${asimMetrica.label})`)
  if (zMin !== null && zMetrica && low) motivos.push(`${zMetrica.label}: Z ${fmt(zMin, 2)} vs su categoría`)
  if (delta !== null && p && dropM) motivos.push(`${p.label} ${fmt(delta, 1)} % vs test anterior`)
  return { lvl, motivos, zMin, zMetrica, asimMax, asimMetrica, delta, prev }
}

export const LVL_TXT_U: Record<LvlU, string> = { g: 'Apto', a: 'Precaución', r: 'Intervención' }
export const LVL_ICO_U: Record<LvlU, string> = { g: '🟢', a: '🟡', r: '🔴' }
export const LVL_COLOR_U: Record<LvlU, string> = { g: '#10b981', a: '#f59e0b', r: '#ef4444' }
