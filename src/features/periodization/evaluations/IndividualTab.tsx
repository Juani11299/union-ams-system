import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { RadarPerfilJugador } from './RadarPerfilJugador'
import { LineaTiempoIndividual } from './LineaTiempoIndividual'
import { SmartAnalysisPanel } from './SmartAnalysisPanel'
import { useAthletesDeCategoria } from './useAthletesDeCategoria'
import { calcularRadarJugador, generarSmartAnalysis } from './calculations'

interface IndividualTabProps {
  /** Temporada/categoría del selector LOCAL de `PerformanceEvaluationsView` — a propósito NO son `activeSeasonId`/`activeCategoryId` del store global (Fase 39, panel 100% independiente). */
  seasonId: string
  categoryId: string
}

/**
 * Pestaña "Análisis Individual" (Fase 38) — selector de jugador, Radar +
 * Score Global (todas las métricas que tenga, de cualquier evaluación),
 * línea de tiempo de UNA métrica elegida, y las tarjetas de Smart Analysis.
 */
export function IndividualTab({ seasonId, categoryId }: IndividualTabProps) {
  const performanceEvaluations = useAppStore((s) => s.performanceEvaluations)
  const athletes = useAthletesDeCategoria(seasonId, categoryId)

  const [athleteId, setAthleteId] = useState('')
  const [metricaElegida, setMetricaElegida] = useState('')

  const evaluacionesDeLaCategoria = useMemo(
    () => performanceEvaluations.filter((e) => e.seasonId === seasonId && e.categoryId === categoryId),
    [performanceEvaluations, seasonId, categoryId],
  )

  useEffect(() => {
    if (athletes.length === 0) {
      setAthleteId('')
    } else if (!athletes.some((a) => a.id === athleteId)) {
      setAthleteId(athletes[0].id)
    }
  }, [athletes, athleteId])

  const evaluacionesDelJugador = useMemo(
    () => evaluacionesDeLaCategoria.filter((e) => e.athleteId === athleteId),
    [evaluacionesDeLaCategoria, athleteId],
  )

  const metricasDelJugador = useMemo(() => {
    const set = new Set<string>()
    for (const e of evaluacionesDelJugador) for (const k of Object.keys(e.metrics)) set.add(k)
    return Array.from(set).sort()
  }, [evaluacionesDelJugador])

  useEffect(() => {
    if (metricasDelJugador.length === 0) {
      setMetricaElegida('')
    } else if (!metricasDelJugador.includes(metricaElegida)) {
      setMetricaElegida(metricasDelJugador[0])
    }
  }, [metricasDelJugador, metricaElegida])

  const { radar, scoreGlobal } = useMemo(
    () => calcularRadarJugador(evaluacionesDelJugador, evaluacionesDeLaCategoria),
    [evaluacionesDelJugador, evaluacionesDeLaCategoria],
  )

  const alertas = useMemo(() => generarSmartAnalysis(evaluacionesDelJugador), [evaluacionesDelJugador])

  if (!seasonId || !categoryId) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Elegí una temporada y una categoría arriba para ver evaluaciones de rendimiento.
      </Card>
    )
  }

  if (athletes.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No hay jugadores en el plantel de esta categoría.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex w-fit flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">Jugador</span>
        <select className={`${inputClass} min-w-[220px]`} value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </label>

      {evaluacionesDelJugador.length === 0 ? (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Este jugador todavía no tiene evaluaciones importadas en esta categoría.
        </Card>
      ) : (
        <>
          <RadarPerfilJugador radar={radar} scoreGlobal={scoreGlobal} />

          {metricasDelJugador.length > 0 && (
            <>
              <label className="flex w-fit flex-col gap-1 text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Métrica para la línea de tiempo</span>
                <select
                  className={`${inputClass} min-w-[180px]`}
                  value={metricaElegida}
                  onChange={(e) => setMetricaElegida(e.target.value)}
                >
                  {metricasDelJugador.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <LineaTiempoIndividual evaluaciones={evaluacionesDelJugador} metrica={metricaElegida} />
            </>
          )}

          <SmartAnalysisPanel alertas={alertas} />
        </>
      )}
    </div>
  )
}
