import { useState } from 'react'
import { useAthletesActivos, useAppStore } from '@/store/useAppStore'
import { useTestingStore, TEST_CATALOG, type ZScoreResult } from '@/stores/useTestingStore'
import { Card } from '@/components/Card'

/**
 * Barra de z-score centrada en cero (Fase 30 — Perfil de Rendimiento 360°,
 * ver docs/Propuesta_Integracion_NSCA.md sección 1.2). Es la misma forma que
 * usa el propio libro en su Figura 13.21: positivo a la derecha (fortaleza),
 * negativo a la izquierda (debilidad a trabajar). Clamp a ±3 desvíos para que
 * un outlier no rompa la escala visual.
 */
function BarraZScore({ resultado }: { resultado: ZScoreResult }) {
  if (resultado.muestraInsuficiente || resultado.zScore === null) {
    return (
      <div className="flex items-center gap-3">
        <span className="w-40 shrink-0 truncate text-sm text-slate-600 dark:text-slate-300">{resultado.label}</span>
        <span className="text-xs text-slate-400">
          {resultado.valor} {resultado.unidad} — datos insuficientes para z-score (cargá al menos 2 atletas)
        </span>
      </div>
    )
  }

  const CLAMP = 3
  const z = Math.max(-CLAMP, Math.min(CLAMP, resultado.zScore))
  const anchoPct = (Math.abs(z) / CLAMP) * 50
  const esPositivo = z >= 0

  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm text-slate-600 dark:text-slate-300">{resultado.label}</span>
      <div className="relative h-5 flex-1 rounded bg-slate-100 dark:bg-slate-800">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400 dark:bg-slate-600" aria-hidden />
        <div
          className={`absolute inset-y-0 rounded ${esPositivo ? 'bg-emerald-500' : 'bg-union-red-600'}`}
          style={
            esPositivo
              ? { left: '50%', width: `${anchoPct}%` }
              : { right: '50%', width: `${anchoPct}%` }
          }
        />
      </div>
      <span className="w-28 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
        {resultado.valor} {resultado.unidad} (z={resultado.zScore.toFixed(2)})
      </span>
    </div>
  )
}

export function AthleteProfileView() {
  const athletes = useAthletesActivos()
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)

  const records = useTestingStore((s) => s.records)
  const addRecord = useTestingStore((s) => s.addRecord)
  const removeRecord = useTestingStore((s) => s.removeRecord)
  const getZScoresParaAtleta = useTestingStore((s) => s.getZScoresParaAtleta)

  const [athleteId, setAthleteId] = useState('')
  const [testKey, setTestKey] = useState(TEST_CATALOG[0].key)
  const [valor, setValor] = useState('')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))

  if (!activeSeasonId || !activeCategoryId) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Elegí una temporada y una categoría arriba para ver el Perfil de Rendimiento 360°.
      </Card>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(valor)
    if (!athleteId || !valor || Number.isNaN(num)) return
    addRecord({ athleteId, testKey, valor: num, fecha })
    setValor('')
  }

  const atletaSeleccionado = athletes.find((a) => a.id === athleteId)
  const zScores = athleteId ? getZScoresParaAtleta(athleteId) : []
  const historialAtleta = athleteId
    ? records
        .filter((r) => r.athleteId === athleteId)
        .slice()
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
    : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">PERFIL DE RENDIMIENTO 360°</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Batería de testeo y comparación por z-score contra el grupo — Cap. 12-13 NSCA.
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Atleta</span>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
          >
            <option value="">Seleccioná un atleta…</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Test</span>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
            >
              {TEST_CATALOG.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.unidad})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Valor</span>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Fecha</span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={!athleteId}
            className="rounded-lg bg-union-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-4"
          >
            + Cargar test
          </button>
        </form>
      </Card>

      {athleteId && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Perfil z-score — {atletaSeleccionado?.nombre}
          </h2>
          {zScores.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Todavía no hay tests cargados para este atleta.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {zScores.map((r) => (
                <BarraZScore key={r.testKey} resultado={r} />
              ))}
            </div>
          )}
        </Card>
      )}

      {athleteId && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Historial de tests</h2>
          {historialAtleta.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Sin registros todavía.</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {historialAtleta.map((r) => {
                const def = TEST_CATALOG.find((t) => t.key === r.testKey)
                return (
                  <div key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {def?.label ?? r.testKey}: <strong>{r.valor}</strong> {def?.unidad} — {r.fecha}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRecord(r.id)}
                      className="text-xs text-slate-400 hover:text-union-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
