/**
 * "Microciclo Nº" opcional por semana (Fase 36) — un número chico, uno por
 * (temporada, categoría, semana), sólo para que el profe sepa en qué
 * microciclo de la temporada está. No tiene relación con la etiqueta
 * MD/MD+1/MD-2 de cada sesión (`SessionPlan.matchDay`) — ese campo se
 * llama "Sesión" en la interfaz, no "Microciclo".
 */
export interface WeeklyMicrocycle {
  id: string
  seasonId: string
  categoryId: string
  /** Siempre el LUNES de la semana (mismo criterio que `inicioDeSemana()` en `utils/fecha.ts`), formato YYYY-MM-DD. */
  semanaInicio: string
  numero: number
}
