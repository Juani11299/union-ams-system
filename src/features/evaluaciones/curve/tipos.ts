/**
 * Motor de curva Fuerza-Tiempo (Fase 48). Un test de plataforma de fuerza
 * (ForceDecks) o dinamometría (NordBord) se exporta como MÉTRICAS POR FASE
 * (picos, medias, asimetrías) — no como la serie temporal cruda a alta
 * frecuencia. Este módulo RECONSTRUYE paramétricamente una curva F-t plausible
 * anclada en esas métricas reales (altura, RSI-modified, picos de fuerza,
 * físicas del vuelo) y audita contra el protocolo científico lo que SÍ es
 * calculable a partir de datos de resumen — nunca inventa lo que sólo la señal
 * cruda podría mostrar (fase de quietud, doble bajada, jerk inicial, quiebre
 * de cadera): esos hitos quedan marcados `'na'`, no `'ok'`.
 */

export type TestKind = 'cmj' | 'sj' | 'imtp' | 'nordic' | 'generico'

/** 'ok' = criterio cumplido · 'fail' = violación de protocolo · 'na' = no auditable con métricas de resumen (requiere serie cruda). */
export type EstadoHito = 'ok' | 'fail' | 'na'

export interface FaseCurva {
  id: string
  label: string
  t0: number
  t1: number
  color: string
}

export interface PuntoCurva {
  t: number
  total: number | null
  izq: number | null
  der: number | null
}

export interface HitoAuditoria {
  id: string
  fase: string
  label: string
  estado: EstadoHito
  /** Coordenadas para el nodo sobre la curva. */
  t: number
  f: number
  metrica: string
  valorReal: string
  criterioEsperado: string
  cita: string
  detalle: string
}

export interface ResultadoAuditoria {
  testKind: TestKind
  testLabel: string
  /** true = válido · false = con compensaciones · null = sin datos suficientes para un veredicto. */
  valida: boolean | null
  curva: PuntoCurva[]
  fases: FaseCurva[]
  hitos: HitoAuditoria[]
  /** true si hay canales de pierna izquierda/derecha además del total. */
  bilateral: boolean
  /** Unidad del eje Y de la curva ('N/kg' para ForceDecks relativo, 'N' para NordBord). */
  unidadFuerza: string
  /** Línea de referencia de peso corporal en `unidadFuerza` (null si no aplica, ej. NordBord). */
  refBW: number | null
  notaMetodologica: string
  citas: string[]
}
