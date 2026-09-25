import { useEffect, useMemo } from 'react'
import { rosterDesdeAntropometrias } from '@/features/nordbord/roster'
import { datasetDesdeFilas } from '@/features/nordbord/parser'
import { useAppStore } from '@/store/useAppStore'
import { useAntropometriasStore } from '@/stores/useAntropometriasStore'
import { useEvaluacionesDinamicasStore } from '@/stores/useEvaluacionesDinamicasStore'
import { TEST_NORDBORD, testsDesdeFilas } from '../dinamicas'
import { construirModelo } from './datos'

/**
 * Junta todas las fuentes del Perfil de Atleta 360° (NordBord, ForceDecks/CMJ,
 * Antropometrías y tests dinámicos) en un `ModeloPerfil`. NordBord y los tests
 * dinámicos vienen de `dynamic_evaluations` (Supabase): la carga la dispara
 * `EvaluacionesRoutes` al entrar al Hub. Acá se dispara la de antropometrías
 * (peso/categoría para el cruce de identidades).
 */
export function usePerfilModelo() {
  const filas = useEvaluacionesDinamicasStore((s) => s.filas)
  const cmj = useAppStore((s) => s.performanceEvaluations)
  const antropo = useAntropometriasStore((s) => s.mediciones)
  const fetchAntropometrias = useAntropometriasStore((s) => s.fetchAntropometrias)

  useEffect(() => {
    void fetchAntropometrias()
  }, [fetchAntropometrias])

  const roster = useMemo(() => rosterDesdeAntropometrias(antropo), [antropo])
  const nordbord = useMemo(() => {
    const nb = filas.filter((f) => f.test_name === TEST_NORDBORD)
    return nb.length ? datasetDesdeFilas(nb, roster) : null
  }, [filas, roster])
  const custom = useMemo(() => testsDesdeFilas(filas), [filas])

  return useMemo(() => construirModelo({ roster, nordbord, cmj, antropo, custom }), [roster, nordbord, cmj, antropo, custom])
}
