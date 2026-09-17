import { useEffect, useMemo, useState } from 'react'
import { useAppStore, useAthletesActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'
import { ImportCsvPanel } from './ImportCsvPanel'
import { TablaComparativa } from './TablaComparativa'
import { GraficoTendenciaGrupal } from './GraficoTendenciaGrupal'
import { RankingsTopFive } from './RankingsTopFive'
import {
  separarActualYAnterior,
  calcularKpisGrupales,
  construirTablaComparativa,
  calcularSerieTemporalGrupal,
  top5MejoresRelativos,
  top5PeoresRelativos,
  top5MayorMejora,
  top5MayorDesmejora,
} from './calculations'

const selectClass = inputClass

/**
 * Pestaña "Análisis Grupal" (Fase 38) — orquesta el resto de los
 * componentes de la carpeta a partir de dos selectores: qué EVALUACIÓN
 * (tipo de test, ej. "CMJ — Marzo 2026") y qué MÉTRICA de esa evaluación
 * mirar. Todo lo demás (KPIs, tabla, gráfico, rankings) se deriva de esos
 * dos selectores + la categoría/temporada activa del header global.
 */
export function GrupalTab() {
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const performanceEvaluations = useAppStore((s) => s.performanceEvaluations)
  const deletePerformanceEvaluationByName = useAppStore((s) => s.deletePerformanceEvaluationByName)
  const athletes = useAthletesActivos()
  const showToast = useToastStore((s) => s.showToast)

  const [mostrarImport, setMostrarImport] = useState(false)
  const [evaluacionElegida, setEvaluacionElegida] = useState('')
  const [metricaElegida, setMetricaElegida] = useState('')
  const [invertirLogica, setInvertirLogica] = useState(false)
  const [borrando, setBorrando] = useState(false)

  const evaluacionesDeLaCategoria = useMemo(
    () => performanceEvaluations.filter((e) => e.seasonId === activeSeasonId && e.categoryId === activeCategoryId),
    [performanceEvaluations, activeSeasonId, activeCategoryId],
  )

  const nombresEvaluaciones = useMemo(
    () => Array.from(new Set(evaluacionesDeLaCategoria.map((e) => e.evaluationName))).sort(),
    [evaluacionesDeLaCategoria],
  )

  // Se puebla dinámicamente según lo que ya haya en la DB para esta
  // categoría (pedido explícito) — si el profe cambia de categoría y la
  // evaluación elegida ya no existe ahí, cae a la primera disponible.
  useEffect(() => {
    if (nombresEvaluaciones.length === 0) {
      setEvaluacionElegida('')
    } else if (!nombresEvaluaciones.includes(evaluacionElegida)) {
      setEvaluacionElegida(nombresEvaluaciones[0])
    }
  }, [nombresEvaluaciones, evaluacionElegida])

  const evaluacionesDelTipo = useMemo(
    () => evaluacionesDeLaCategoria.filter((e) => e.evaluationName === evaluacionElegida),
    [evaluacionesDeLaCategoria, evaluacionElegida],
  )

  const metricasDisponibles = useMemo(() => {
    const set = new Set<string>()
    for (const e of evaluacionesDelTipo) for (const k of Object.keys(e.metrics)) set.add(k)
    return Array.from(set).sort()
  }, [evaluacionesDelTipo])

  useEffect(() => {
    if (metricasDisponibles.length === 0) {
      setMetricaElegida('')
    } else if (!metricasDisponibles.includes(metricaElegida)) {
      setMetricaElegida(metricasDisponibles[0])
    }
  }, [metricasDisponibles, metricaElegida])

  const { actual, anterior, fechaActual, fechaAnterior } = useMemo(
    () => separarActualYAnterior(evaluacionesDelTipo),
    [evaluacionesDelTipo],
  )

  const kpis = useMemo(
    () => calcularKpisGrupales(actual, anterior, metricaElegida, invertirLogica),
    [actual, anterior, metricaElegida, invertirLogica],
  )
  const tabla = useMemo(
    () => construirTablaComparativa(actual, anterior, metricaElegida, athletes, invertirLogica),
    [actual, anterior, metricaElegida, athletes, invertirLogica],
  )
  const serie = useMemo(
    () => calcularSerieTemporalGrupal(evaluacionesDelTipo, metricaElegida),
    [evaluacionesDelTipo, metricaElegida],
  )
  const hayColumnaPeso = actual.some((e) => e.bodyWeightKg != null)
  const mejoresRelativos = useMemo(
    () => top5MejoresRelativos(actual, metricaElegida, athletes, invertirLogica),
    [actual, metricaElegida, athletes, invertirLogica],
  )
  const peoresRelativos = useMemo(
    () => top5PeoresRelativos(actual, metricaElegida, athletes, invertirLogica),
    [actual, metricaElegida, athletes, invertirLogica],
  )
  const mayorMejora = useMemo(() => top5MayorMejora(tabla), [tabla])
  const mayorDesmejora = useMemo(() => top5MayorDesmejora(tabla), [tabla])

  async function handleBorrarEvaluacion() {
    if (!evaluacionElegida) return
    if (!window.confirm(`¿Borrar TODA la evaluación "${evaluacionElegida}" (todos los jugadores, todas las fechas)? No se puede deshacer.`)) {
      return
    }
    setBorrando(true)
    try {
      await deletePerformanceEvaluationByName(evaluacionElegida)
      showToast('success', 'Evaluación borrada.')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo borrar la evaluación.'))
    } finally {
      setBorrando(false)
    }
  }

  if (!activeSeasonId || !activeCategoryId) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Elegí una temporada y una categoría arriba para ver evaluaciones de rendimiento.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Evaluación</span>
            <select
              className={`${selectClass} min-w-[220px]`}
              value={evaluacionElegida}
              onChange={(e) => setEvaluacionElegida(e.target.value)}
              disabled={nombresEvaluaciones.length === 0}
            >
              {nombresEvaluaciones.length === 0 && <option value="">Sin evaluaciones importadas</option>}
              {nombresEvaluaciones.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">Métrica</span>
            <select
              className={`${selectClass} min-w-[180px]`}
              value={metricaElegida}
              onChange={(e) => setMetricaElegida(e.target.value)}
              disabled={metricasDisponibles.length === 0}
            >
              {metricasDisponibles.length === 0 && <option value="">—</option>}
              {metricasDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          {evaluacionElegida && (
            <button
              type="button"
              onClick={handleBorrarEvaluacion}
              disabled={borrando}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              🗑️ Borrar "{evaluacionElegida}"
            </button>
          )}
          <button
            type="button"
            onClick={() => setMostrarImport((v) => !v)}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700"
          >
            {mostrarImport ? '✕ Cerrar' : '📥 Importar CSV'}
          </button>
        </div>
      </div>

      {mostrarImport && (
        <ImportCsvPanel
          onImportado={() => {
            setMostrarImport(false)
          }}
        />
      )}

      {!evaluacionElegida || !metricaElegida ? (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {nombresEvaluaciones.length === 0
            ? 'Todavía no hay evaluaciones importadas para esta categoría — arrancá con "📥 Importar CSV".'
            : 'Elegí una métrica para ver el análisis.'}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Card className="flex flex-col gap-1 border-t-4 border-t-slate-400">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">📊 Promedio grupal</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {kpis.promedioActual?.toFixed(2) ?? '—'}
              </span>
              <span className="text-xs text-slate-400">{kpis.cantidadJugadores} jugador(es)</span>
            </Card>
            <Card className="flex flex-col gap-1 border-t-4 border-t-emerald-500">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">⬆️ Mejor valor</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {kpis.mejorValor ?? '—'}
              </span>
            </Card>
            <Card className="flex flex-col gap-1 border-t-4 border-t-union-red-600">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">⬇️ Valor más bajo</span>
              <span className="text-2xl font-bold text-union-red-600 dark:text-union-red-400">
                {kpis.peorValor ?? '—'}
              </span>
            </Card>
            <Card className="flex flex-col gap-1 border-t-4 border-t-indigo-500">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">% Mejora grupal</span>
              <span
                className={`text-2xl font-bold ${
                  kpis.porcentajeMejoraGrupal === null
                    ? 'text-slate-400'
                    : kpis.porcentajeMejoraGrupal >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-union-red-600 dark:text-union-red-400'
                }`}
              >
                {kpis.porcentajeMejoraGrupal === null
                  ? '—'
                  : `${kpis.porcentajeMejoraGrupal > 0 ? '+' : ''}${kpis.porcentajeMejoraGrupal.toFixed(1)}%`}
              </span>
              <span className="text-xs text-slate-400">vs. evaluación anterior</span>
            </Card>
          </div>

          <TablaComparativa
            filas={tabla}
            fechaAnterior={fechaAnterior}
            fechaActual={fechaActual}
            invertirLogica={invertirLogica}
            onToggleInvertir={() => setInvertirLogica((v) => !v)}
          />

          <GraficoTendenciaGrupal serie={serie} metrica={metricaElegida} />

          <RankingsTopFive
            mejoresRelativos={mejoresRelativos}
            peoresRelativos={peoresRelativos}
            mayorMejora={mayorMejora}
            mayorDesmejora={mayorDesmejora}
            hayColumnaPeso={hayColumnaPeso}
          />
        </>
      )}
    </div>
  )
}
