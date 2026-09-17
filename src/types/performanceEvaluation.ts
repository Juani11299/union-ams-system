/**
 * Evaluación de Rendimiento (Fase 38; Fase 40 — el jugador se identifica
 * por NOMBRE tal cual viene del CSV, ya no matchea contra el plantel real
 * `athletes`/`rosters`) — UN resultado de UN jugador en UNA batería de test
 * (CMJ, Sprint 30m, Fuerza Isométrica, etc.), importada por CSV. `metrics`
 * es flexible a propósito (JSONB en Supabase): cada tipo de test trae
 * columnas numéricas distintas.
 *
 * `evaluationName` es el "tipo" de evaluación (ej. "CMJ — Marzo 2026") — el
 * Análisis Grupal compara la fecha más reciente contra la anterior DENTRO
 * del mismo `evaluationName` + categoría.
 *
 * `playerKey` (Fase 40) es la clave real de identidad entre CSVs de tests
 * DISTINTOS: normalizada (sin tildes, minúsculas, espacios colapsados —
 * `normalizarNombre()` de `smartEntityMatcher.ts`), para que "Juan Pérez"
 * en un CSV de CMJ y "juan perez" en un CSV de Curl Nórdico se reconozcan
 * como la misma persona y sumen sus evaluaciones. `playerName` guarda el
 * nombre tal cual vino del CSV, sólo para mostrar.
 */
export interface PerformanceEvaluation {
  id: string
  seasonId: string
  categoryId: string
  playerName: string
  playerKey: string
  evaluationName: string
  fecha: string
  metrics: Record<string, number>
  bodyWeightKg?: number
  createdAt: string
}
