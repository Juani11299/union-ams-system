import { MANUAL_MATCH, POSITIONS } from './constants'
import { symScore } from './calculations'
import { matchRoster, tokenizarRoster } from './roster'
import { TEST_NORDBORD } from '@/features/evaluaciones/dinamicas'
import type { FilaEvaluacionDinamica, ValorMetrica } from '@/features/evaluaciones/dinamicas'
import { normalizarNombre } from '@/utils/smartEntityMatcher'
import type { Dataset, NbAthlete, NbTest, RosterEntry } from './types'

/**
 * Smart Parsing del export de NordBord (portado del HTML) en dos etapas:
 *
 * 1. `filasNordBordDesdeCsv` — CSV → filas de `dynamic_evaluations` (un jugador
 *    por fecha, TODAS las columnas numéricas en crudo dentro de `metrics`).
 *    Reconoce columnas por nombre, separador `,` o `;` y fecha MM/DD/YYYY.
 * 2. `datasetDesdeFilas` — filas (leídas de Supabase) → `Dataset` del dashboard:
 *    cruza cada atleta con el roster (ficha antropométrica) para obtener categoría
 *    y peso corporal y calcula las métricas derivadas.
 *
 * Como la tabla tiene UNIQUE (test_name, player_key, fecha), si un jugador tiene
 * varios intentos el mismo día se guarda el MEJOR (mayor fuerza media) — es el
 * mismo intento que el dashboard ya tomaba para ese día.
 */

interface CsvParseado {
  sep: string
  header: string[]
  rows: string[][]
}

export function parseCSV(textoOriginal: string): CsvParseado {
  const text = textoOriginal.replace(/^﻿/, '')
  const finLinea = text.search(/\r?\n/)
  const first = text.slice(0, finLinea > 0 ? finLinea : text.length)
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let f = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          f += '"'
          i++
        } else q = false
      } else f += c
    } else if (c === '"') q = true
    else if (c === sep) {
      row.push(f)
      f = ''
    } else if (c === '\n') {
      row.push(f)
      rows.push(row)
      row = []
      f = ''
    } else if (c !== '\r') f += c
  }
  if (f !== '' || row.length) {
    row.push(f)
    rows.push(row)
  }
  return { sep, header: (rows[0] ?? []).map((h) => h.trim()), rows: rows.slice(1).filter((r) => r.some((x) => x.trim() !== '')) }
}

const IGNORE_RE = /^(dni|at_id|test_id|externalid|tags|fec nac|notes|device|test|time utc|l reps|r reps)$/i

/** Fecha del CSV. NordBord exporta MM/DD/YYYY; si el primer número > 12 se interpreta DD/MM. */
export function pDate(ds: string, ts: string): Date | null {
  const m = ds.match(/(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (!m) return null
  const a = +m[1]
  const b = +m[2]
  let y = +m[3]
  let mo: number
  let da: number
  if (m[1].length === 4) {
    y = a
    mo = b
    da = +m[3]
  } else if (a > 12) {
    da = a
    mo = b
  } else {
    mo = a
    da = b
  }
  if (y < 100) y += 2000
  let h = 0
  let mi = 0
  const t = (ts || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (t) {
    h = +t[1]
    mi = +t[2]
    if (t[3]) {
      const pm = /pm/i.test(t[3])
      if (pm && h < 12) h += 12
      if (!pm && h === 12) h = 0
    }
  }
  return new Date(y, mo - 1, da, h, mi)
}


// ─────────────────────────────────────────────────────────────────────────────
// 1) CSV → filas de dynamic_evaluations
// ─────────────────────────────────────────────────────────────────────────────

const isoDeFecha = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Fila lista para guardar; la categoría la completa el dashboard con el cruce contra las antropometrías. */
export type FilaNordBordNueva = Omit<FilaEvaluacionDinamica, 'test_config' | 'category_label' | 'id'>

export type ResultadoCsvNordBord =
  | { ok: true; filas: FilaNordBordNueva[]; descartados: number; nRows: number }
  | { ok: false; error: string }

export function filasNordBordDesdeCsv(text: string): ResultadoCsvNordBord {
  const P = parseCSV(text)
  const H = P.header
  const fi = (re: RegExp) => H.findIndex((h) => re.test(h))
  const col = {
    name: fi(/^(name|jugador|nombre|athlete)$/i),
    date: fi(/^(date utc|fecha|date)$/i),
    time: fi(/^time/i),
    device: fi(/^device$/i),
    cat: fi(/^(cat|categor[ií]a|a[ñn]o|divisi[oó]n)$/i),
    pos: fi(/^(pos|posici[oó]n|position)$/i),
    bw: fi(/^(bw( \[kg\])?|peso|body ?weight|body ?mass)/i),
    LF: fi(/^L Max Force \(N\)$/i),
    RF: fi(/^R Max Force \(N\)$/i),
  }
  if (col.name < 0 || col.LF < 0 || col.RF < 0) {
    return {
      ok: false,
      error: 'Formato no reconocido: se esperaba un export de NordBord con columnas "Name", "L Max Force (N)" y "R Max Force (N)".',
    }
  }
  const num = (r: string[], i: number): number | null => {
    if (i < 0) return null
    let s = (r[i] ?? '').trim()
    if (!s) return null
    if (P.sep === ';') s = s.replace(/\./g, '').replace(',', '.')
    const v = parseFloat(s)
    return Number.isFinite(v) ? v : null
  }
  const str = (r: string[], i: number): string => (i < 0 ? '' : (r[i] ?? '').trim())

  // Columnas de métricas: todas las numéricas que no son metadatos ni identificadores.
  const metaIdx = new Set([col.name, col.date, col.time, col.cat, col.pos, col.bw, col.device].filter((i) => i >= 0))
  const metricasIdx = H.map((h, i) => ({ h, i })).filter(({ h, i }) => !metaIdx.has(i) && !IGNORE_RE.test(h) && P.rows.some((r) => num(r, i) != null))

  const mejorPorClave = new Map<string, FilaNordBordNueva & { _fuerza: number }>()
  let descartados = 0
  for (const r of P.rows) {
    const name = str(r, col.name).replace(/\s+/g, ' ')
    const L = num(r, col.LF)
    const R = num(r, col.RF)
    const date = pDate(str(r, col.date), str(r, col.time))
    if (!name || !((L ?? 0) > 0) || !((R ?? 0) > 0) || !date) {
      descartados++
      continue
    }
    const metrics: Record<string, ValorMetrica> = {}
    for (const { h, i } of metricasIdx) {
      const v = num(r, i)
      if (v !== null) metrics[h] = v
    }
    const dev = str(r, col.device)
    const time = str(r, col.time)
    const cat = str(r, col.cat)
    const pos = str(r, col.pos)
    const bw = num(r, col.bw)
    if (dev) metrics._device = dev
    if (time) metrics._time = time
    if (cat) metrics._cat = cat
    if (pos) metrics._pos = pos
    if (bw !== null) metrics._bw = bw

    const player_key = normalizarNombre(name)
    const fecha = isoDeFecha(date)
    const clave = `${player_key}|${fecha}`
    const fuerza = ((L as number) + (R as number)) / 2
    const previa = mejorPorClave.get(clave)
    if (previa) descartados++ // intento repetido del mismo día: queda el mejor
    if (!previa || fuerza > previa._fuerza) mejorPorClave.set(clave, { test_name: TEST_NORDBORD, player_name: name, player_key, fecha, metrics, _fuerza: fuerza })
  }
  const filas = [...mejorPorClave.values()].map(({ _fuerza: _f, ...f }) => f)
  return { ok: true, filas, descartados, nRows: P.rows.length }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2) filas de dynamic_evaluations → Dataset del dashboard
// ─────────────────────────────────────────────────────────────────────────────

type Cruda = Omit<
  NbTest,
  | 'forceMean' | 'weakF' | 'strongF' | 'asym' | 'asymAbs' | 'weakSide' | 'torque' | 'avgForce' | 'impulse' | 'impAsymAbs'
  | 'forceRel' | 'torqueRel' | 'sym' | 'bw' | 'ath'
> & { catRespaldo: string }

/** Métricas derivadas de un test según el peso corporal del atleta. */
function derive(c: Cruda, a: NbAthlete): NbTest {
  const { catRespaldo: _r, ...base } = c
  const bw = a.bw || null
  const forceMean = (c.L + c.R) / 2
  const asymAbs = Math.abs(c.imb)
  const torque = c.LT != null && c.RT != null ? (c.LT + c.RT) / 2 : null
  const avgForce = c.LA != null && c.RA != null ? (c.LA + c.RA) / 2 : null
  const impulse = c.LI != null && c.RI != null ? (c.LI + c.RI) / 2 : null
  return {
    ...base,
    forceMean,
    weakF: Math.min(c.L, c.R),
    strongF: Math.max(c.L, c.R),
    asym: c.imb,
    asymAbs,
    weakSide: c.imb < 0 ? 'D' : 'I', // imb = (D−I)/máx·100
    torque,
    avgForce,
    impulse,
    impAsymAbs: c.iimb != null ? Math.abs(c.iimb) : null,
    forceRel: c.Lkg != null && c.Rkg != null ? (c.Lkg + c.Rkg) / 2 : bw ? forceMean / bw : null,
    torqueRel: bw && torque != null ? torque / bw : null,
    sym: symScore(asymAbs),
    bw,
    ath: a,
  }
}

/** Valor numérico de la primera clave de `metrics` que calce con el patrón. */
function metrica(m: Record<string, ValorMetrica>, re: RegExp): number | null {
  const k = Object.keys(m).find((x) => re.test(x))
  const v = k ? m[k] : null
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
const texto = (v: ValorMetrica | undefined): string => (typeof v === 'string' ? v : '')

/** Reconstruye el `Dataset` del dashboard a partir de las filas del test 'NordBord' (JSONB). */
export function datasetDesdeFilas(filas: FilaEvaluacionDinamica[], roster: RosterEntry[]): Dataset {
  const crudos: Cruda[] = []
  filas.forEach((f, id) => {
    const m = f.metrics
    const L = metrica(m, /^L Max Force \(N\)$/i)
    const R = metrica(m, /^R Max Force \(N\)$/i)
    if (L === null || R === null || L <= 0 || R <= 0) return
    const [y, mo, d] = f.fecha.split('-').map(Number)
    let imb = metrica(m, /^Max Imbalance/i)
    if (imb == null) imb = ((R - L) / Math.max(L, R)) * 100
    const LI = metrica(m, /^L Max Impulse \(Ns\)$/i)
    const RI = metrica(m, /^R Max Impulse \(Ns\)$/i)
    let iimb = metrica(m, /^Impulse Imbalance/i)
    if (iimb == null && LI && RI) iimb = ((RI - LI) / Math.max(LI, RI)) * 100
    const bw = m._bw
    crudos.push({
      id, name: f.player_name, key: f.player_key, date: new Date(y, mo - 1, d), device: texto(m._device),
      csvCat: texto(m._cat), csvPos: texto(m._pos), csvBw: typeof bw === 'number' ? bw : null,
      L, R, LT: metrica(m, /^L Max Torque \(Nm\)$/i), RT: metrica(m, /^R Max Torque \(Nm\)$/i),
      LA: metrica(m, /^L Avg Force \(N\)$/i), RA: metrica(m, /^R Avg Force \(N\)$/i), LI, RI,
      imb, iimb, Lkg: metrica(m, /^L Max Force Per Kg/i), Rkg: metrica(m, /^R Max Force Per Kg/i),
      catRespaldo: f.category_label,
    })
  })

  // atletas + cruce con el roster
  const RN = tokenizarRoster(roster)
  const porKey = new Map<string, Cruda[]>()
  for (const c of crudos) {
    const arr = porKey.get(c.key)
    if (arr) arr.push(c)
    else porKey.set(c.key, [c])
  }
  const athletes: Record<string, NbAthlete> = {}
  const match: Dataset['match'] = { exact: [], fuzzy: [], amb: [], none: [], csv: [] }
  const tests: NbTest[] = []
  const porId = new Map<number, NbTest>()

  for (const [key, grupo] of porKey) {
    const ordenados = [...grupo].sort((x, y) => x.date.getTime() - y.date.getTime())
    const a: NbAthlete = { key, name: grupo[0].name, tests: [], cat: '', bw: null, pos: null, how: 'none' }
    const withCsv = [...ordenados].filter((t) => t.csvCat || t.csvBw).pop()
    if (withCsv) {
      a.cat = withCsv.csvCat || ''
      a.bw = withCsv.csvBw || null
      a.how = 'csv'
      match.csv.push(a.name)
    } else if (MANUAL_MATCH[a.name]) {
      a.cat = MANUAL_MATCH[a.name].cat ?? ''
      a.bw = MANUAL_MATCH[a.name].bw ?? null
      a.how = 'manual'
      match.exact.push(a.name)
    } else {
      const m = matchRoster(a.name, RN)
      if (m && 'amb' in m) {
        a.how = 'amb'
        match.amb.push(`${a.name} → ${m.amb.map((r) => `${r.n} (${r.cat})`).join(' / ')}`)
      } else if (m) {
        a.cat = m.r.cat
        a.bw = m.r.bw
        a.rosterName = m.r.n
        a.how = m.sc === 1 ? 'exact' : 'fuzzy'
        ;(m.sc === 1 ? match.exact : match.fuzzy).push(`${a.name} → ${m.r.n} (${m.r.cat})`)
      } else {
        a.how = 'none'
        match.none.push(a.name)
      }
    }
    // Sin cruce con la ficha antropométrica: cae a la categoría que quedó guardada en la fila.
    const respaldo = ordenados[ordenados.length - 1].catRespaldo
    a.cat = a.cat || (respaldo && respaldo !== 'Sin categoría' ? respaldo : '') || 'Sin categoría'
    a.pos = POSITIONS[a.name] || ordenados.map((t) => t.csvPos).filter(Boolean).pop() || null
    for (const c of ordenados) {
      const t = derive(c, a)
      a.tests.push(t)
      porId.set(c.id, t)
    }
    athletes[key] = a
  }
  for (const c of crudos) {
    const t = porId.get(c.id)
    if (t) tests.push(t)
  }

  const claves = [...new Set(filas.flatMap((f) => Object.keys(f.metrics)))]
  const archivo = filas.map((f) => f.test_config.archivo).filter(Boolean).pop() ?? ''
  return {
    tests,
    athletes,
    colInfo: {
      meta: ['Name', 'Date UTC', 'Device', ...claves.filter((k) => k.startsWith('_')).map((k) => k.slice(1))],
      ignored: [],
      metrics: claves.filter((k) => !k.startsWith('_')),
      empty: [],
    },
    invalid: [],
    match,
    origen: archivo ? `Supabase · ${archivo}` : 'Supabase · dynamic_evaluations',
    descartados: filas.reduce((mx, f) => Math.max(mx, f.test_config.descartados ?? 0), 0),
    nRows: filas.length,
    nCols: claves.filter((k) => !k.startsWith('_')).length,
    rosterSize: roster.length,
  }
}
