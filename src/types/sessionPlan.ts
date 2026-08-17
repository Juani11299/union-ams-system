import type { GymSheetData } from './gymSheet'

export type TipoSesion = 'Campo' | 'Gimnasio' | 'Partido' | 'Recuperación'

export type MatchDayTag = 'MD-4' | 'MD-3' | 'MD-2' | 'MD-1' | 'MD' | 'MD+1' | 'MD+2'

export interface SessionPlan {
  id: string
  season_id: string
  category_id: string
  titulo: string
  fecha: string
  matchDay: MatchDayTag
  tipo: TipoSesion
  duracionEstimadaMin: number
  cargaObjetivo: number
  descripcion?: string
  /** RPE esperado (1-10) cargado por el profe antes de la sesión — Fase 9.2. */
  rpeEsperado?: number
  /**
   * Tiempo total de trabajo real (min), cargado por el profe al finalizar la
   * sesión — Fase 9.2. El sRPE real de cada jugador se calcula dinámicamente
   * como `rpe_jugador × duracionRealMin` (ver calcularCargaEjecutadaReal). Si
   * no está cargado todavía, el sRPE se muestra como "Falta tiempo".
   */
  duracionRealMin?: number
  /** Planilla Estética de Gimnasio (Fase 16) — sólo sesiones tipo Gimnasio. */
  gymSheetData?: GymSheetData
}
