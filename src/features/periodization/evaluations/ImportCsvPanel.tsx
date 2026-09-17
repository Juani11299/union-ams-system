import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Field, inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'
import { fechaHoyLocal } from '@/utils/fecha'
import { clasificarColumnasEvaluacion, parsearNumeroCsv } from './csvClassifier'
import { useAthletesDeCategoria } from './useAthletesDeCategoria'
import type { Athlete } from '@/types'
import type { NuevaPerformanceEvaluationInput } from '@/utils/supabaseMappers'

function normalizarNombreSimple(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

interface FilaParseada {
  nombreCsv: string
  atleta: Athlete | null
  valores: Record<string, number>
  pesoKg: number | null
}

/**
 * Importación de CSV (Fase 38, Paso "Ingesta"; Fase 39 — temporada/categoría
 * pasan a ser props del selector LOCAL del panel, no el selector global) —
 * mismo criterio de matching que `CsvImportTab.tsx` (carga externa GPS): el
 * nombre del jugador del CSV se cruza contra el plantel de la temporada/
 * categoría elegida EN ESTE PANEL — no contra todo el club, ni contra la
 * categoría activa del resto de la app. Una fila sin match no se importa
 * (no tiene sentido guardar una evaluación sin `athlete_id`, ver
 * migration_fase38).
 */
export function ImportCsvPanel({
  seasonId,
  categoryId,
  onImportado,
}: {
  seasonId: string
  categoryId: string
  onImportado: () => void
}) {
  const importPerformanceEvaluationsBulk = useAppStore((s) => s.importPerformanceEvaluationsBulk)
  const athletes = useAthletesDeCategoria(seasonId, categoryId)
  const showToast = useToastStore((s) => s.showToast)
  const inputRef = useRef<HTMLInputElement>(null)

  const [filas, setFilas] = useState<FilaParseada[] | null>(null)
  const [metricasDisponibles, setMetricasDisponibles] = useState<string[]>([])
  const [metricasElegidas, setMetricasElegidas] = useState<Set<string>>(new Set())
  const [columnaPeso, setColumnaPeso] = useState<string | null>(null)
  const [nombreEvaluacion, setNombreEvaluacion] = useState('')
  const [fecha, setFecha] = useState(fechaHoyLocal())
  const [importando, setImportando] = useState(false)

  function procesarArchivo(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (resultado) => {
        const columnas = resultado.meta.fields ?? []
        if (columnas.length === 0) {
          showToast('error', 'El CSV no tiene columnas reconocibles.')
          return
        }
        const clasif = clasificarColumnasEvaluacion(columnas, resultado.data)
        if (clasif.metricas.length === 0) {
          showToast('error', 'No se encontró ninguna columna numérica para importar en este CSV.')
          return
        }

        const filasParseadas: FilaParseada[] = resultado.data.map((fila) => {
          const nombreCsv = fila[clasif.columnaJugador] ?? ''
          const atleta =
            athletes.find((a) => normalizarNombreSimple(a.nombre) === normalizarNombreSimple(nombreCsv)) ?? null
          const valores: Record<string, number> = {}
          for (const metrica of clasif.metricas) {
            const num = parsearNumeroCsv(fila[metrica])
            if (num !== null) valores[metrica] = num
          }
          const pesoKg = clasif.columnaPeso ? parsearNumeroCsv(fila[clasif.columnaPeso]) : null
          return { nombreCsv, atleta, valores, pesoKg }
        })

        setFilas(filasParseadas)
        setMetricasDisponibles(clasif.metricas)
        setMetricasElegidas(new Set(clasif.metricas))
        setColumnaPeso(clasif.columnaPeso)
        setNombreEvaluacion((prev) => prev || file.name.replace(/\.csv$/i, ''))
      },
      error: (err) => {
        showToast('error', getErrorMessage(err, 'No se pudo leer el archivo CSV.'))
      },
    })
  }

  function toggleMetrica(metrica: string) {
    setMetricasElegidas((prev) => {
      const next = new Set(prev)
      if (next.has(metrica)) next.delete(metrica)
      else next.add(metrica)
      return next
    })
  }

  function limpiar() {
    setFilas(null)
    setMetricasDisponibles([])
    setMetricasElegidas(new Set())
    setColumnaPeso(null)
    setNombreEvaluacion('')
  }

  const filasValidas = filas?.filter((f) => f.atleta !== null) ?? []
  const filasSinMatch = filas?.filter((f) => f.atleta === null && f.nombreCsv.trim() !== '') ?? []

  async function handleImportar() {
    if (!seasonId || !categoryId || filasValidas.length === 0 || metricasElegidas.size === 0) return
    if (!nombreEvaluacion.trim()) {
      showToast('error', 'Ponele un nombre a la evaluación (ej. "CMJ — Marzo 2026").')
      return
    }

    setImportando(true)
    try {
      const inputs: NuevaPerformanceEvaluationInput[] = filasValidas.map((f) => {
        const metrics: Record<string, number> = {}
        for (const m of metricasElegidas) {
          if (f.valores[m] !== undefined) metrics[m] = f.valores[m]
        }
        return {
          seasonId,
          categoryId,
          athleteId: f.atleta!.id,
          evaluationName: nombreEvaluacion.trim(),
          fecha,
          metrics,
          bodyWeightKg: f.pesoKg ?? undefined,
        }
      })
      const cantidad = await importPerformanceEvaluationsBulk(inputs)
      showToast('success', `¡${cantidad} evaluación(es) importada(s)!`)
      limpiar()
      onImportado()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo importar el CSV.'))
    } finally {
      setImportando(false)
    }
  }

  if (!filas) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Importar evaluaciones (CSV)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cualquier CSV con una columna de jugador y columnas numéricas de métricas (ej. CMJ_Height, Fuerza_Max_Izq,
          Asimetria_RSI, Peso). Se clasifican automáticamente y se matchean contra el plantel de la categoría activa.
        </p>
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-8 text-center transition-colors hover:border-union-red-400 dark:border-slate-700"
        >
          <span className="text-2xl">📈</span>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Hacé clic para elegir un archivo .csv</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) procesarArchivo(file)
              e.target.value = ''
            }}
          />
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Confirmar importación</h2>
        <button
          type="button"
          onClick={limpiar}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-union-red-400 hover:bg-union-red-50 hover:text-union-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-union-red-500/10 dark:hover:text-union-red-400"
        >
          🗑️ Empezar de nuevo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre de la evaluación" required>
          <input
            className={inputClass}
            value={nombreEvaluacion}
            onChange={(e) => setNombreEvaluacion(e.target.value)}
            placeholder='Ej. "CMJ — Marzo 2026"'
          />
        </Field>
        <Field label="Fecha de la evaluación" required>
          <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          Métricas a importar y graficar ({metricasElegidas.size}/{metricasDisponibles.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {metricasDisponibles.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMetrica(m)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                metricasElegidas.has(m)
                  ? 'border-union-red-500 bg-union-red-50 text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700'
              }`}
            >
              {metricasElegidas.has(m) ? '✓ ' : ''}
              {m}
            </button>
          ))}
        </div>
        {columnaPeso && (
          <p className="mt-2 text-[11px] text-slate-400">
            ⚖️ Columna de peso corporal detectada: <span className="font-medium">{columnaPeso}</span> — se guarda
            aparte, para las métricas relativas al peso.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          ✅ {filasValidas.length} jugador(es) matcheado(s) con el plantel activo
        </span>
        {filasSinMatch.length > 0 && (
          <span
            className="cursor-help rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            title={filasSinMatch.map((f) => f.nombreCsv).join(', ')}
          >
            ⚠️ {filasSinMatch.length} sin match (no se importan) — pasá el mouse para ver nombres
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleImportar}
        disabled={importando || filasValidas.length === 0 || metricasElegidas.size === 0}
        className="self-start rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {importando ? 'Importando…' : `📥 Importar ${filasValidas.length} evaluación(es)`}
      </button>
    </Card>
  )
}
