/**
 * Biblioteca de Plantillas de Fuerza (Fase 12) — a diferencia de `BloqueFuerza`
 * (Kanban único por season/category, Fase 7), una plantilla es de CLUB: se arma
 * una vez y se reutiliza arrastrándola sobre cualquier día de cualquier
 * microciclo, en cualquier temporada/categoría.
 */
export type TipoPlantillaFuerza = 'General' | 'Vitamina'

export const TIPOS_PLANTILLA_FUERZA: TipoPlantillaFuerza[] = ['General', 'Vitamina']

export interface StrengthTemplate {
  id: string
  club_id: string
  tipo: TipoPlantillaFuerza
  nombre: string
  descripcion?: string
}

/** Ejercicio reusable dentro de una plantilla (misma forma que `BloqueFuerza`, sin columna de Kanban). */
export interface StrengthTemplateExercise {
  id: string
  templateId: string
  titulo: string
  seriesReps: string
  cargaPct?: string
  notas?: string
  orden: number
}

/** Una plantilla aplicada a un día puntual del microciclo (arrastrada y soltada). */
export interface StrengthAssignment {
  id: string
  templateId: string
  sessionPlanId: string
  tipo: TipoPlantillaFuerza
}

/** A qué jugador puntual le aplica una asignación (todo el plantel si es General, elegidos a mano si es Vitamina). */
export interface StrengthAssignmentAthlete {
  id: string
  assignmentId: string
  athleteId: string
}
