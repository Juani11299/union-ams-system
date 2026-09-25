import { MANUAL_MATCH, POSITIONS } from './constants'
import { norm, symScore } from './calculations'
import { matchRoster, tokenizarRoster } from './roster'
import type { Dataset, InfoColumnas, NbAthlete, NbTest, RosterEntry } from './types'

/**
 * Smart Parsing del export de NordBord (portado del HTML). Reconoce columnas por
 * nombre, separador `,` o `;`, fecha MM/DD/YYYY, y cruza cada atleta con el roster
 * (ficha antropométrica) para obtener categoría y peso corporal.
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
function pDate(ds: string, ts: string): Date | null {
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

type Cruda = Omit<
  NbTest,
  | 'forceMean' | 'weakF' | 'strongF' | 'asym' | 'asymAbs' | 'weakSide' | 'torque' | 'avgForce' | 'impulse' | 'impAsymAbs'
  | 'forceRel' | 'torqueRel' | 'sym' | 'bw' | 'ath'
>

/** Métricas derivadas de un test según el peso corporal del atleta. */
function derive(c: Cruda, a: NbAthlete): NbTest {
  const bw = a.bw || null
  const forceMean = (c.L + c.R) / 2
  const asymAbs = Math.abs(c.imb)
  const torque = c.LT != null && c.RT != null ? (c.LT + c.RT) / 2 : null
  const avgForce = c.LA != null && c.RA != null ? (c.LA + c.RA) / 2 : null
  const impulse = c.LI != null && c.RI != null ? (c.LI + c.RI) / 2 : null
  return {
    ...c,
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

export type ResultadoIngest = { ok: true; data: Dataset } | { ok: false; error: string }

export function ingest(text: string, fileName: string, roster: RosterEntry[]): ResultadoIngest {
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
    imb: fi(/^Max Imbalance/i),
    LT: fi(/^L Max Torque \(Nm\)$/i),
    RT: fi(/^R Max Torque \(Nm\)$/i),
    LA: fi(/^L Avg Force \(N\)$/i),
    RA: fi(/^R Avg Force \(N\)$/i),
    LI: fi(/^L Max Impulse \(Ns\)$/i),
    RI: fi(/^R Max Impulse \(Ns\)$/i),
    iimb: fi(/^Impulse Imbalance/i),
    Lkg: fi(/^L Max Force Per Kg/i),
    Rkg: fi(/^R Max Force Per Kg/i),
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

  // clasificación de columnas
  const colInfo: InfoColumnas = { meta: [], ignored: [], metrics: [], empty: [] }
  const metaIdx = new Set([col.name, col.date, col.time, col.cat, col.pos, col.bw].filter((i) => i >= 0))
  H.forEach((h, i) => {
    if (metaIdx.has(i)) colInfo.meta.push(h)
    else if (IGNORE_RE.test(h)) colInfo.ignored.push(h)
    else {
      const filled = P.rows.filter((r) => num(r, i) != null).length
      ;(filled ? colInfo.metrics : colInfo.empty).push(h)
    }
  })

  const crudos: Cruda[] = []
  const invalid: Dataset['invalid'] = []
  P.rows.forEach((r, ri) => {
    const name = str(r, col.name).replace(/\s+/g, ' ')
    const L = num(r, col.LF)
    const R = num(r, col.RF)
    const date = pDate(str(r, col.date), str(r, col.time))
    if (!name || !((L ?? 0) > 0) || !((R ?? 0) > 0) || !date) {
      invalid.push({ name: name || '(sin nombre)', date, why: !((L ?? 0) > 0 && (R ?? 0) > 0) ? 'Fuerza = 0 (test no válido)' : 'Fecha inválida' })
      return
    }
    const l = L as number
    const rr = R as number
    let imb = num(r, col.imb)
    if (imb == null) imb = ((rr - l) / Math.max(l, rr)) * 100
    const LI = num(r, col.LI)
    const RI = num(r, col.RI)
    let iimb = num(r, col.iimb)
    if (iimb == null && LI && RI) iimb = ((RI - LI) / Math.max(LI, RI)) * 100
    crudos.push({
      id: ri, name, key: norm(name), date, device: str(r, col.device),
      csvCat: str(r, col.cat), csvPos: str(r, col.pos), csvBw: num(r, col.bw),
      L: l, R: rr, LT: num(r, col.LT), RT: num(r, col.RT), LA: num(r, col.LA), RA: num(r, col.RA), LI, RI,
      imb, iimb, Lkg: num(r, col.Lkg), Rkg: num(r, col.Rkg),
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
    a.cat = a.cat || 'Sin categoría'
    a.pos = POSITIONS[a.name] || ordenados.map((t) => t.csvPos).filter(Boolean).pop() || null
    for (const c of ordenados) {
      const t = derive(c, a)
      a.tests.push(t)
      porId.set(c.id, t)
    }
    athletes[key] = a
  }
  // `tests` conserva el orden del archivo, igual que el HTML original.
  for (const c of crudos) {
    const t = porId.get(c.id)
    if (t) tests.push(t)
  }

  return {
    ok: true,
    data: { tests, athletes, colInfo, invalid, match, sep: P.sep, nRows: P.rows.length, nCols: H.length, fileName, rosterSize: roster.length },
  }
}
