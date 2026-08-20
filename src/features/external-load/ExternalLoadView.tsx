import { useState } from 'react'
import { Tabs, type TabItem } from '@/components/Tabs'
import { GymLoadHistoryTab } from './GymLoadHistoryTab'
import { GpsPlaceholderTab } from './GpsPlaceholderTab'
import { DashboardIntegrado } from './DashboardIntegrado'

const TABS: TabItem[] = [
  { id: 'gimnasio', label: 'Gimnasio (Kg)', icon: '🏋️' },
  { id: 'campo', label: 'Campo (GPS)', icon: '📡' },
]

export function ExternalLoadView() {
  const [tabActiva, setTabActiva] = useState('gimnasio')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Control de Carga Externa
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tonelaje de Gimnasio y GPS de Campo del plantel.
        </p>
      </div>

      <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />

      {tabActiva === 'gimnasio' && <GymLoadHistoryTab />}
      {tabActiva === 'campo' && <GpsPlaceholderTab />}

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-200">
          Dashboard Integrado
        </h2>
        <DashboardIntegrado />
      </div>
    </div>
  )
}
