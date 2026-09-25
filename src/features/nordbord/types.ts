/**
 * Dashboard NordBord (Fase 44) — migración a React del "NordBord Dashboard - Sep
 * 2026.html". Todo el módulo es independiente del resto de la app: jugadores y
 * categorías salen del CSV de NordBord + el peso/categoría de la última
 * antropometría (`useAntropometriasStore`), no de `athletes`.
 */

export type Lvl = 'g' | 'a' | 'r'
export type Lado = 'I' | 'D'

/** Un test del CSV con todas las métricas derivadas ya calculadas (`derive` en parser.ts). Inmutable después del ingest. */
export interface NbTest {
  id: number
  name: string
  key: string
  date: Date
  device: string
  csvCat: string
  csvPos: string
  csvBw: number | null
  /** Fuerza excéntrica pico izquierda / derecha (N). */
  L: number
  R: number
  LT: number | null
  RT: number | null
  LA: number | null
  RA: number | null
  LI: number | null
  RI: number | null
  /** (D − I) / máx(I, D) × 100 — negativo ⇒ domina la izquierda. */
  imb: number
  iimb: number | null
  Lkg: number | null
  Rkg: number | null
  // ── derivadas ──
  forceMean: number
  weakF: number
  strongF: number
  asym: number
  asymAbs: number
  weakSide: Lado
  torque: number | null
  avgForce: number | null
  impulse: number | null
  impAsymAbs: number | null
  forceRel: number | null
  torqueRel: number | null
  /** Puntaje de simetría 0–100 en escala fija (0 % → 100 · 10 % → 75 · 20 % → 50 · ≥ 40 % → 0). */
  sym: number | null
  bw: number | null
  ath: NbAthlete
}

/** Test dentro de un pool filtrado, con z / percentil / normalizado de la métrica elegida. */
export interface NbRow extends NbTest {
  _z: number | null
  _p: number | null
  _n: number | null
}

export type ComoSeVinculo = 'csv' | 'manual' | 'amb' | 'exact' | 'fuzzy' | 'none'

export interface NbAthlete {
  key: string
  name: string
  tests: NbTest[]
  cat: string
  bw: number | null
  pos: string | null
  rosterName?: string
  how: ComoSeVinculo
}

export interface RosterEntry {
  cat: string
  n: string
  bw: number | null
}

export interface InfoColumnas {
  meta: string[]
  ignored: string[]
  metrics: string[]
  empty: string[]
}

export interface Dataset {
  tests: NbTest[]
  athletes: Record<string, NbAthlete>
  colInfo: InfoColumnas
  invalid: Array<{ name: string; date: Date | null; why: string }>
  match: { exact: string[]; fuzzy: string[]; amb: string[]; none: string[]; csv: string[] }
  /** De dónde salen los datos (ej. "Supabase · export.csv"). */
  origen: string
  /** Filas del archivo descartadas al importar (sin datos válidos o intentos repetidos del día). */
  descartados: number
  nRows: number
  nCols: number
  rosterSize: number
}

export type MetricKey =
  | 'forceRel'
  | 'forceMean'
  | 'weakF'
  | 'torqueRel'
  | 'torque'
  | 'avgForce'
  | 'impulse'
  | 'asymAbs'
  | 'impAsymAbs'

export interface MetricDef {
  k: MetricKey
  label: string
  short: string
  u: string
  d: number
  /** Métrica donde MENOR es mejor (asimetrías): el Z-score se invierte. */
  inv?: boolean
}

export type PillarKey = 'forceMean' | 'forceRel' | 'torqueRel' | 'weakF' | 'avgForce' | 'sym'

export interface Stats {
  n: number
  mean: number
  sd: number
  min: number
  max: number
  cv: number
  vals: number[]
}

export interface Estado {
  lvl: Lvl
  zS: number | null
  delta: number | null
  prev: NbTest | null
  severe: boolean
  low: boolean
  drop: boolean
  dropM: boolean
  aR: boolean
  aA: boolean
}

/** Referencia por categoría para el estado funcional (fuerza vs su categoría). */
export type CatRef = Record<string, { rel: Stats; abs: Stats }>

export type Ventana = string // "YYYY-MM" o "latest"
