import { useState } from 'react'
import { Tabs, type TabItem } from '@/components/Tabs'
import { GrupalTab } from './GrupalTab'
import { IndividualTab } from './IndividualTab'

const TABS: TabItem[] = [
  { id: 'grupal', label: 'Análisis Grupal', icon: '👥' },
  { id: 'individual', label: 'Análisis Individual', icon: '🕵️' },
]

/**
 * Dashboard Analítico de Evaluaciones de Rendimiento (Fase 38 — refactor
 * radical del dashboard anterior, Fase 33.2/`EvaluacionesRendimientoTab`).
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
 * El resto de los componentes de esta carpeta son deliberadamente chicos y
 * de una sola responsabilidad (`TablaComparativa`, `GraficoTendenciaGrupal`,
 * `RankingsTopFive`, `RadarPerfilJugador`, `LineaTiempoIndividual`,
 * `SmartAnalysisPanel`, `ImportCsvPanel`) — la lógica de cálculo vive aparte
 * en `calculations.ts`, sin UI, para que sea fácil de revisar/ajustar sin
 * tocar ningún componente.
 */
export function PerformanceEvaluationsView() {
  const [tabActiva, setTabActiva] = useState('grupal')

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />
      {tabActiva === 'grupal' && <GrupalTab />}
      {tabActiva === 'individual' && <IndividualTab />}
    </div>
  )
}
