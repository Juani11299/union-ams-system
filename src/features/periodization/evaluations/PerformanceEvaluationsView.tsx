import { useEffect, useMemo, useState } from 'react'
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
 * Fase 39 — el filtro de Temporada pasó a ser 100% LOCAL de este panel, no
 * `activeSeasonId` del store global; Fase 40 — el jugador se identifica por
 * el nombre del CSV, ya no matchea contra `athletes`; Fase 41 — lo mismo
 * para la categoría, ver `categoryLabel` abajo).
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
 * Independencia del resto del sistema (Fase 39/41, pedido explícito): este
 * dashboard es un panel autónomo que NO lee `athletes` ni `activeCategoryId`
 * del store global. La Temporada sigue siendo un selector LOCAL (sólo un
 * balde temporal para no mezclar años, no depende de matching contra nada).
 * El filtro "AGRUPAR POR" (Fase 41) reemplaza al viejo selector de
 * Categoría: en vez de elegir una categoría real del club, se puebla
 * ÚNICAMENTE con los valores de `categoryLabel` que ya trajeron los CSVs
 * importados (columna "Categoria"/"Category"/"Division" del archivo) — si
 * un CSV no traía esa columna, sus filas quedan agrupadas en "Sin
 * categoría". Mismo criterio de desacople ya usado en
 * `TerminalFuerzaView.tsx` (otra pantalla deliberadamente separada del
 * selector global). La temporada se inicializa en la PRIMERA de la lista
 * general del club — sólo como valor por defecto razonable al abrir por
 * primera vez, no como sincronización: de ahí en más vive sólo en este
 * `useState`, sin ningún `useEffect` que lo vuelva a pisar.
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
  const performanceEvaluations = useAppStore((s) => s.performanceEvaluations)

  const [tabActiva, setTabActiva] = useState('grupal')
  const [seasonId, setSeasonId] = useState('')
  const [categoryLabel, setCategoryLabel] = useState('')

  // Sólo rellena un valor por defecto la PRIMERA vez que la lista deja de
  // estar vacía (ej. recién terminó de cargar desde Supabase) — no vuelve a
  // tocar el estado después, así el profe puede elegir cualquier temporada
  // y quedarse ahí sin que nada se lo pise.
  useEffect(() => {
    if (!seasonId && seasons.length > 0) setSeasonId(seasons.find((s) => s.is_active)?.id ?? seasons[0].id)
  }, [seasons, seasonId])

  // "AGRUPAR POR" (Fase 41) — poblado ÚNICAMENTE con las categorías que ya
  // trajeron los CSVs de esta temporada, nunca con la tabla real de
  // categorías del club.
  const categoriasDelCsv = useMemo(
    () =>
      Array.from(
        new Set(performanceEvaluations.filter((e) => e.seasonId === seasonId).map((e) => e.categoryLabel)),
      ).sort(),
    [performanceEvaluations, seasonId],
  )

  // Si la categoría elegida deja de existir en los datos (cambió la
  // temporada, se borró la última evaluación de ese grupo) cae a "Todas" —
  // no se fuerza ningún otro valor por defecto.
  useEffect(() => {
    if (categoryLabel && !categoriasDelCsv.includes(categoryLabel)) setCategoryLabel('')
  }, [categoriasDelCsv, categoryLabel])

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
          <span className="font-medium text-slate-600 dark:text-slate-300">AGRUPAR POR</span>
          <select
            className={`${inputClass} min-w-[180px]`}
            value={categoryLabel}
            onChange={(e) => setCategoryLabel(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categoriasDelCsv.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <p className="ml-1 max-w-xs text-[11px] text-slate-400">
          Panel 100% independiente del resto de la app: la categoría sale de la propia columna del CSV importado, no
          de las categorías reales del club — no cambia ni se ve afectado por nada de las demás pantallas.
        </p>
      </div>

      <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />
      {tabActiva === 'grupal' && <GrupalTab seasonId={seasonId} categoryLabel={categoryLabel} />}
      {tabActiva === 'individual' && <IndividualTab seasonId={seasonId} categoryLabel={categoryLabel} />}
    </div>
  )
}
