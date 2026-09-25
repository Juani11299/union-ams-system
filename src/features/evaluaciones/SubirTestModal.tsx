import { useMemo, useState } from 'react'
import { aFechaIso, aNumero, leerTabla } from '@/features/antropometrias/parser'
import type { FilaArchivo } from '@/features/antropometrias/parser'
import { esMetricaAsimetria } from '@/features/periodization/evaluations/calculations'
import { clasificarColumnasEvaluacion } from '@/features/periodization/evaluations/csvClassifier'
import { inputClass } from '@/components/FormField'
import { useEvaluacionesDinamicasStore } from '@/stores/useEvaluacionesDinamicasStore'
import { normalizarNombre } from '@/utils/smartEntityMatcher'
import { TEST_NORDBORD, unidadDe } from './dinamicas'
import type { FilaEvaluacionDinamica, MetricaTestDinamico } from './dinamicas'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { leerArchivoTabular } from './leerArchivo'

const ICONOS = ['🧪', '🦵', '⚡', '🏃', '🏋️', '📈', '🎯', '💪']

interface Leido {
  archivo: string
  columnas: string[]
  filas: FilaArchivo[]
}

/** Tiempos (sprints, cambios de dirección) y asimetrías: menos es mejor. */
const menosEsMejorPorDefecto = (key: string): boolean => esMetricaAsimetria(key) || unidadDe(key).toLowerCase() === 's' || /sprint|tiempo|time\b/i.test(key)

const cel = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim())

/**
 * "Subir Nuevo Test": el staff sube un CSV/Excel, lo NOMBRA y se crea una
 * tarjeta nueva en el Hub. Las columnas se clasifican con el mismo
 * `clasificarColumnasEvaluacion` que usa CMJ (jugador, peso, categoría,
 * fecha y métricas numéricas); el profe puede marcar qué métricas son "clave"
 * (van al Radar Unificado del Perfil 360°) y cuáles son "menos es mejor".
 */
export function SubirTestModal({ onClose, onCreado }: { onClose: () => void; onCreado: (id: string) => void }) {
  const guardarTest = useEvaluacionesDinamicasStore((s) => s.guardarTest)
  const testsExistentes = useEvaluacionesDinamicasStore((s) => s.filas)
  const showToast = useToastStore((s) => s.showToast)

  const [leido, setLeido] = useState<Leido | null>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [icono, setIcono] = useState(ICONOS[0])
  const [fechaManual, setFechaManual] = useState(() => new Date().toISOString().slice(0, 10))
  const [overrides, setOverrides] = useState<Record<string, Partial<Pick<MetricaTestDinamico, 'clave' | 'menosEsMejor'>>>>({})

  const clasif = useMemo(() => {
    if (!leido) return null
    const filasTexto = leido.filas.map((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, cel(v)])))
    return clasificarColumnasEvaluacion(leido.columnas, filasTexto)
  }, [leido])

  const metricas: MetricaTestDinamico[] = useMemo(() => {
    if (!clasif) return []
    // Por defecto son "clave" las primeras 3 métricas principales (ni asimetrías ni laterales (L)/(R)).
    const principales = new Set(clasif.metricas.filter((k) => !esMetricaAsimetria(k) && !/\((L|R)\)\s*$/.test(k)).slice(0, 3))
    return clasif.metricas.map((key) => ({
      key,
      label: key,
      unidad: unidadDe(key),
      menosEsMejor: overrides[key]?.menosEsMejor ?? menosEsMejorPorDefecto(key),
      clave: overrides[key]?.clave ?? principales.has(key),
    }))
  }, [clasif, overrides])

  async function elegirArchivo(file: File) {
    setLeyendo(true)
    try {
      const { columnas, filas } = leerTabla(await leerArchivoTabular(file))
      if (columnas.length === 0 || filas.length === 0) {
        showToast('error', 'El archivo no tiene filas con datos.')
        return
      }
      setLeido({ archivo: file.name, columnas, filas })
      setNombre((n) => n || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
      setOverrides({})
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo leer el archivo.'))
    } finally {
      setLeyendo(false)
    }
  }

  async function crear() {
    if (!leido || !clasif || nombre.trim() === '' || guardando) return
    const testName = nombre.trim()
    if (testName.toLowerCase() === TEST_NORDBORD.toLowerCase()) {
      showToast('error', `"${TEST_NORDBORD}" es el nombre del dashboard de NordBord: elegí otro nombre para este test.`)
      return
    }
    const filas: FilaEvaluacionDinamica[] = []
    for (const f of leido.filas) {
      const jugador = cel(f[clasif.columnaJugador])
      if (!jugador) continue
      const fecha = (clasif.columnaFecha ? aFechaIso(f[clasif.columnaFecha]) : null) ?? fechaManual
      const metrics: Record<string, number> = {}
      for (const m of metricas) {
        const v = aNumero(f[m.key])
        if (v !== null) metrics[m.key] = v
      }
      if (Object.keys(metrics).length === 0) continue
      const categoria = (clasif.columnaCategoria ? cel(f[clasif.columnaCategoria]) : '') || 'Sin categoría'
      filas.push({ test_name: testName, player_name: jugador, player_key: normalizarNombre(jugador), category_label: categoria, fecha, metrics, test_config: {} })
    }
    if (filas.length === 0) {
      showToast('error', 'No se encontraron filas con jugador y valores numéricos.')
      return
    }
    const usadas = new Set(filas.flatMap((f) => Object.keys(f.metrics)))
    const usadasMetricas = metricas.filter((m) => usadas.has(m.key))
    setGuardando(true)
    try {
      const existia = testsExistentes.some((f) => f.test_name === testName)
      const { guardadas } = await guardarTest(testName, filas, {
        icono,
        archivo: leido.archivo,
        key_metrics: usadasMetricas.filter((m) => m.clave).map((m) => m.key),
        less_is_better: usadasMetricas.filter((m) => m.menosEsMejor).map((m) => m.key),
        unidades: Object.fromEntries(usadasMetricas.filter((m) => m.unidad).map((m) => [m.key, m.unidad])),
        descartados: leido.filas.length - filas.length,
        cargado_en: new Date().toISOString(),
      })
      showToast('success', `${existia ? 'Test actualizado' : 'Test creado'}: "${testName}" · ${guardadas} evaluaciones guardadas en Supabase.`)
      onCreado(testName)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar el test.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">＋ Subir nuevo test</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Subí un CSV o Excel, ponele nombre y se guarda en Supabase con una tarjeta nueva en el Hub. Si el nombre ya existe, se actualizan las evaluaciones de esa fecha. También entra al Perfil de Atleta 360°.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {!leido ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-12 text-center hover:border-union-red-400 dark:border-slate-700">
            <span className="text-3xl" aria-hidden>
              📥
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{leyendo ? 'Leyendo archivo…' : 'Tocá para elegir el archivo del test'}</span>
            <span className="text-xs text-slate-400">CSV o Excel (.xlsx, .xls) · una fila por jugador y fecha</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void elegirArchivo(f)
                e.target.value = ''
              }}
            />
          </label>
        ) : (
          clasif && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Nombre del test *</span>
                  <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Sprint 30m — Pretemporada" autoFocus />
                </label>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Ícono</span>
                  <div className="flex flex-wrap gap-1">
                    {ICONOS.map((i) => (
                      <button key={i} type="button" onClick={() => setIcono(i)} className={`rounded-lg border px-2 py-1.5 text-base ${icono === i ? 'border-union-red-500 bg-union-red-50 dark:bg-union-red-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">📄 {leido.archivo}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {leido.filas.length} fila(s) · {metricas.length} métrica(s)
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Jugador: {clasif.columnaJugador}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Categoría: {clasif.columnaCategoria ?? '— (Sin categoría)'}</span>
                {clasif.columnaFecha ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Fecha: {clasif.columnaFecha}</span>
                ) : (
                  <label className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    El archivo no trae fecha →
                    <input type="date" className={`${inputClass} py-1 text-xs`} value={fechaManual} onChange={(e) => setFechaManual(e.target.value)} />
                  </label>
                )}
              </div>

              {metricas.length === 0 ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                  ⚠️ No se detectó ninguna columna numérica para usar como métrica.
                </p>
              ) : (
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    Métricas detectadas — marcá las <b>clave</b> (van al radar del Perfil 360°) y cuáles son "menos es mejor"
                  </p>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-left text-[11px] uppercase text-slate-400 dark:bg-slate-800">
                        <tr>
                          <th className="px-2 py-1.5">Métrica</th>
                          <th className="px-2 py-1.5 text-center">Clave</th>
                          <th className="px-2 py-1.5 text-center">Menos es mejor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricas.map((m) => (
                          <tr key={m.key} className="border-t border-slate-100 dark:border-slate-800">
                            <td className="px-2 py-1 text-slate-700 dark:text-slate-300">{m.label}</td>
                            <td className="px-2 py-1 text-center">
                              <input type="checkbox" checked={m.clave} onChange={(e) => setOverrides((o) => ({ ...o, [m.key]: { ...o[m.key], clave: e.target.checked } }))} />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <input type="checkbox" checked={m.menosEsMejor} onChange={(e) => setOverrides((o) => ({ ...o, [m.key]: { ...o[m.key], menosEsMejor: e.target.checked } }))} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" onClick={() => setLeido(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-union-red-400 dark:border-slate-700 dark:text-slate-300">
                  ← Elegir otro archivo
                </button>
                <button
                  type="button"
                  disabled={nombre.trim() === '' || metricas.length === 0 || guardando}
                  onClick={() => void crear()}
                  className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando ? 'Guardando en Supabase…' : 'Crear test y tarjeta'}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
