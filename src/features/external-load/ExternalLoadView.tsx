import { useState } from 'react'
import { Tabs, type TabItem } from '@/components/Tabs'
import { CsvImportTab } from './CsvImportTab'
import { CmjTab } from './CmjTab'
import { GymLoadHistoryTab } from './GymLoadHistoryTab'
import { DashboardIntegrado } from './DashboardIntegrado'

const TABS: TabItem[] = [
  { id: 'csv', label: 'Importar CSV (GPS)', icon: '📄' },
  { id: 'cmj', label: 'Carga Manual (Métricas)', icon: '🦵' },
  { id: 'gym', label: 'Registro de Carga Externa', icon: '🏋️' },
]

export function ExternalLoadView() {
  const [tabActiva, setTabActiva] = useState('csv')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Control de Carga Externa
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          GPS por sesión y evaluaciones físicas (CMJ) del plantel.
        </p>
      </div>

      <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />

      {tabActiva === 'csv' && <CsvImportTab />}
      {tabActiva === 'cmj' && <CmjTab />}
      {tabActiva === 'gym' && <GymLoadHistoryTab />}

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-200">
          Dashboard Integrado
        </h2>
        <DashboardIntegrado />
      </div>
    </div>
  )
}
