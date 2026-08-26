import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { LoginView } from '@/features/auth/LoginView'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useAuthStore } from '@/store/useAuthStore'
import { DashboardEquipo } from '@/features/planning/DashboardEquipo'
import { PlanificadorView } from '@/features/planificador/PlanificadorView'
import { MagicLinkView } from '@/features/wellness/MagicLinkView'
import { AdminView } from '@/features/admin/AdminView'
import { ExternalLoadView } from '@/features/external-load/ExternalLoadView'
import { MatchDayView } from '@/features/match-day/MatchDayView'
import { MedicalView } from '@/features/medical/MedicalView'
import { MetodologiaIndexView } from '@/features/metodologia/MetodologiaIndexView'
import { MetodologiaIsometriaView } from '@/features/metodologia/MetodologiaIsometriaView'
import { ManualFuerzaView } from '@/features/metodologia/ManualFuerzaView'
import { TerminalFuerzaView } from '@/features/terminal-fuerza/TerminalFuerzaView'
import { Manual10maPre9naView } from '@/features/metodologia/ltad/Manual10maPre9naView'
import { Manual9na8vaView } from '@/features/metodologia/ltad/Manual9na8vaView'
import { Manual7ma6taView } from '@/features/metodologia/ltad/Manual7ma6taView'
import { Manual5ta4taView } from '@/features/metodologia/ltad/Manual5ta4taView'
import { MacrocycleView } from '@/features/periodization/MacrocycleView'

function App() {
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().init()
    return unsubscribe
  }, [])

  return (
    <Routes>
      <Route path="/ingreso-rapido" element={<MagicLinkView />} />
      <Route path="/terminal-fuerza" element={<TerminalFuerzaView />} />
      <Route path="/login" element={<LoginView />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardEquipo />} />
          <Route path="/planificador" element={<PlanificadorView />} />
          <Route path="/match-day" element={<MatchDayView />} />
          <Route path="/carga-externa" element={<ExternalLoadView />} />
          <Route path="/medical" element={<MedicalView />} />
          <Route path="/metodologia" element={<MetodologiaIndexView />} />
          <Route path="/metodologia/isometria" element={<MetodologiaIsometriaView />} />
          <Route path="/metodologia/manual-fuerza" element={<ManualFuerzaView />} />
          <Route path="/metodologia/ltad-10ma-pre9na" element={<Manual10maPre9naView />} />
          <Route path="/metodologia/ltad-9na-8va" element={<Manual9na8vaView />} />
          <Route path="/metodologia/ltad-7ma-6ta" element={<Manual7ma6taView />} />
          <Route path="/metodologia/ltad-5ta-4ta" element={<Manual5ta4taView />} />
          <Route path="/admin" element={<AdminView />} />
          <Route path="/coordinacion/macro" element={<MacrocycleView />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
