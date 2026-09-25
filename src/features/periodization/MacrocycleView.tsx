import { useState } from 'react'
import { Tabs, type TabItem } from '@/components/Tabs'
import { PeriodizacionTab } from './PeriodizacionTab'
import { Navigate } from 'react-router-dom'

const TABS: TabItem[] = [
  { id: 'periodizacion', label: 'Periodización', icon: '🗺️' },
  { id: 'evaluaciones', label: 'Evaluaciones de Rendimiento', icon: '📈' },
]

/** Torre de Control de Temporada (Fase 33, ver docs/Propuesta_Integracion_NSCA.md sección 2). */
export function MacrocycleView() {
  const [tabActiva, setTabActiva] = useState('periodizacion')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">TORRE DE CONTROL DE TEMPORADA</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Periodización real del macrociclo y evaluaciones de rendimiento (Hub de Evaluaciones).
        </p>
      </div>

      <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />

      {tabActiva === 'periodizacion' && <PeriodizacionTab />}
      {/* Las evaluaciones viven en su propio Hub (/evaluaciones). */}
      {tabActiva === 'evaluaciones' && <Navigate to="/evaluaciones" replace />}
    </div>
  )
}
