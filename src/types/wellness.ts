export type WellnessRating = 1 | 2 | 3 | 4 | 5

export interface WellnessEntry {
  id: string
  athleteId: string
  season_id: string
  category_id: string
  fecha: string
  sueno: WellnessRating
  dolorMuscular: WellnessRating
  estres: WellnessRating
  fatiga: WellnessRating
  /** Comentario libre opcional ("¿Siente algún dolor?") — Fase 9. */
  comentarioDolor?: string
}
