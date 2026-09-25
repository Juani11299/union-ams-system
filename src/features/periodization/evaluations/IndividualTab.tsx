import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { RadarPerfilJugador } from './RadarPerfilJugador'
import { LineaTiempoIndividual } from './LineaTiempoIndividual'
import { SmartAnalysisPanel } from './SmartAnalysisPanel'
import { calcularRadarJugador, generarSmartAnalysis } from './calculations'

interface IndividualTabProps {
  /** Temporada del selector LOCAL de `PerformanceEvaluationsView` — a propósito NO es `activeSeasonId` del store global (Fase 39, panel 100% independiente). */
  seasonId: string
  /** Categoría elegida en el filtro "AGRUPAR POR" (Fase 41) — sale de la columna Categoría/Category/Division del propio CSV, NUNCA de la tabla real de categorías del club. `''` = todas. */
  categoryLabel: string
}

/**
 * Pestaña "Análisis Individual" (Fase 38) — selector de jugador, Radar +
 * Score Global (todas las métricas que tenga, de cualquier evaluación),
 * línea de tiempo de UNA métrica elegida, y las tarjetas de Smart Analysis.
 */
export function IndividualTab({ seasonId, categoryLabel }: IndividualTabProps) {
  const performanceEvaluations = useAppStore((s) => s.performanceEvaluations)

  const [playerKeyElegido, setPlayerKeyElegido] = useState('')
  const [metricaElegida, setMetricaElegida] = useState('')

  const evaluacionesDeLaCategoria = useMemo(
    () =>
      performanceEvaluations.filter(
        (e) => e.seasonId === seasonId && (!categoryLabel || e.categoryLabel === categoryLabel),
      ),
    [performanceEvaluations, seasonId, categoryLabel],
  )

  const jugadoresDisponibles = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const e of evaluacionesDeLaCategoria) {
      if (!mapa.has(e.playerKey)) mapa.set(e.playerKey, e.playerName)
    }
    return Array.from(mapa, ([playerKey, nombre]) => ({ playerKey, nombre })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    )
  }, [evaluacionesDeLaCategoria])

  useEffect(() => {
    if (jugadoresDisponibles.length === 0) {
      setPlayerKeyElegido('')
    } else if (!jugadoresDisponibles.some((j) => j.playerKey === playerKeyElegido)) {
      setPlayerKeyElegido(jugadoresDisponibles[0].playerKey)
    }
  }, [jugadoresDisponibles, playerKeyElegido])

  const evaluacionesDelJugador = useMemo(
    () => evaluacionesDeLaCategoria.filter((e) => e.playerKey === playerKeyElegido),
    [evaluacionesDeLaCategoria, playerKeyElegido],
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

  if (!seasonId) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Elegí una temporada arriba para ver evaluaciones de rendimiento.
      </Card>
    )
  }

  if (jugadoresDisponibles.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Todavía no hay evaluaciones importadas para esta categoría.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex w-fit flex-col gap-1 text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">Jugador</span>
        <select
          className={`${inputClass} min-w-[220px]`}
          value={playerKeyElegido}
          onChange={(e) => setPlayerKeyElegido(e.target.value)}
        >
          {jugadoresDisponibles.map((j) => (
            <option key={j.playerKey} value={j.playerKey}>
              {j.nombre}
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
