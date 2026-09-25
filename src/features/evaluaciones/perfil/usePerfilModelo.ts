import { useEffect, useMemo } from 'react'
import { rosterDesdeAntropometrias } from '@/features/nordbord/roster'
import { ingest } from '@/features/nordbord/parser'
import { useAppStore } from '@/store/useAppStore'
import { useAntropometriasStore } from '@/stores/useAntropometriasStore'
import { useNordBordStore } from '@/stores/useNordBordStore'
import { useTestsDinamicosStore } from '@/stores/useTestsDinamicosStore'
import { construirModelo } from './datos'

/**
 * Junta todas las fuentes del Perfil de Atleta 360° (NordBord, ForceDecks/CMJ,
 * Antropometrías y tests dinámicos) en un `ModeloPerfil`. Dispara la carga de
 * antropometrías (peso/categoría para el cruce de identidades).
 */
export function usePerfilModelo() {
  const csv = useNordBordStore((s) => s.csv)
  const cmj = useAppStore((s) => s.performanceEvaluations)
  const antropo = useAntropometriasStore((s) => s.mediciones)
  const fetchAntropometrias = useAntropometriasStore((s) => s.fetchAntropometrias)
  const custom = useTestsDinamicosStore((s) => s.tests)

  useEffect(() => {
    void fetchAntropometrias()
  }, [fetchAntropometrias])

  const roster = useMemo(() => rosterDesdeAntropometrias(antropo), [antropo])
  const nordbord = useMemo(() => {
    if (!csv) return null
    const r = ingest(csv.texto, csv.nombre, roster)
    return r.ok ? r.data : null
  }, [csv, roster])

  return useMemo(() => construirModelo({ roster, nordbord, cmj, antropo, custom }), [roster, nordbord, cmj, antropo, custom])
}
