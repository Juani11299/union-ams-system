/**
 * Carga Externa de Gimnasio (Fase 17) — lo que el jugador registra él mismo
 * en la Terminal de Fuerza táctil para el ejercicio troncal que el profe
 * marcó con 🎯 en la Planilla de Fuerza (`GymSheetEjercicio.isTracked`, Fase
 * 16). Un registro
 * por jugador por sesión de gimnasio (`unique (athlete_id, session_id)` en
 * `migration_fase17.sql`).
 */
export interface GymSet {
  reps: number
  weightKg: number
}

export interface GymExternalLoad {
  id: string
  athleteId: string
  sessionId: string
  exerciseName: string
  setsData: GymSet[]
  totalTonnage: number
  createdAt: string
}
