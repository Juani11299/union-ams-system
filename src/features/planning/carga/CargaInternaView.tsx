import { useState } from 'react'
import { Tabs, type TabItem } from '@/components/Tabs'
import { DashboardEquipo } from '../DashboardEquipo'
import { HistorialCarga } from './HistorialCarga'
import { PerfilAtletaCarga } from './PerfilAtletaCarga'
import { VistaColectiva } from './VistaColectiva'

const TABS: TabItem[] = [
  { id: 'dia', label: 'Control del día', icon: '📊' },
  { id: 'grupo', label: 'Vista colectiva', icon: '👥' },
  { id: 'historial', label: 'Historial de carga / microciclos', icon: '📈' },
  { id: 'atleta', label: 'Perfil del atleta', icon: '🧍' },
]

/**
 * Control de Carga Interna (Fase 48) — el tablero de tarjetas por jugador de
 * siempre más tres vistas nuevas: colectiva (KPIs + tabla de control rápido),
 * historial longitudinal (barras de carga + curvas aguda/crónica) y ficha
 * individual con comparativa contra la división. Todas leen del mismo motor
 * (`workload/cargaInterna.ts`) y de la hora del club (Buenos Aires).
 */
export function CargaInternaView() {
  const [tab, setTab] = useState('dia')
  const [atletaId, setAtletaId] = useState('')

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={TABS} activeId={tab} onChange={setTab} />
      {tab === 'dia' && <DashboardEquipo />}
      {tab === 'grupo' && (
        <VistaColectiva
          onAbrirAtleta={(id) => {
            setAtletaId(id)
            setTab('atleta')
          }}
        />
      )}
      {tab === 'historial' && <HistorialCarga />}
      {tab === 'atleta' && <PerfilAtletaCarga atletaId={atletaId} onElegir={setAtletaId} />}
    </div>
  )
}
