import { useMemo } from 'react'
import { useAthletesActivos, useSessionExecutionsActivas, useSessionPlansActivos } from '@/store/useAppStore'
import { construirContexto, resumenCarga, type ResumenCarga } from '@/features/workload/cargaInterna'
import { fechaHoyLocal } from '@/utils/fecha'

/**
 * Datos de Carga Interna del plantel activo, calculados con el motor de
 * `cargaInterna.ts` al cierre del día civil del club (hora de Buenos Aires).
 * Los arrays del store son estables, así que el contexto indexado y los
 * resúmenes se recalculan sólo cuando cambia algún dato real.
 */
export function useCargaInterna() {
  const athletes = useAthletesActivos()
  const ejecuciones = useSessionExecutionsActivas()
  const planes = useSessionPlansActivos()
  const hoy = fechaHoyLocal()

  const ctx = useMemo(() => construirContexto(ejecuciones, planes), [ejecuciones, planes])
  const resumenes = useMemo(() => {
    const m = new Map<string, ResumenCarga>()
    for (const a of athletes) m.set(a.id, resumenCarga(ctx, a.id, hoy))
    return m
  }, [ctx, athletes, hoy])

  return { athletes, ejecuciones, planes, ctx, hoy, resumenes }
}
