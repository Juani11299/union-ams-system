import { useMemo, useState } from 'react'
import { leerTabla } from '@/features/antropometrias/parser'
import { Card } from '@/components/Card'
import { inputClass } from '@/components/FormField'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { leerArchivoTabular } from '../leerArchivo'
import { PantallaCompleta } from '../PantallaCompleta'
import { auditar, aCsv, celdaATexto } from './auditoria'
import type { FilaGrid } from './auditoria'
import { DataGrid } from './DataGrid'

interface Snapshot {
  filas: FilaGrid[]
  etiqueta: string
}

type Filtro = 'todas' | 'sospechosas' | 'rojas'

/**
 * Data Wrangler — estación de limpieza de datos previa a subir un test: se carga
 * un CSV/Excel de cualquier test, se audita (nulos y ceros en amarillo, outliers
 * ±3 DE en rojo), se eliminan las filas basura (intentos fallidos), se corrigen
 * celdas con errores de tipeo y se descarga un CSV limpio listo para subir al
 * test correspondiente (Datos & Calidad → Añadir Nueva Sesión de Evaluación).
 * Todo ocurre en el navegador: no toca Supabase.
 */
export function DataWrangler({ onBack }: { onBack: () => void }) {
  const showToast = useToastStore((s) => s.showToast)
  const [archivo, setArchivo] = useState<string | null>(null)
  const [columnas, setColumnas] = useState<string[]>([])
  const [filas, setFilas] = useState<FilaGrid[]>([])
  const [historial, setHistorial] = useState<Snapshot[]>([])
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
  const [sigma, setSigma] = useState(3)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [leyendo, setLeyendo] = useState(false)
  const [original, setOriginal] = useState(0)
  const [ediciones, setEdiciones] = useState(0)

  const auditoria = useMemo(() => auditar(columnas, filas, sigma), [columnas, filas, sigma])
  const filasVista = useMemo(
    () => filas.filter((f) => (filtro === 'todas' ? true : filtro === 'rojas' ? auditoria.filasRojo.has(f.id) : auditoria.filasRojo.has(f.id) || auditoria.filasAmarillo.has(f.id))),
    [filas, filtro, auditoria],
  )

  function guardarHistorial(etiqueta: string) {
    setHistorial((h) => [...h.slice(-19), { filas, etiqueta }])
  }

  async function cargar(file: File) {
    setLeyendo(true)
    try {
      const tabla = leerTabla(await leerArchivoTabular(file))
      if (tabla.columnas.length === 0 || tabla.filas.length === 0) {
        showToast('error', 'El archivo no tiene filas con datos.')
        return
      }
      setColumnas(tabla.columnas)
      setFilas(tabla.filas.map((f, id) => ({ id, celdas: Object.fromEntries(tabla.columnas.map((c) => [c, celdaATexto(f[c], c)])) })))
      setArchivo(file.name)
      setOriginal(tabla.filas.length)
      setHistorial([])
      setSeleccion(new Set())
      setEdiciones(0)
      setFiltro('todas')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo leer el archivo.'))
    } finally {
      setLeyendo(false)
    }
  }

  function eliminarSeleccion() {
    if (seleccion.size === 0) return
    guardarHistorial(`Eliminar ${seleccion.size} fila(s)`)
    setFilas((fs) => fs.filter((f) => !seleccion.has(f.id)))
    showToast('success', `${seleccion.size} fila(s) eliminadas.`)
    setSeleccion(new Set())
  }

  function editar(filaId: number, col: string, valor: string) {
    const actual = filas.find((f) => f.id === filaId)?.celdas[col] ?? ''
    if (valor === actual) return
    guardarHistorial(`Editar celda (fila ${filaId + 1}, ${col})`)
    setFilas((fs) => fs.map((f) => (f.id === filaId ? { ...f, celdas: { ...f.celdas, [col]: valor } } : f)))
    setEdiciones((n) => n + 1)
  }

  function deshacer() {
    const ultimo = historial[historial.length - 1]
    if (!ultimo) return
    setFilas(ultimo.filas)
    setHistorial((h) => h.slice(0, -1))
    setSeleccion(new Set())
    showToast('success', `Deshecho: ${ultimo.etiqueta}.`)
  }

  function seleccionar(que: 'rojas' | 'todas-sospechosas') {
    const ids = filas.filter((f) => auditoria.filasRojo.has(f.id) || (que === 'todas-sospechosas' && auditoria.filasAmarillo.has(f.id))).map((f) => f.id)
    setSeleccion(new Set(ids))
  }

  function descargar() {
    if (!archivo) return
    const blob = new Blob([aCsv(columnas, filas)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${archivo.replace(/\.[^.]+$/, '')}_limpio.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    showToast('success', `CSV limpio descargado: ${filas.length} filas.`)
  }

  const eliminadas = original - filas.length

  return (
    <PantallaCompleta titulo="🧹 Limpieza de Datos (Data Wrangler)" subtitulo="Auditá, depurá y descargá un CSV limpio antes de subirlo a su test" onBack={onBack}>
      <div className="flex flex-col gap-4">
        {!archivo ? (
          <Card className="mx-auto flex w-full max-w-2xl flex-col gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Subí el Excel/CSV de cualquier test</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Se muestra en una tabla interactiva donde se resaltan las celdas sospechosas: <b className="text-amber-600">amarillo</b> para valores nulos o ceros absolutos y <b className="text-rose-600">rojo</b> para valores a más de ±3 desviaciones estándar de la media de su columna. Después podés eliminar filas basura, corregir errores de tipeo y descargar el CSV limpio.
            </p>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-12 text-center hover:border-union-red-400 dark:border-slate-700">
              <span className="text-3xl" aria-hidden>
                🧹
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{leyendo ? 'Leyendo archivo…' : 'Tocá para elegir el archivo o arrastralo acá'}</span>
              <span className="text-xs text-slate-400">CSV o Excel (.xlsx, .xls) · todo se procesa en tu navegador</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void cargar(f)
                  e.target.value = ''
                }}
              />
            </label>
          </Card>
        ) : (
          <>
            <Card className="flex flex-wrap items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">📄 {archivo}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filas.length} de {original} fila(s) · {columnas.length} columna(s){eliminadas > 0 ? ` · ${eliminadas} eliminada(s)` : ''}{ediciones > 0 ? ` · ${ediciones} edición(es)` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">🔴 {auditoria.totalRojo} celda(s) rojas · {auditoria.filasRojo.size} fila(s)</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100">🟡 {auditoria.totalAmarillo} celda(s) amarillas</span>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  Outlier ±
                  <input type="number" min={1} max={6} step={0.5} className={`${inputClass} w-16 py-1 text-xs`} value={sigma} onChange={(e) => setSigma(Math.max(1, Number(e.target.value) || 3))} />
                  DE
                </label>
                <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-union-red-400 dark:border-slate-700 dark:text-slate-300">
                  Cambiar archivo
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void cargar(f)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            </Card>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-lg border border-slate-300 text-xs font-semibold dark:border-slate-700">
                {([['todas', 'Todas'], ['sospechosas', 'Sospechosas'], ['rojas', 'Sólo rojas']] as Array<[Filtro, string]>).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setFiltro(id)} className={`px-3 py-1.5 ${filtro === id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => seleccionar('rojas')} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10">
                Seleccionar filas rojas ({auditoria.filasRojo.size})
              </button>
              <button type="button" onClick={() => seleccionar('todas-sospechosas')} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-200 dark:hover:bg-amber-500/10">
                Seleccionar todas las sospechosas ({auditoria.filasRojo.size + auditoria.filasAmarillo.size})
              </button>
              <button type="button" onClick={() => setSeleccion(new Set())} disabled={seleccion.size === 0} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
                Limpiar selección
              </button>
              <button type="button" onClick={eliminarSeleccion} disabled={seleccion.size === 0} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
                🗑️ Eliminar seleccionadas ({seleccion.size})
              </button>
              <button type="button" onClick={deshacer} disabled={historial.length === 0} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
                ↶ Deshacer{historial.length > 0 ? ` (${historial.length})` : ''}
              </button>
              <button type="button" onClick={descargar} disabled={filas.length === 0} className="ml-auto rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-union-red-700 disabled:opacity-50">
                ⬇️ Descargar CSV Limpio
              </button>
            </div>

            <DataGrid key={`${archivo}-${filtro}`} columnas={auditoria.columnas} filas={filasVista} auditoria={auditoria} seleccion={seleccion} onSeleccion={setSeleccion} onEditar={editar} />

            <p className="text-[11px] text-slate-400">
              Reglas: 🟡 celda vacía o cero absoluto en una columna numérica · 🔴 valor a más de ±{sigma} DE de la media de su columna (mínimo 8 datos), texto en una columna numérica o fila sin nombre de jugador. Las columnas de fecha, identificadores y categoría no se auditan como números. Después de descargar, subí el CSV limpio al test correspondiente desde su pestaña Datos & Calidad.
            </p>
          </>
        )}
      </div>
    </PantallaCompleta>
  )
}
