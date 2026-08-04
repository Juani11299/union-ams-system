import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { useAppStore, useSessionPlansActivos, useAthletesActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'
import { fechaHoyLocal, formatFechaCorta } from '@/utils/fecha'
import type { Athlete } from '@/types'

interface FilaCsv {
  nombreCsv: string
  atleta: Athlete | null
  totalDistance: number
  highSpeedRunning: number
  playerLoad: number
}

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function parsearNumero(valor: unknown): number {
  const num = Number(String(valor ?? '').replace(',', '.'))
  return Number.isFinite(num) ? num : 0
}

export function CsvImportTab() {
  const sessionPlans = useSessionPlansActivos()
  const athletes = useAthletesActivos()
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const submitExternalLoadsBulk = useAppStore((s) => s.submitExternalLoadsBulk)
  const showToast = useToastStore((s) => s.showToast)

  const hoy = fechaHoyLocal()
  const sesionesPasadas = [...sessionPlans]
    .filter((p) => p.fecha <= hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const [planId, setPlanId] = useState(sesionesPasadas[0]?.id ?? '')
  const [filas, setFilas] = useState<FilaCsv[] | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [importando, setImportando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function procesarArchivo(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (resultado) => {
        const filasParseadas: FilaCsv[] = resultado.data.map((fila) => {
          const nombreCsv = fila.Jugador || fila.jugador || fila.nombre || ''
          const atleta =
            athletes.find((a) => normalizar(a.nombre) === normalizar(nombreCsv)) ?? null
          return {
            nombreCsv,
            atleta,
            totalDistance: parsearNumero(fila.Distancia ?? fila.distancia),
            highSpeedRunning: parsearNumero(fila.HSR ?? fila.hsr),
            playerLoad: parsearNumero(fila.PlayerLoad ?? fila.playerload ?? fila.playerLoad),
          }
        })
        setFilas(filasParseadas)
      },
      error: (err) => {
        showToast('error', getErrorMessage(err, 'No se pudo leer el archivo CSV.'))
      },
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setArrastrando(false)
    const file = e.dataTransfer.files?.[0]
    if (file) procesarArchivo(file)
  }

  const filasValidas = filas?.filter((f) => f.atleta !== null) ?? []

  async function handleImportar() {
    const plan = sesionesPasadas.find((p) => p.id === planId)
    if (!plan || !activeSeasonId || !activeCategoryId || filasValidas.length === 0) return

    setImportando(true)
    try {
      await submitExternalLoadsBulk(
        filasValidas.map((f) => ({
          planId: plan.id,
          athleteId: f.atleta!.id,
          seasonId: activeSeasonId,
          categoryId: activeCategoryId,
          fecha: plan.fecha,
          totalDistance: f.totalDistance,
          highSpeedRunning: f.highSpeedRunning,
          playerLoad: f.playerLoad,
        })),
      )
      showToast('success', `¡${filasValidas.length} registro(s) GPS importado(s) exitosamente!`)
      setFilas(null)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudieron importar los datos GPS.'))
    } finally {
      setImportando(false)
    }
  }

  if (sesionesPasadas.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Todavía no hay sesiones pasadas para asociar datos GPS.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2 sm:max-w-sm">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Sesión</span>
          <select className={inputClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {sesionesPasadas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.matchDay} · {formatFechaCorta(p.fecha)} · {p.titulo}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-12 text-center transition-colors ${
          arrastrando
            ? 'border-union-red-400 bg-union-red-50 dark:bg-union-red-500/10'
            : 'border-slate-300 hover:border-union-red-400 dark:border-slate-700'
        }`}
      >
        <span className="text-3xl">📄</span>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Arrastrá tu CSV acá o hacé clic para elegir el archivo
        </p>
        <p className="text-xs text-slate-400">
          Columnas esperadas: Jugador, Distancia, HSR, PlayerLoad
        </p>
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

      {filas && (
        <Card className="flex flex-col gap-3 p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Jugador (CSV)</th>
                  <th className="px-4 py-2 font-medium">Distancia</th>
                  <th className="px-4 py-2 font-medium">HSR</th>
                  <th className="px-4 py-2 font-medium">PlayerLoad</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{fila.nombreCsv}</td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{fila.totalDistance}</td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{fila.highSpeedRunning}</td>
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{fila.playerLoad}</td>
                    <td className="px-4 py-2">
                      {fila.atleta ? (
                        <Badge tone="green">✓ {fila.atleta.nombre}</Badge>
                      ) : (
                        <Badge tone="red">No encontrado</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 pb-4">
            <span className="text-xs text-slate-400">
              {filasValidas.length} de {filas.length} fila(s) listas para importar
            </span>
            <button
              type="button"
              onClick={handleImportar}
              disabled={importando || filasValidas.length === 0}
              className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importando ? 'Importando…' : `Confirmar e importar (${filasValidas.length})`}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
