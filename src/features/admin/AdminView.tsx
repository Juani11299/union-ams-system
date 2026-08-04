import { useState } from 'react'
import { Tabs, type TabItem } from '@/components/Tabs'
import { ClubSeasonsTab } from './ClubSeasonsTab'
import { CategoriesTab } from './CategoriesTab'
import { AthletesTab } from './AthletesTab'
import { RosterTab } from './RosterTab'

const TABS: TabItem[] = [
  { id: 'club', label: 'Club y Temporadas', icon: '🏟️' },
  { id: 'categorias', label: 'Categorías', icon: '🏷️' },
  { id: 'jugadores', label: 'Jugadores', icon: '🧑‍🤝‍🧑' },
  { id: 'planteles', label: 'Planteles', icon: '📋' },
]

export function AdminView() {
  const [tabActiva, setTabActiva] = useState('club')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Administración</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gestioná el club, sus temporadas, categorías, jugadores y planteles.
        </p>
      </div>

      <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />

      {tabActiva === 'club' && <ClubSeasonsTab />}
      {tabActiva === 'categorias' && <CategoriesTab />}
      {tabActiva === 'jugadores' && <AthletesTab />}
      {tabActiva === 'planteles' && <RosterTab />}
    </div>
  )
}
