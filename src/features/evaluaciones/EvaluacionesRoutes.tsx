import { useCallback, useEffect, useMemo } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { NordBordDashboard } from '@/features/nordbord/NordBordDashboard'
import { useEvaluacionesDinamicasStore } from '@/stores/useEvaluacionesDinamicasStore'
import { testsDesdeFilas } from './dinamicas'
import { CmjDashboard } from './CmjDashboard'
import { EvaluacionesHub } from './EvaluacionesHub'
import { PerfilAtleta360 } from './perfil/PerfilAtleta360'
import { TestDinamicoDashboard } from './TestDinamicoDashboard'

function TestDinamicoRoute({ onBack }: { onBack: () => void }) {
  const { id } = useParams()
  const filas = useEvaluacionesDinamicasStore((s) => s.filas)
  const cargando = useEvaluacionesDinamicasStore((s) => s.cargando)
  const test = useMemo(() => testsDesdeFilas(filas).find((t) => t.id === id), [filas, id])
  // Hasta terminar la primera lectura desde Supabase no se redirige (el test todavía puede estar llegando).
  if (!test) return cargando ? null : <Navigate to="/evaluaciones" replace />
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
  const fetchEvaluaciones = useEvaluacionesDinamicasStore((s) => s.fetchEvaluaciones)
  // NordBord y los tests dinámicos viven en Supabase: se leen al entrar al Hub (y cubre también las rutas hijas, Perfil 360° incluido).
  useEffect(() => {
    void fetchEvaluaciones()
  }, [fetchEvaluaciones])
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
