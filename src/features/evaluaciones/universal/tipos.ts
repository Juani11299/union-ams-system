import type { Stats } from '@/features/nordbord/types'

/**
 * Plantilla Universal de tests (Fase 47) — el dashboard de NordBord generalizado.
 * Un test es cualquier conjunto de filas de `dynamic_evaluations` con el mismo
 * `test_name`: las métricas se leen del JSONB, nunca por nombre fijo.
 */

export type LvlU = 'g' | 'a' | 'r'

export interface MetricaU {
  key: string
  /** Nombre para mostrar (sin la unidad entre corchetes). */
  label: string
  unidad: string
  /** Decimales para mostrar. */
  d: number
  /** Menos es mejor: invierte Z-score, percentil y radar (asimetrías, tiempos). */
  menosEsMejor: boolean
  /** Contiene "Asym", "ASIM", "Asimetría", "Imbalance" o "L/R" → semáforo clínico 5 / 10 %. */
  esAsim: boolean
  /** Es la mitad izquierda o derecha de un par L/R (se oculta de los selectores; alimenta a las derivadas). */
  lateral: boolean
  /** Calculada por la plantilla (media I/D, asimetría de un par L/R, valor relativo al peso). */
  derivada: boolean
  /** Métrica clave del test (`key_metrics`): protagoniza Resumen, Grupal y Radar. */
  clave: boolean
}

export interface RegistroU {
  id: number
  key: string
  nombre: string
  fecha: Date
  /** YYYY-MM-DD */
  iso: string
  /** Valores por clave de métrica; las asimetrías vienen en valor ABSOLUTO. */
  valores: Record<string, number>
  meta: Record<string, string>
  ath: AtletaU
}

export interface AtletaU {
  key: string
  nombre: string
  cat: string
  bw: number | null
  rosterName?: string
  how: 'exact' | 'fuzzy' | 'amb' | 'none' | 'meta'
  /** Ordenados por fecha ascendente. */
  tests: RegistroU[]
}

export interface ConfigU {
  nombre: string
  icono: string
  archivo: string
  keyMetrics: string[]
  lessIsBetter: string[]
  unidades: Record<string, string>
  cargadoEn: string
}

export interface DatasetU {
  config: ConfigU
  metricas: MetricaU[]
  /** Métricas visibles en selectores (sin las laterales). */
  visibles: MetricaU[]
  clave: MetricaU[]
  /** Primera métrica clave: la que se usa para tendencias y "caída vs test anterior". */
  primaria: MetricaU | null
  asimetrias: MetricaU[]
  registros: RegistroU[]
  atletas: Record<string, AtletaU>
  match: { exact: string[]; fuzzy: string[]; amb: string[]; none: string[]; meta: string[] }
  origen: string
  descartados: number
  rosterSize: number
  /** Cantidad de atletas con peso corporal (antropometría o columna del archivo). */
  conPeso: number
}

export interface RowU {
  t: RegistroU
  v: number
  z: number | null
  p: number | null
  /** Min-Max 0–100 (100 = mejor). */
  n: number | null
}

export interface EstadoU {
  lvl: LvlU
  motivos: string[]
  /** Peor Z-score (ajustado por sentido) entre las métricas clave, respecto de su categoría. */
  zMin: number | null
  zMetrica: MetricaU | null
  asimMax: number | null
  asimMetrica: MetricaU | null
  /** Variación % de la métrica primaria vs el test anterior (positivo = mejoró). */
  delta: number | null
  prev: RegistroU | null
}

/** Referencia por categoría y métrica para el estado funcional. */
export type CatRefU = Record<string, Record<string, Stats>>

export type Ventana = string // "YYYY-MM" o "latest"
