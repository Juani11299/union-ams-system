import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Tabs, type TabItem } from '@/components/Tabs'
import { inputClass } from '@/components/FormField'
import { GrupalTab } from './GrupalTab'
import { IndividualTab } from './IndividualTab'

const TABS: TabItem[] = [
  { id: 'grupal', label: 'Análisis Grupal', icon: '👥' },
  { id: 'individual', label: 'Análisis Individual', icon: '🕵️' },
]

/**
 * Dashboard Analítico de Evaluaciones de Rendimiento (Fase 38 — refactor
 * radical del dashboard anterior, Fase 33.2/`EvaluacionesRendimientoTab`;
 * Fase 39 — el filtro de Temporada/Categoría pasó a ser 100% LOCAL de este
 * panel, no `activeSeasonId`/`activeCategoryId` del store global).
 *
 * Reemplaza el CSV efímero en IndexedDB por evaluaciones persistidas en
 * Supabase (`performance_evaluations`, JSONB de métricas) — ver
 * `migration_fase38_evaluaciones_rendimiento.sql`. Dos pestañas:
 *
 * - Análisis Grupal (`GrupalTab`): KPIs, tabla comparativa, evolución
 *   temporal del grupo, rankings Top 5.
 * - Análisis Individual (`IndividualTab`): Radar normalizado + Score
 *   Global, línea de tiempo, Smart Analysis (asimetrías, potencia
 *   relativa, fatiga neuromuscular).
 *
 * Independencia del selector global (Fase 39, pedido explícito): este
 * dashboard es un panel autónomo — cambiar de categoría acá NO toca
 * `activeCategoryId` (así que el resto de la app no se entera), y cambiar
 * de categoría en el resto de la app NO le pisa la selección a este panel.
 * Mismo criterio ya usado en `TerminalFuerzaView.tsx` (otra pantalla
 * deliberadamente desacoplada del selector global). Se inicializa en la
 * PRIMERA categoría/temporada de la lista general del club — sólo como
 * valor por defecto razonable al abrir por primera vez, no como
 * sincronización: de ahí en más vive sólo en este `useState`, sin ningún
 * `useEffect` que lo vuelva a pisar.
 *
 * El resto de los componentes de esta carpeta son deliberadamente chicos y
 * de una sola responsabilidad (`TablaComparativa`, `GraficoTendenciaGrupal`,
 * `RankingsTopFive`, `RadarPerfilJugador`, `LineaTiempoIndividual`,
 * `SmartAnalysisPanel`, `ImportCsvPanel`) — la lógica de cálculo vive aparte
 * en `calculations.ts`, sin UI, para que sea fácil de revisar/ajustar sin
 * tocar ningún componente.
 */
export function PerformanceEvaluationsView() {
  const seasons = useAppStore((s) => s.seasons)
  const categories = useAppStore((s) => s.categories)

  const [tabActiva, setTabActiva] = useState('grupal')
  const [seasonId, setSeasonId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  // Sólo rellena un valor por defecto la PRIMERA vez que la lista deja de
  // estar vacía (ej. recién terminó de cargar desde Supabase) — no vuelve a
  // tocar el estado después, así el profe puede elegir cualquier
  // temporada/categoría y quedarse ahí sin que nada se lo pise.
  useEffect(() => {
    if (!seasonId && seasons.length > 0) setSeasonId(seasons.find((s) => s.is_active)?.id ?? seasons[0].id)
  }, [seasons, seasonId])
  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id)
  }, [categories, categoryId])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Temporada (de este panel)</span>
          <select className={`${inputClass} min-w-[160px]`} value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
            {seasons.length === 0 && <option value="">Sin temporadas</option>}
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                Temporada {s.year}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Categoría (de este panel)</span>
          <select
            className={`${inputClass} min-w-[180px]`}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.length === 0 && <option value="">Sin categorías</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <p className="ml-1 max-w-xs text-[11px] text-slate-400">
          Este selector es independiente del resto de la app — no cambia ni se ve afectado por la
          temporada/categoría activa en las demás pantallas.
        </p>
      </div>

      <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />
      {tabActiva === 'grupal' && <GrupalTab seasonId={seasonId} categoryId={categoryId} />}
      {tabActiva === 'individual' && <IndividualTab seasonId={seasonId} categoryId={categoryId} />}
    </div>
  )
}
