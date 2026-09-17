/**
 * Evaluación de Rendimiento (Fase 38; Fase 40 — el jugador se identifica
 * por NOMBRE tal cual viene del CSV, ya no matchea contra el plantel real
 * `athletes`/`rosters`; Fase 41 — lo mismo para la categoría, ver
 * `categoryLabel`) — UN resultado de UN jugador en UNA batería de test
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
 *
 * `categoryLabel` (Fase 41) reemplaza al viejo `categoryId` (FK a
 * `team_categories`) — ya NO se matchea contra las categorías reales del
 * club: se toma tal cual viene en la columna "Categoria"/"Category"/
 * "Division" del propio CSV, fila por fila (un mismo archivo puede traer
 * jugadores de más de una categoría). Si el CSV no tiene esa columna, cae
 * en `'Sin categoría'`. Es la base del filtro "AGRUPAR POR" del dashboard —
 * a propósito no depende de ninguna tabla del club, sólo de los datos
 * crudos importados. `seasonId` SÍ sigue siendo el selector local de
 * temporada del panel (Fase 39) — no forma parte de este desacople, es sólo
 * un balde temporal para no mezclar evaluaciones de años distintos.
 */
export interface PerformanceEvaluation {
  id: string
  seasonId: string
  categoryLabel: string
  playerName: string
  playerKey: string
  evaluationName: string
  fecha: string
  metrics: Record<string, number>
  bodyWeightKg?: number
  createdAt: string
}
