export interface SessionExecution {
  id: string
  planId: string
  athleteId: string
  season_id: string
  category_id: string
  fecha: string
  rpe: number
  duracionMin: number
  cargaInternaCalculada: number
  comentario?: string
}
