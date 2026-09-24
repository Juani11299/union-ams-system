import { useMemo, useState } from 'react'
import Papa from 'papaparse'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { useToastStore } from '@/store/useToastStore'
import { useAntropometriasStore } from '@/stores/useAntropometriasStore'
import { getErrorMessage } from '@/utils/errors'
import { detectarColumnas, leerTabla, construirMediciones, mapeoAlcanza } from './parser'
import { esFormatoInforme, parsearInforme } from './informeParser'
import type { ResultadoInforme } from './informeParser'
import type { Matriz, Celda } from './parser'
import type { CampoAntropo, MapeoColumnas } from './types'

const CAMPOS: { campo: CampoAntropo; etiqueta: string; obligatorio: boolean }[] = [
  { campo: 'jugador', etiqueta: 'Jugador', obligatorio: true },
  { campo: 'fecha', etiqueta: 'Fecha', obligatorio: true },
  { campo: 'categoria', etiqueta: 'Categoría / División', obligatorio: false },
  { campo: 'peso', etiqueta: 'Peso [kg]', obligatorio: false },
  { campo: 'grasa', etiqueta: 'Masa Adiposa [%]', obligatorio: false },
  { campo: 'musculo', etiqueta: 'Masa Muscular [%]', obligatorio: false },
  { campo: 'pliegues', etiqueta: 'Sumatoria de Pliegues', obligatorio: false },
]

/**
 * Lee el archivo como texto. Los CSV exportados desde Excel en español a
 * veces vienen en Windows-1252 en vez de UTF-8; leerlos como UTF-8 rompe las
 * tildes de los ENCABEZADOS ("Categoría" → "Categor�a") y ahí el
 * reconocimiento de columnas falla en silencio. Se prueba UTF-8 estricto y,
 * si el archivo no es UTF-8 válido, se reintenta como Windows-1252.
 */
async function leerTextoRobusto(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^\uFEFF/, '')
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

async function leerCsv(file: File): Promise<Record<string, Matriz>> {
  const texto = await leerTextoRobusto(file)
  const { data } = Papa.parse<string[]>(texto, { skipEmptyLines: true })
  return { [file.name]: data }
}

/** Excel: cada hoja a matriz cruda. Se carga `xlsx` recién acá (import dinámico) para no engordar el bundle de toda la app. */
async function leerExcel(file: File): Promise<Record<string, Matriz>> {
  const XLSX = await import('xlsx')
  const libro = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const hojas: Record<string, Matriz> = {}
  for (const nombre of libro.SheetNames) {
    hojas[nombre] = XLSX.utils.sheet_to_json<Celda[]>(libro.Sheets[nombre], { header: 1, raw: true, defval: '' })
  }
  return hojas
}

function formatearFecha(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

/**
 * Importación de archivos del nutricionista (CSV o Excel). Smart parser: se
 * detectan solas las columnas Jugador, Fecha, Categoría, Peso, Masa
 * Adiposa %, Masa Muscular % y Sumatoria de Pliegues, incluso si el
 * encabezado real está debajo de filas de título; el profe ve lo detectado
 * y lo puede corregir con los selectores antes de importar.
 */
export function ImportAntropoPanel({ onImportado }: { onImportado: () => void }) {
  const importar = useAntropometriasStore((s) => s.importarAntropometrias)
  const showToast = useToastStore((s) => s.showToast)

  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [hojas, setHojas] = useState<Record<string, Matriz>>({})
  const [hojaActiva, setHojaActiva] = useState('')
  const [mapeo, setMapeo] = useState<MapeoColumnas | null>(null)
  // Formato "informe" del nutricionista (una hoja por categoría, ACTUAL/PREVIO): no usa el mapeo de columnas.
  const [informe, setInforme] = useState<ResultadoInforme | null>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)

  const tabla = useMemo(() => (hojaActiva && hojas[hojaActiva] ? leerTabla(hojas[hojaActiva]) : null), [hojas, hojaActiva])
  const detectado = useMemo(() => (tabla ? detectarColumnas(tabla.columnas) : null), [tabla])
  const resultado = useMemo(
    () => informe ?? (tabla && mapeo ? construirMediciones(tabla.filas, mapeo) : null),
    [informe, tabla, mapeo],
  )

  function elegirHoja(nombre: string, todas: Record<string, Matriz>) {
    setHojaActiva(nombre)
    setMapeo(detectarColumnas(leerTabla(todas[nombre]).columnas))
  }

  async function procesarArchivo(file: File) {
    setLeyendo(true)
    try {
      const esExcel = /\.(xlsx|xls)$/i.test(file.name)
      const todas = esExcel ? await leerExcel(file) : await leerCsv(file)
      const nombres = Object.keys(todas)
      if (nombres.length === 0) {
        showToast('error', 'El archivo no tiene hojas con datos.')
        return
      }
      if (esFormatoInforme(todas)) {
        const parseado = parsearInforme(todas)
        if (parseado.mediciones.length === 0) {
          showToast('error', 'Se reconoció el formato de informe, pero no se encontraron mediciones.')
          return
        }
        setNombreArchivo(file.name)
        setInforme(parseado)
        return
      }
      // Arranca en la primera hoja donde se reconozcan las columnas mínimas.
      const conDatos = nombres.find((n) => mapeoAlcanza(detectarColumnas(leerTabla(todas[n]).columnas))) ?? nombres[0]
      setNombreArchivo(file.name)
      setHojas(todas)
      elegirHoja(conDatos, todas)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo leer el archivo.'))
    } finally {
      setLeyendo(false)
    }
  }

  function limpiar() {
    setNombreArchivo(null)
    setHojas({})
    setHojaActiva('')
    setMapeo(null)
    setInforme(null)
  }

  async function handleImportar() {
    if (!resultado || !nombreArchivo || resultado.mediciones.length === 0 || subiendo) return
    setSubiendo(true)
    try {
      const { agregadas, actualizadas } = await importar(resultado.mediciones)
      showToast(
        'success',
        `¡Importadas ${agregadas + actualizadas} mediciones! (${agregadas} nuevas${actualizadas > 0 ? `, ${actualizadas} actualizadas` : ''})`,
      )
      limpiar()
      onImportado()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudieron guardar las antropometrías.'))
    } finally {
      setSubiendo(false)
    }
  }

  if (informe && resultado) {
    const jugadores = new Set(informe.mediciones.map((m) => m.jugadorKey)).size
    return (
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Confirmar importación — informe por categoría</h2>
            <p className="text-xs text-slate-400">📄 {nombreArchivo}</p>
          </div>
          <button
            type="button"
            onClick={limpiar}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-union-red-400 hover:bg-union-red-50 hover:text-union-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-union-red-500/10 dark:hover:text-union-red-400"
          >
            🗑️ Empezar de nuevo
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            ✅ {informe.mediciones.length} medición(es) · {jugadores} jugador(es) · {informe.hojas.length} categoría(s)
          </span>
          {informe.fechaPrevia && informe.fechaActual && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              📅 {formatearFecha(informe.fechaPrevia)} (previo) → {formatearFecha(informe.fechaActual)} (actual)
            </span>
          )}
          {informe.hojasOmitidas.length > 0 && <Aviso>Hojas sin datos (se omiten): {informe.hojasOmitidas.join(', ')}</Aviso>}
          {informe.resumen.sinDatos > 0 && <Aviso>{informe.resumen.sinDatos} jugador(es) sin ninguna medida (se omiten)</Aviso>}
          {informe.resumen.valoresFueraDeRango > 0 && (
            <Aviso>{informe.resumen.valoresFueraDeRango} valor(es) fuera de rango fisiológico descartados</Aviso>
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          ℹ️ El archivo no trae fechas: la medición <strong>actual</strong> se fecha al fin del mes del título y la{' '}
          <strong>previa</strong> al 31/01 del mismo año. Masa grasa y muscular vienen en kg y se convierten a % del peso
          del mismo momento.
        </p>
        <button
          type="button"
          onClick={() => void handleImportar()}
          disabled={subiendo}
          className="self-start rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {subiendo ? 'Guardando…' : `📥 Importar ${informe.mediciones.length} medición(es)`}
        </button>
      </Card>
    )
  }

  if (!tabla || !mapeo || !detectado || !resultado) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Importar antropometrías</h2>
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setArrastrando(true)
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault()
            setArrastrando(false)
            const file = e.dataTransfer.files?.[0]
            if (file) void procesarArchivo(file)
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
            arrastrando
              ? 'border-union-red-500 bg-union-red-50 dark:bg-union-red-500/10'
              : 'border-slate-300 hover:border-union-red-400 dark:border-slate-700'
          }`}
        >
          <span className="text-3xl" aria-hidden>
            📥
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {leyendo ? 'Leyendo archivo…' : 'Arrastrá el archivo del nutricionista o tocá para elegirlo'}
          </span>
          <span className="text-xs text-slate-400">Excel (.xlsx, .xls) o CSV</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void procesarArchivo(file)
              e.target.value = ''
            }}
          />
        </label>
        <p className="text-[11px] text-slate-400">
          Se reconocen solas las columnas Jugador, Fecha, Categoría/División, Peso, Masa Adiposa (%), Masa Muscular (%)
          y Sumatoria de Pliegues. Los datos se guardan en la nube, sólo visibles para el Staff con sesión.
        </p>
      </Card>
    )
  }

  const { mediciones, resumen } = resultado
  const jugadores = new Set(mediciones.map((m) => m.jugadorKey)).size
  const categorias = new Set(mediciones.map((m) => m.categoria)).size
  const fechas = mediciones.map((m) => m.fecha).sort()
  const nombresHojas = Object.keys(hojas)
  const puedeImportar = mapeoAlcanza(mapeo) && mediciones.length > 0

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Confirmar importación</h2>
          <p className="text-xs text-slate-400">📄 {nombreArchivo}</p>
        </div>
        <div className="flex items-center gap-2">
          {nombresHojas.length > 1 && (
            <select
              className={`${inputClass} max-w-[200px] py-1.5 text-xs`}
              value={hojaActiva}
              onChange={(e) => elegirHoja(e.target.value, hojas)}
              aria-label="Hoja del Excel"
            >
              {nombresHojas.map((n) => (
                <option key={n} value={n}>
                  Hoja: {n}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={limpiar}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-union-red-400 hover:bg-union-red-50 hover:text-union-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-union-red-500/10 dark:hover:text-union-red-400"
          >
            🗑️ Empezar de nuevo
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">Columnas detectadas (podés corregirlas)</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CAMPOS.map(({ campo, etiqueta, obligatorio }) => (
            <label key={campo} className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {etiqueta}
                {obligatorio && <span className="text-rose-500"> *</span>}
                {mapeo[campo] !== null && mapeo[campo] === detectado[campo] && (
                  <span className="ml-1 text-emerald-600 dark:text-emerald-400">✓ auto</span>
                )}
              </span>
              <select
                className={`${inputClass} py-1.5 text-xs`}
                value={mapeo[campo] ?? ''}
                onChange={(e) => setMapeo({ ...mapeo, [campo]: e.target.value === '' ? null : e.target.value })}
              >
                <option value="">— no usar —</option>
                {tabla.columnas.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      {!mapeoAlcanza(mapeo) ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
          ⚠️ Falta elegir la columna de Jugador, la de Fecha y al menos una medida (peso, grasa, músculo o pliegues).
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            ✅ {mediciones.length} medición(es) · {jugadores} jugador(es) · {categorias} categoría(s)
          </span>
          {fechas.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              📅 {formatearFecha(fechas[0])} → {formatearFecha(fechas[fechas.length - 1])}
            </span>
          )}
          {resumen.sinNombre > 0 && <Aviso>{resumen.sinNombre} fila(s) sin nombre (se omiten)</Aviso>}
          {resumen.sinFecha > 0 && <Aviso>{resumen.sinFecha} fila(s) con fecha no reconocible (se omiten)</Aviso>}
          {resumen.sinDatos > 0 && <Aviso>{resumen.sinDatos} fila(s) sin ninguna medida (se omiten)</Aviso>}
          {resumen.valoresFueraDeRango > 0 && (
            <Aviso>{resumen.valoresFueraDeRango} valor(es) fuera de rango fisiológico descartados</Aviso>
          )}
          {resumen.duplicadas > 0 && <Aviso>{resumen.duplicadas} fila(s) repetidas (jugador+fecha): queda la última</Aviso>}
          {resumen.escaladasDeFraccion.length > 0 && (
            <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
              ℹ️ % en formato decimal (0,15) convertido a porcentaje
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleImportar()}
        disabled={!puedeImportar || subiendo}
        className="self-start rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {subiendo ? 'Guardando…' : `📥 Importar ${mediciones.length} medición(es)`}
      </button>
    </Card>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
      ⚠️ {children}
    </span>
  )
}
