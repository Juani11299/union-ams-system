import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { Card } from '@/components/Card'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'

/**
 * Importador de CSV dinámico para evaluaciones de rendimiento (Fase 33.1,
 * ver docs/Propuesta_Integracion_NSCA.md sección 1) — a diferencia de
 * `CsvImportTab` (GPS, columnas fijas: Jugador/Distancia/HSR/PlayerLoad),
 * acá el CSV puede traer CUALQUIER métrica de test (CMJ_Height_cm,
 * Nordic_Force_N, etc.): se leen las cabeceras en runtime y el profe elige
 * cuál graficar. No se persiste a ningún store — es sólo visualización rápida
 * de un reporte externo (VALD, Hawkin Dynamics, planilla propia).
 */
const CANDIDATOS_COLUMNA_JUGADOR = ['jugador', 'player', 'nombre', 'atleta', 'name']

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function parsearNumero(valor: unknown): number {
  const num = Number(String(valor ?? '').replace(',', '.'))
  return Number.isFinite(num) ? num : 0
}

interface PuntoEvaluacion {
  jugador: string
  valor: number
}

export function EvaluacionesRendimientoTab() {
  const showToast = useToastStore((s) => s.showToast)
  const inputRef = useRef<HTMLInputElement>(null)

  const [columnas, setColumnas] = useState<string[]>([])
  const [filas, setFilas] = useState<Record<string, string>[]>([])
  const [columnaJugador, setColumnaJugador] = useState('')
  const [metricaSeleccionada, setMetricaSeleccionada] = useState('')
  const [nombreArchivo, setNombreArchivo] = useState('')

  function procesarArchivo(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (resultado) => {
        const cols = resultado.meta.fields ?? []
        if (cols.length === 0) {
          showToast('error', 'El CSV no tiene columnas reconocibles.')
          return
        }
        const colJugador = cols.find((c) => CANDIDATOS_COLUMNA_JUGADOR.includes(normalizar(c))) ?? cols[0]
        const metricasDisponibles = cols.filter((c) => c !== colJugador)

        setColumnas(cols)
        setFilas(resultado.data)
        setColumnaJugador(colJugador)
        setMetricaSeleccionada(metricasDisponibles[0] ?? '')
        setNombreArchivo(file.name)
      },
      error: (err) => {
        showToast('error', getErrorMessage(err, 'No se pudo leer el archivo CSV.'))
      },
    })
  }

  const metricas = columnas.filter((c) => c !== columnaJugador)

  const datosGrafico = useMemo<PuntoEvaluacion[]>(() => {
    if (!metricaSeleccionada) return []
    return filas
      .filter((fila) => (fila[columnaJugador] ?? '').trim() !== '')
      .map((fila) => ({
        jugador: fila[columnaJugador],
        valor: parsearNumero(fila[metricaSeleccionada]),
      }))
  }, [filas, columnaJugador, metricaSeleccionada])

  const maxValor = Math.max(1, ...datosGrafico.map((d) => d.valor))

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Importar evaluaciones (CSV)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cualquier CSV con una columna de jugador y columnas de métricas (ej. CMJ_Height_cm, Nordic_Force_N). Las
          cabeceras se leen automáticamente del archivo.
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-8 text-center transition-colors hover:border-union-red-400 dark:border-slate-700"
        >
          <span className="text-2xl">📈</span>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {nombreArchivo || 'Hacé clic para elegir un archivo .csv'}
          </p>
          {nombreArchivo && <p className="text-xs text-slate-400">Columna de jugador detectada: {columnaJugador}</p>}
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

        {metricas.length > 0 && (
          <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">Métrica a visualizar</span>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={metricaSeleccionada}
              onChange={(e) => setMetricaSeleccionada(e.target.value)}
            >
              {metricas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        )}
      </Card>

      {datosGrafico.length === 0 ? (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Subí un CSV para visualizar una métrica de evaluación por jugador.
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{metricaSeleccionada}</h3>
          <div className="flex items-end gap-3 overflow-x-auto pb-2">
            {datosGrafico.map((d, i) => (
              <div key={`${d.jugador}-${i}`} className="flex w-14 shrink-0 flex-col items-center gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{d.valor}</span>
                <div className="flex h-40 w-8 items-end rounded bg-slate-100 dark:bg-slate-800">
                  <div
                    className="w-full rounded bg-union-red-600"
                    style={{ height: `${(d.valor / maxValor) * 100}%` }}
                  />
                </div>
                <span className="w-14 truncate text-center text-[10px] text-slate-400" title={d.jugador}>
                  {d.jugador}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
