import { useCallback } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { NordBordDashboard } from '@/features/nordbord/NordBordDashboard'
import { useTestsDinamicosStore } from '@/stores/useTestsDinamicosStore'
import { CmjDashboard } from './CmjDashboard'
import { EvaluacionesHub } from './EvaluacionesHub'
import { PerfilAtleta360 } from './perfil/PerfilAtleta360'
import { TestDinamicoDashboard } from './TestDinamicoDashboard'

function TestDinamicoRoute({ onBack }: { onBack: () => void }) {
  const { id } = useParams()
  const test = useTestsDinamicosStore((s) => s.tests.find((t) => t.id === id))
  const hidratado = useTestsDinamicosStore.persist.hasHydrated()
  // El store persiste en IndexedDB (asíncrono): hasta hidratar, no se redirige.
  if (!test) return hidratado ? <Navigate to="/evaluaciones" replace /> : null
  return <TestDinamicoDashboard test={test} onBack={onBack} />
}

/**
 * `/evaluaciones` — el Hub queda siempre montado de fondo y cada dashboard se
 * abre como pantalla completa (portal) en una ruta hija: /nordbord, /cmj,
 * /perfil y /test/:id. "⬅ Volver al Hub" navega de vuelta a `/evaluaciones`,
 * así el botón "atrás" del navegador también funciona.
 */
export function EvaluacionesRoutes() {
  const navigate = useNavigate()
  const volver = useCallback(() => navigate('/evaluaciones'), [navigate])
  return (
    <>
      <EvaluacionesHub />
      <Routes>
        <Route path="nordbord" element={<NordBordDashboard onBack={volver} backLabel="⬅ Volver al Hub" />} />
        <Route path="cmj" element={<CmjDashboard onBack={volver} />} />
        <Route path="perfil" element={<PerfilAtleta360 onBack={volver} />} />
        <Route path="test/:id" element={<TestDinamicoRoute onBack={volver} />} />
        <Route path="*" element={null} />
      </Routes>
    </>
  )
}
