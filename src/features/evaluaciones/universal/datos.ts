import { matchRoster, tokenizarRoster } from '@/features/nordbord/roster'
import type { RosterEntry } from '@/features/nordbord/types'
import { catDeLabel } from '../categorias'
import { unidadDe } from '../dinamicas'
import type { ConfigTest, FilaEvaluacionDinamica } from '../dinamicas'
import type { AtletaU, ConfigU, DatasetU, MetricaU, RegistroU } from './tipos'

/**
 * De filas de `dynamic_evaluations` (un test) al `DatasetU` de la plantilla
 * universal. Todo se deduce de las claves del JSONB: nada depende de nombres
 * de métricas de un test en particular.
 *
 * - Detecta asimetrías por nombre ("Asym", "ASIM", "Asimetría", "Imbalance",
 *   "L/R") → semáforo clínico estricto.
 * - Detecta pares L/R ("L Max Force (N)" + "R Max Force (N)", o "X (L)" + "X (R)")
 *   y deriva la media I/D y, si el test no trae asimetrías propias, la asimetría.
 * - Resuelve el peso corporal por antropometría (o la columna del archivo) y
 *   deriva la versión relativa (N/kg) de las métricas de fuerza.
 */

const ASIM_RE = /asym|asim|imbalance|l\s*\/\s*r/i
export const esAsim = (k: string): boolean => ASIM_RE.test(k)

const PARES: Array<[RegExp, 'prefijo' | 'sufijo']> = [
  [/^([LR])\s+(.+)$/, 'prefijo'],
  [/^(.*\S)\s*\(([LR])\)\s*$/, 'sufijo'],
]

interface LadoInfo {
  base: string
  lado: 'L' | 'R'
}

function ladoDe(key: string): LadoInfo | null {
  const k = key.trim()
  const pre = k.match(PARES[0][0])
  if (pre) return { base: pre[2].trim(), lado: pre[1] as 'L' | 'R' }
  const suf = k.match(PARES[1][0])
  if (suf) return { base: suf[1].trim(), lado: suf[2] as 'L' | 'R' }
  return null
}

const limpiarLabel = (key: string): string => key.replace(/\s*\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim()

const PRIORIDAD = [/jump height|altura/i, /rsi/i, /force|fuerza/i, /power|potencia/i, /torque/i, /sprint|velocidad|speed|tiempo/i]
const prioridad = (k: string): number => {
  const i = PRIORIDAD.findIndex((re) => re.test(k))
  return i < 0 ? PRIORIDAD.length : i
}
/** Columnas numéricas que no son una medición del atleta (repeticiones, carga adicional del protocolo). */
const esRuido = (k: string): boolean => /^reps?(\s*\(.*\))?$/i.test(k.trim()) || /additional load|carga adicional/i.test(k)
const esFuerza = (unidad: string): boolean => /^(n|nm|ns|w)$/i.test(unidad)
/** Métricas de tiempo (tiempo al pico, sprints): menos es mejor y no son buenas candidatas a métrica clave automática. */
const esTiempo = (k: string): boolean => /time\s+to|tiempo|sprint/i.test(k) || unidadDe(k).toLowerCase() === 's'

function decimales(unidad: string, vals: number[]): number {
  if (unidad === '%') return 1
  const mx = Math.max(0, ...vals.map((v) => Math.abs(v)))
  return mx >= 100 ? 0 : mx >= 10 ? 1 : 2
}

/** Config más reciente del test (una re-subida puede haber cambiado el ícono o las claves). */
function configDe(nombre: string, filas: FilaEvaluacionDinamica[], override?: Partial<ConfigTest>): ConfigU {
  const guardada = filas.reduce<ConfigTest>((mejor, f) => ((f.test_config.cargado_en ?? '') >= (mejor.cargado_en ?? '') ? f.test_config : mejor), filas[0]?.test_config ?? {})
  const cfg: ConfigTest = { ...guardada, ...override }
  return {
    nombre,
    icono: cfg.icono ?? '🧪',
    archivo: cfg.archivo ?? '',
    keyMetrics: cfg.key_metrics ?? [],
    lessIsBetter: cfg.less_is_better ?? [],
    unidades: cfg.unidades ?? {},
    cargadoEn: cfg.cargado_en ?? '',
  }
}

/** `override` permite que quien abre el dashboard pise partes de la config guardada (nombre, `key_metrics`, `less_is_better`). */
export function construirDatasetU(nombre: string, filas: FilaEvaluacionDinamica[], roster: RosterEntry[], override?: Partial<ConfigTest>): DatasetU {
  const config = configDe(nombre, filas, override)

  // ── claves numéricas del JSONB, en orden de aparición
  const claves: string[] = []
  const vistas = new Set<string>()
  for (const f of filas)
    for (const [k, v] of Object.entries(f.metrics)) {
      if (k.startsWith('_') || typeof v !== 'number' || !Number.isFinite(v) || vistas.has(k) || esRuido(k)) continue
      vistas.add(k)
      claves.push(k)
    }

  // ── atletas + cruce con la ficha antropométrica
  const RN = tokenizarRoster(roster)
  const porKey = new Map<string, FilaEvaluacionDinamica[]>()
  for (const f of filas) {
    const arr = porKey.get(f.player_key)
    if (arr) arr.push(f)
    else porKey.set(f.player_key, [f])
  }
  const atletas: Record<string, AtletaU> = {}
  const match: DatasetU['match'] = { exact: [], fuzzy: [], amb: [], none: [], meta: [] }
  for (const [key, grupo] of porKey) {
    const ord = [...grupo].sort((a, b) => a.fecha.localeCompare(b.fecha))
    const a: AtletaU = { key, nombre: grupo[0].player_name, cat: '', bw: null, how: 'none', tests: [] }
    const m = matchRoster(a.nombre, RN)
    if (m && 'amb' in m) {
      a.how = 'amb'
      match.amb.push(`${a.nombre} → ${m.amb.map((r) => `${r.n} (${r.cat})`).join(' / ')}`)
    } else if (m) {
      a.cat = m.r.cat
      a.bw = m.r.bw
      a.rosterName = m.r.n
      a.how = m.sc === 1 ? 'exact' : 'fuzzy'
      ;(m.sc === 1 ? match.exact : match.fuzzy).push(`${a.nombre} → ${m.r.n} (${m.r.cat})`)
    } else {
      match.none.push(a.nombre)
    }
    // Sin cruce: categoría y peso que trae el propio archivo.
    const bwMeta = [...ord].reverse().map((f) => f.metrics._bw).find((v): v is number => typeof v === 'number' && v > 0)
    if (!a.bw && bwMeta) {
      a.bw = bwMeta
      if (a.how === 'none') {
        a.how = 'meta'
        match.none.pop()
        match.meta.push(a.nombre)
      }
    }
    const catArchivo = catDeLabel(ord[ord.length - 1].category_label)
    a.cat = a.cat || (catArchivo && catArchivo !== 'Sin categoría' ? catArchivo : '') || 'Sin categoría'
    atletas[key] = a
  }

  // ── pares L/R → derivadas
  const laterales = new Set<string>()
  const pares = new Map<string, { L?: string; R?: string }>()
  for (const k of claves) {
    if (esAsim(k) && !ladoDe(k)) continue
    const l = ladoDe(k)
    if (!l) continue
    laterales.add(k)
    const p = pares.get(l.base) ?? {}
    p[l.lado] = k
    pares.set(l.base, p)
  }
  const completos = [...pares.entries()].filter((e): e is [string, { L: string; R: string }] => !!e[1].L && !!e[1].R)
  const hayAsimExplicita = claves.some((k) => esAsim(k))
  // Si el archivo ya trae la métrica principal (ej. "Jump Height [cm]" junto a sus (L)/(R)), no se duplica con una media derivada.
  const medias = completos.filter(([base]) => !vistas.has(base)).map(([base, p]) => ({ key: `Media ${base}`, label: `Media ${limpiarLabel(base)}`, unidad: unidadDe(base), L: p.L, R: p.R, base }))
  const asimDerivadas = hayAsimExplicita
    ? []
    : completos.slice().sort((a, b) => prioridad(a[0]) - prioridad(b[0])).slice(0, 6).map(([base, p]) => ({ key: `Asim. ${base}`, label: `Asimetría ${limpiarLabel(base)}`, unidad: '%', L: p.L, R: p.R }))
  // Versión relativa al peso de las 2 primeras medias de fuerza.
  const relativas = medias.filter((m) => esFuerza(m.unidad)).sort((a, b) => prioridad(a.base) - prioridad(b.base)).slice(0, 2).map((m) => ({ key: `${m.key} / kg`, label: `${m.label} / kg`, unidad: `${m.unidad}/kg`, media: m.key }))

  // ── registros
  const registros: RegistroU[] = []
  filas.forEach((f, id) => {
    const a = atletas[f.player_key]
    const [y, mo, d] = f.fecha.split('-').map(Number)
    const valores: Record<string, number> = {}
    for (const k of claves) {
      const v = f.metrics[k]
      if (typeof v === 'number' && Number.isFinite(v)) valores[k] = esAsim(k) ? Math.abs(v) : v
    }
    for (const m of medias) if (valores[m.L] !== undefined && valores[m.R] !== undefined) valores[m.key] = (valores[m.L] + valores[m.R]) / 2
    for (const s of asimDerivadas) {
      const l = valores[s.L]
      const r = valores[s.R]
      if (l !== undefined && r !== undefined && Math.max(l, r) > 0) valores[s.key] = (Math.abs(l - r) / Math.max(l, r)) * 100
    }
    if (a.bw) for (const r of relativas) if (valores[r.media] !== undefined) valores[r.key] = valores[r.media] / a.bw
    const meta: Record<string, string> = {}
    for (const [k, v] of Object.entries(f.metrics)) if (k.startsWith('_') && typeof v === 'string') meta[k.slice(1)] = v
    registros.push({ id, key: f.player_key, nombre: f.player_name, fecha: new Date(y, mo - 1, d), iso: f.fecha, valores, meta, ath: a })
  })
  for (const r of registros) r.ath.tests.push(r)
  for (const a of Object.values(atletas)) a.tests.sort((x, y) => x.fecha.getTime() - y.fecha.getTime())

  // ── catálogo de métricas
  const inversas = new Set(config.lessIsBetter)
  const todas: Array<Omit<MetricaU, 'clave' | 'd'> & { orden: number }> = []
  claves.forEach((k, i) =>
    todas.push({
      key: k, label: limpiarLabel(k), unidad: config.unidades[k] ?? unidadDe(k), esAsim: esAsim(k),
      menosEsMejor: inversas.has(k) || esAsim(k) || (config.unidades[k] ?? unidadDe(k)).toLowerCase() === 's',
      lateral: laterales.has(k), derivada: false, orden: i,
    }),
  )
  const base = claves.length
  medias.forEach((m, i) => todas.push({ key: m.key, label: m.label, unidad: m.unidad, esAsim: false, menosEsMejor: esTiempo(m.base), lateral: false, derivada: true, orden: base + i }))
  asimDerivadas.forEach((s, i) => todas.push({ key: s.key, label: s.label, unidad: '%', esAsim: true, menosEsMejor: true, lateral: false, derivada: true, orden: base + medias.length + i }))
  relativas.forEach((r, i) => todas.push({ key: r.key, label: r.label, unidad: r.unidad, esAsim: false, menosEsMejor: false, lateral: false, derivada: true, orden: base + medias.length + asimDerivadas.length + i }))
  const conDatos = todas.filter((m) => registros.some((r) => r.valores[m.key] !== undefined))

  // ── métricas clave: las del config; si no hay, las 6 más representativas (relativas → medias → propias)
  const existentes = new Set(conDatos.map((m) => m.key))
  let keyMetrics = config.keyMetrics.filter((k) => existentes.has(k))
  if (keyMetrics.length === 0) {
    const cand = [
      ...conDatos.filter((m) => m.derivada && m.key.endsWith('/ kg')),
      ...conDatos.filter((m) => m.derivada && m.key.startsWith('Media ')),
      ...conDatos.filter((m) => !m.derivada && !m.lateral && !m.esAsim),
    ].filter((m) => !esTiempo(m.key))
    keyMetrics = [...new Map(cand.map((m) => [m.key, m])).values()]
      .sort((a, b) => (a.key.endsWith('/ kg') === b.key.endsWith('/ kg') ? prioridad(a.key) - prioridad(b.key) : a.key.endsWith('/ kg') ? -1 : 1))
      .slice(0, 6)
      .map((m) => m.key)
  }
  const setClave = new Set(keyMetrics)
  const metricas: MetricaU[] = conDatos.map((m) => {
    const vals = registros.map((r) => r.valores[m.key]).filter((v): v is number => v !== undefined)
    return { key: m.key, label: m.label, unidad: m.unidad, d: decimales(m.unidad, vals), menosEsMejor: m.menosEsMejor, esAsim: m.esAsim, lateral: m.lateral, derivada: m.derivada, clave: setClave.has(m.key) }
  })
  const clave = keyMetrics.map((k) => metricas.find((m) => m.key === k)).filter((m): m is MetricaU => !!m)
  const visibles = metricas.filter((m) => !m.lateral)
  const archivo = config.archivo

  return {
    config,
    metricas,
    visibles,
    clave,
    primaria: clave.find((m) => !m.esAsim) ?? clave[0] ?? null,
    asimetrias: metricas.filter((m) => m.esAsim),
    registros,
    atletas,
    match,
    origen: archivo ? `Supabase · ${archivo}` : 'Supabase · dynamic_evaluations',
    descartados: filas.reduce((mx, f) => Math.max(mx, f.test_config.descartados ?? 0), 0),
    rosterSize: roster.length,
    conPeso: Object.values(atletas).filter((a) => a.bw).length,
  }
}
