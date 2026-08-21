import { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { Card } from '@/components/Card'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'

/**
 * Dashboard Analítico de Evaluaciones de Rendimiento (Fase 33.2, ver
 * docs/Propuesta_Integracion_NSCA.md sección 1) — a diferencia de
 * `CsvImportTab` (GPS, columnas fijas), acá el CSV puede traer CUALQUIER
 * batería de test (CMJ_Height, Fuerza_Max, Asimetria_RSI, etc.): se
 * clasifican las columnas en runtime (metadata vs. métrica numérica), se
 * filtra por Categoría/Posición y se compara cada jugador contra la media
 * del grupo filtrado (mismo método de z-score del Cap. 13 NSCA que ya usa el
 * resto de la app). No se persiste a ningún store — es visualización rápida
 * de un reporte externo (VALD, Hawkin Dynamics, planilla propia).
 */
const PATRONES_METADATA = {
  jugador: ['jugador', 'player', 'nombre', 'atleta', 'name'],
  fechaNacimiento: ['fechanacimiento', 'birthdate', 'dob', 'nacimiento', 'fechadenacimiento'],
  categoria: ['categoria', 'category', 'division'],
  posicion: ['posicion', 'position', 'pos'],
}

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Clave de matching más agresiva que `normalizar` — también saca espacios/guiones para que "Fecha_Nacimiento" y "Fecha Nacimiento" calcen con el mismo patrón. */
function normalizarClave(texto: string): string {
  return normalizar(texto).replace(/[^a-z0-9]/g, '')
}

function parsearNumero(valor: unknown): number {
  const num = Number(String(valor ?? '').replace(',', '.'))
  return Number.isFinite(num) ? num : 0
}

function esValorNumerico(valor: string): boolean {
  const limpio = valor.trim().replace(',', '.')
  return limpio !== '' && Number.isFinite(Number(limpio))
}

/** Una columna es "métrica" si NO es metadata y al menos 80% de sus valores no vacíos parsean como número — así una columna de fecha de nacimiento o de club nunca aparece en el selector de métricas. */
function esColumnaNumerica(columna: string, filas: Record<string, string>[]): boolean {
  const valores = filas.map((f) => (f[columna] ?? '').trim()).filter((v) => v !== '')
  if (valores.length === 0) return false
  const numericos = valores.filter(esValorNumerico).length
  return numericos / valores.length >= 0.8
}

interface ClasificacionCsv {
  columnaJugador: string
  columnaCategoria: string | null
  columnaPosicion: string | null
  metricas: string[]
}

function clasificarColumnas(columnas: string[], filas: Record<string, string>[]): ClasificacionCsv {
  const claves = columnas.map((c) => ({ original: c, clave: normalizarClave(c) }))
  const encontrar = (patrones: string[]) => claves.find((c) => patrones.includes(c.clave))?.original ?? null

  const columnaJugador = encontrar(PATRONES_METADATA.jugador) ?? columnas[0]
  const columnaCategoria = encontrar(PATRONES_METADATA.categoria)
  const columnaPosicion = encontrar(PATRONES_METADATA.posicion)
  const columnaFechaNacimiento = encontrar(PATRONES_METADATA.fechaNacimiento)

  const metadata = new Set(
    [columnaJugador, columnaCategoria, columnaPosicion, columnaFechaNacimiento].filter((c): c is string => c !== null),
  )
  const metricas = columnas.filter((c) => !metadata.has(c) && esColumnaNumerica(c, filas))

  return { columnaJugador, columnaCategoria, columnaPosicion, metricas }
}

/** "Asimetria_RSI", "Asym_Force", "Imbalance_pct" → true. En estas métricas MENOS es mejor, al revés que el resto. */
function esMetricaAsimetria(metrica: string): boolean {
  const clave = normalizarClave(metrica)
  return clave.includes('asimetria') || clave.includes('asym') || clave.includes('imbalance')
}

type ColorSemaforo = 'verde' | 'ambar' | 'rojo'

const CLASE_BARRA: Record<ColorSemaforo, string> = {
  verde: 'bg-emerald-500',
  ambar: 'bg-amber-500',
  rojo: 'bg-union-red-600',
}
const CLASE_TEXTO: Record<ColorSemaforo, string> = {
  verde: 'text-emerald-600 dark:text-emerald-400',
  ambar: 'text-amber-600 dark:text-amber-400',
  rojo: 'text-union-red-600 dark:text-union-red-400',
}
const CLASE_PUNTO: Record<ColorSemaforo, string> = {
  verde: 'bg-emerald-500',
  ambar: 'bg-amber-500',
  rojo: 'bg-union-red-600',
}

/**
 * Semáforo de riesgo (Paso 3.3). Para asimetrías, la NSCA (Cap. 22, ver
 * docs/Propuesta_Integracion_NSCA.md sección 4) marca <10% como aceptable —
 * acá usamos ese mismo corte como límite de riesgo (rojo) y <5% como zona
 * óptima (verde). Para métricas de rendimiento normales, el corte es por
 * z-score (±0.5, umbral "pequeño-a-moderado" según la escala de magnitud del
 * efecto del Cap. 13 NSCA) contra la media del grupo filtrado.
 */
function colorSemaforo(valor: number, zScore: number, esInversa: boolean): ColorSemaforo {
  if (esInversa) {
    if (valor > 10) return 'rojo'
    if (valor < 5) return 'verde'
    return 'ambar'
  }
  if (zScore >= 0.5) return 'verde'
  if (zScore <= -0.5) return 'rojo'
  return 'ambar'
}

interface PuntoEvaluacion {
  jugador: string
  valor: number
  zScore: number
  color: ColorSemaforo
}

const selectClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

export function EvaluacionesRendimientoTab() {
  const showToast = useToastStore((s) => s.showToast)
  const inputRef = useRef<HTMLInputElement>(null)

  const [filas, setFilas] = useState<Record<string, string>[]>([])
  const [clasificacion, setClasificacion] = useState<ClasificacionCsv | null>(null)
  const [metricaSeleccionada, setMetricaSeleccionada] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [posicionFiltro, setPosicionFiltro] = useState('')
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
        const clasif = clasificarColumnas(cols, resultado.data)
        if (clasif.metricas.length === 0) {
          showToast('error', 'No se encontró ninguna columna numérica para graficar en este CSV.')
        }

        setFilas(resultado.data)
        setClasificacion(clasif)
        setMetricaSeleccionada(clasif.metricas[0] ?? '')
        setCategoriaFiltro('')
        setPosicionFiltro('')
        setNombreArchivo(file.name)
      },
      error: (err) => {
        showToast('error', getErrorMessage(err, 'No se pudo leer el archivo CSV.'))
      },
    })
  }

  const categoriasUnicas = useMemo(() => {
    if (!clasificacion?.columnaCategoria) return []
    const col = clasificacion.columnaCategoria
    return Array.from(new Set(filas.map((f) => f[col]).filter((v): v is string => !!v?.trim()))).sort()
  }, [filas, clasificacion])

  const posicionesUnicas = useMemo(() => {
    if (!clasificacion?.columnaPosicion) return []
    const col = clasificacion.columnaPosicion
    return Array.from(new Set(filas.map((f) => f[col]).filter((v): v is string => !!v?.trim()))).sort()
  }, [filas, clasificacion])

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      if (clasificacion?.columnaCategoria && categoriaFiltro && f[clasificacion.columnaCategoria] !== categoriaFiltro) {
        return false
      }
      if (clasificacion?.columnaPosicion && posicionFiltro && f[clasificacion.columnaPosicion] !== posicionFiltro) {
        return false
      }
      return true
    })
  }, [filas, clasificacion, categoriaFiltro, posicionFiltro])

  const analisis = useMemo(() => {
    if (!clasificacion || !metricaSeleccionada) {
      return { datos: [] as PuntoEvaluacion[], media: 0, minValor: 0, maxValor: 0, esInversa: false }
    }
    const esInversa = esMetricaAsimetria(metricaSeleccionada)
    const base = filasFiltradas
      .filter((fila) => (fila[clasificacion.columnaJugador] ?? '').trim() !== '')
      .map((fila) => ({ jugador: fila[clasificacion.columnaJugador], valor: parsearNumero(fila[metricaSeleccionada]) }))

    if (base.length === 0) {
      return { datos: [] as PuntoEvaluacion[], media: 0, minValor: 0, maxValor: 0, esInversa }
    }

    const valores = base.map((d) => d.valor)
    const media = valores.reduce((s, v) => s + v, 0) / valores.length
    const varianza = valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length
    const desvio = Math.sqrt(varianza)
    const minValor = Math.min(...valores)
    const maxValor = Math.max(...valores)

    const datos: PuntoEvaluacion[] = base.map((d) => {
      const zScore = desvio > 0 ? (d.valor - media) / desvio : 0
      return { ...d, zScore, color: colorSemaforo(d.valor, zScore, esInversa) }
    })

    return { datos, media, minValor, maxValor, esInversa }
  }, [filasFiltradas, clasificacion, metricaSeleccionada])

  const { datos, media, minValor, maxValor, esInversa } = analisis

  const ordenados = useMemo(
    () => [...datos].sort((a, b) => (esInversa ? a.valor - b.valor : b.valor - a.valor)),
    [datos, esInversa],
  )
  const tamanoGrupo = Math.min(3, Math.floor(ordenados.length / 2))
  const mejores = ordenados.slice(0, tamanoGrupo)
  const enRiesgo = tamanoGrupo > 0 ? ordenados.slice(ordenados.length - tamanoGrupo).reverse() : []

  const techo = maxValor > 0 ? maxValor * 1.2 : 1
  const mediaPct = techo > 0 ? Math.min(100, (media / techo) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Importar evaluaciones (CSV)</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cualquier CSV con columnas de metadatos (Jugador, Categoría, Posición, Fecha de Nacimiento) y columnas de
          métricas numéricas (ej. CMJ_Height, Fuerza_Max, Asimetria_RSI). Se clasifican automáticamente.
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-8 text-center transition-colors hover:border-union-red-400 dark:border-slate-700"
        >
          <span className="text-2xl">📈</span>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {nombreArchivo || 'Hacé clic para elegir un archivo .csv'}
          </p>
          {clasificacion && (
            <p className="text-xs text-slate-400">
              Jugador: {clasificacion.columnaJugador} · {clasificacion.metricas.length} métrica(s) numérica(s)
              detectada(s)
            </p>
          )}
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

      {clasificacion && (
        <Card className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Métrica a visualizar</span>
            <select className={selectClass} value={metricaSeleccionada} onChange={(e) => setMetricaSeleccionada(e.target.value)}>
              {clasificacion.metricas.length === 0 && <option value="">Sin métricas numéricas</option>}
              {clasificacion.metricas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          {clasificacion.columnaCategoria && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Categoría</span>
              <select className={selectClass} value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                <option value="">Todas</option>
                {categoriasUnicas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}

          {clasificacion.columnaPosicion && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Posición</span>
              <select className={selectClass} value={posicionFiltro} onChange={(e) => setPosicionFiltro(e.target.value)}>
                <option value="">Todas</option>
                {posicionesUnicas.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          )}
        </Card>
      )}

      {!metricaSeleccionada || datos.length === 0 ? (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {clasificacion
            ? 'Sin jugadores para esta combinación de filtros.'
            : 'Subí un CSV para visualizar métricas de evaluación por jugador.'}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="flex flex-col gap-1 border-t-4 border-t-slate-400">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">📊 Media del equipo</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{media.toFixed(2)}</span>
              <span className="text-xs text-slate-400">{datos.length} jugador(es) en este filtro</span>
            </Card>
            <Card className="flex flex-col gap-1 border-t-4 border-t-emerald-500">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">⬆️ Valor máximo</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{maxValor}</span>
            </Card>
            <Card className="flex flex-col gap-1 border-t-4 border-t-union-red-600">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">⬇️ Valor mínimo</span>
              <span className="text-2xl font-bold text-union-red-600 dark:text-union-red-400">{minValor}</span>
            </Card>
          </div>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{metricaSeleccionada}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> {esInversa ? '< 5% (óptimo)' : 'Sobre la media'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Neutral
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-union-red-600" /> {esInversa ? '> 10% (riesgo)' : 'Bajo la media'}
                </span>
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute inset-x-0 z-10 border-t-2 border-dashed border-slate-400 dark:border-slate-500"
                style={{ bottom: `${mediaPct}%` }}
              >
                <span className="absolute -top-4 right-0 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-white dark:bg-slate-600">
                  Media: {media.toFixed(1)}
                </span>
              </div>
              <div className="flex h-56 items-end gap-3 overflow-x-auto pb-1 pt-6">
                {datos.map((d, i) => (
                  <div key={`${d.jugador}-${i}`} className="flex h-full w-14 shrink-0 flex-col items-center justify-end gap-1">
                    <span className={`text-xs font-semibold ${CLASE_TEXTO[d.color]}`}>{d.valor}</span>
                    <div className="flex w-8 flex-1 items-end rounded bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`w-full rounded transition-all ${CLASE_BARRA[d.color]}`}
                        style={{ height: `${Math.max(2, (d.valor / techo) * 100)}%` }}
                      />
                    </div>
                    <span className="w-14 truncate text-center text-[10px] text-slate-400" title={d.jugador}>
                      {d.jugador}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {tamanoGrupo > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="flex flex-col gap-2">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  🏆 Top Performers
                </h3>
                {mejores.map((d, i) => (
                  <div
                    key={`mejor-${d.jugador}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                  >
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className={`h-2 w-2 rounded-full ${CLASE_PUNTO[d.color]}`} />
                      {d.jugador}
                    </span>
                    <span className={`font-semibold ${CLASE_TEXTO[d.color]}`}>{d.valor}</span>
                  </div>
                ))}
              </Card>

              <Card className="flex flex-col gap-2">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  ⚠️ Atletas en Riesgo
                </h3>
                {enRiesgo.map((d, i) => (
                  <div
                    key={`riesgo-${d.jugador}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                  >
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className={`h-2 w-2 rounded-full ${CLASE_PUNTO[d.color]}`} />
                      {d.jugador}
                    </span>
                    <span className={`font-semibold ${CLASE_TEXTO[d.color]}`}>{d.valor}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
