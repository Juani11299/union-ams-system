/**
 * Evaluación de Rendimiento (Fase 38) — UN resultado de UN jugador en UNA
 * batería de test (CMJ, Sprint 30m, Fuerza Isométrica, etc.), importada por
 * CSV. `metrics` es flexible a propósito (JSONB en Supabase): cada tipo de
 * test trae columnas numéricas distintas, así que en vez de una tabla SQL
 * con una columna fija por métrica, se guarda como mapa nombre→valor.
 *
 * `evaluationName` es el "tipo" de evaluación (ej. "CMJ — Marzo 2026") — el
 * Análisis Grupal compara la fecha más reciente contra la anterior DENTRO
 * del mismo `evaluationName` + categoría, nunca entre tipos de test
 * distintos (comparar un CMJ contra un Sprint no tiene sentido).
 *
 * No reemplaza `PhysicalTest` (CMJ manual, `CmjTab.tsx`/ACWR) — son casos de
 * uso distintos: ese es carga rápida de un único valor en el día a día,
 * esto es importación de baterías completas de test con muchas columnas.
 */
export interface PerformanceEvaluation {
  id: string
  seasonId: string
  categoryId: string
  athleteId: string
  evaluationName: string
  fecha: string
  metrics: Record<string, number>
  bodyWeightKg?: number
  createdAt: string
}
