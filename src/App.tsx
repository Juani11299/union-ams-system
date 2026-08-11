import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { DashboardEquipo } from '@/features/planning/DashboardEquipo'
import { PlanificadorView } from '@/features/planificador/PlanificadorView'
import { MagicLinkView } from '@/features/wellness/MagicLinkView'
import { AdminView } from '@/features/admin/AdminView'
import { ExternalLoadView } from '@/features/external-load/ExternalLoadView'
import { MatchDayView } from '@/features/match-day/MatchDayView'
import { MedicalView } from '@/features/medical/MedicalView'
import { MetodologiaIsometriaView } from '@/features/metodologia/MetodologiaIsometriaView'
import { ManualFuerzaView } from '@/features/metodologia/ManualFuerzaView'
import { TerminalFuerzaView } from '@/features/terminal-fuerza/TerminalFuerzaView'

function App() {
  return (
    <Routes>
      <Route path="/ingreso-rapido" element={<MagicLinkView />} />
      <Route path="/terminal-fuerza" element={<TerminalFuerzaView />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardEquipo />} />
        <Route path="/planificador" element={<PlanificadorView />} />
        <Route path="/match-day" element={<MatchDayView />} />
        <Route path="/carga-externa" element={<ExternalLoadView />} />
        <Route path="/medical" element={<MedicalView />} />
        <Route path="/metodologia/isometria" element={<MetodologiaIsometriaView />} />
        <Route path="/metodologia/manual-fuerza" element={<ManualFuerzaView />} />
        <Route path="/admin" element={<AdminView />} />
      </Route>
    </Routes>
  )
}

export default App
