import { PerformanceEvaluationsView } from '@/features/periodization/evaluations/PerformanceEvaluationsView'
import { PantallaCompleta } from './PantallaCompleta'

/**
 * Dashboard de ForceDecks (CMJ / SLJ) — la vista de Evaluaciones de Rendimiento
 * de siempre (Análisis Grupal e Individual, importador de CSV, Smart Analysis),
 * conectada a `performance_evaluations` en Supabase, ahora montada en el layout
 * inmersivo del Hub. Se restauró tal cual desde el commit anterior a la
 * migración de NordBord: los cálculos siguen en `evaluations/calculations.ts`.
 */
export function CmjDashboard({ onBack }: { onBack: () => void }) {
  return (
    <PantallaCompleta titulo="ForceDecks (CMJ)" subtitulo="Saltos: altura, RSI-modificado, fuerza relativa y asimetrías" onBack={onBack}>
      <PerformanceEvaluationsView />
    </PantallaCompleta>
  )
}
