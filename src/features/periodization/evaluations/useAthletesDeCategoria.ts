import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Athlete } from '@/types'

/**
 * Mismo cálculo que `useAthletesActivos()` del store global, pero
 * parametrizado por `seasonId`/`categoryId` explícitos en vez de
 * `activeSeasonId`/`activeCategoryId` (Fase 39) — el panel de Evaluaciones
 * de Rendimiento tiene su propio selector de temporada/categoría, 100%
 * independiente del selector global (mismo criterio que
 * `TerminalFuerzaView.tsx`), así que no puede usar el hook que lee el
 * global.
 */
export function useAthletesDeCategoria(seasonId: string, categoryId: string): Athlete[] {
  const athletes = useAppStore((s) => s.athletes)
  const rosters = useAppStore((s) => s.rosters)

  return useMemo(() => {
    if (!seasonId || !categoryId) return []
    const idsRoster = new Set(
      rosters.filter((r) => r.season_id === seasonId && r.category_id === categoryId).map((r) => r.athlete_id),
    )
    return athletes.filter((a) => idsRoster.has(a.id)).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [athletes, rosters, seasonId, categoryId])
}
