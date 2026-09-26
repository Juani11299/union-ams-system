import { useCallback, useEffect, useMemo } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useEvaluacionesDinamicasStore } from '@/stores/useEvaluacionesDinamicasStore'
import { TESTS_FIJOS } from './dinamicas'
import { EvaluacionesHub } from './EvaluacionesHub'
import { useFilasEvaluaciones } from './useFilasEvaluaciones'
import { PerfilAtleta360 } from './perfil/PerfilAtleta360'
import { DataWrangler } from './wrangler/DataWrangler'
import { UniversalTestDashboard } from './universal/UniversalTestDashboard'

/** Todas las tarjetas del Hub (NordBord, CMJ, tests propios) abren la MISMA plantilla universal. */
function TestRoute({ onBack }: { onBack: () => void }) {
  const { id } = useParams()
  const filas = useFilasEvaluaciones()
  const cargando = useEvaluacionesDinamicasStore((s) => s.cargando)
  const existe = useMemo(() => !!id && (TESTS_FIJOS.includes(id) || filas.some((f) => f.test_name === id)), [filas, id])
  // Los tests fijos abren aunque estén vacíos (para subir el primer archivo); un test propio inexistente vuelve al Hub
  // recién cuando termina la primera lectura desde Supabase.
  if (!id || !existe) return cargando ? null : <Navigate to="/evaluaciones" replace />
  return <UniversalTestDashboard key={id} nombre={id} onBack={onBack} />
}

/**
 * `/evaluaciones` — el Hub queda siempre montado de fondo y cada dashboard se
 * abre como pantalla completa (portal) en una ruta hija: /nordbord, /cmj,
 * /perfil y /test/:id (plantilla universal). "⬅ Volver al Hub" navega de vuelta a `/evaluaciones`,
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
        <Route path="perfil" element={<PerfilAtleta360 onBack={volver} />} />
        <Route path="limpieza" element={<DataWrangler onBack={volver} />} />
        <Route path="test/:id" element={<TestRoute onBack={volver} />} />
        {/* Rutas viejas (antes había un dashboard distinto por test) */}
        <Route path="nordbord" element={<Navigate to="/evaluaciones/test/NordBord" replace />} />
        <Route path="cmj" element={<Navigate to="/evaluaciones/test/CMJ%20Bilateral" replace />} />
        <Route path="*" element={null} />
      </Routes>
    </>
  )
}
