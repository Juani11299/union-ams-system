import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { inputClass } from '@/components/FormField'
import { Tabs, type TabItem } from '@/components/Tabs'
import { useToastStore } from '@/store/useToastStore'
import { useAntropometriasStore } from '@/stores/useAntropometriasStore'
import { categoriasDisponibles } from './calculations'
import { GrupalAntropoTab } from './GrupalAntropoTab'
import { ImportAntropoPanel } from './ImportAntropoPanel'
import { IndividualAntropoTab } from './IndividualAntropoTab'

const TABS: TabItem[] = [
  { id: 'grupal', label: 'Análisis Grupal', icon: '👥' },
  { id: 'individual', label: 'Análisis Individual', icon: '🕵️' },
]

/**
 * Módulo de Antropometrías (Fase 43) — composición corporal a lo largo del
 * año a partir del archivo del nutricionista (Excel o CSV). Panel 100%
 * independiente del resto de la app, mismo criterio que Evaluaciones de
 * Rendimiento: no lee `athletes` ni las categorías reales del club — los
 * jugadores y el filtro "AGRUPAR POR" salen exclusivamente de las columnas
 * Jugador y Categoría/División del archivo importado. Los datos se guardan
 * sólo en el navegador (IndexedDB, `useAntropometriasStore`).
 */
export function AntropometriasView() {
  const mediciones = useAntropometriasStore((s) => s.mediciones)
  const archivos = useAntropometriasStore((s) => s.archivos)
  const limpiarTodo = useAntropometriasStore((s) => s.limpiarTodo)
  const showToast = useToastStore((s) => s.showToast)

  // El store persiste en IndexedDB (asíncrono): hasta que termina de leer, no se
  // muestra el estado vacío — si no, al abrir la pantalla parpadea "sin datos".
  const [hidratado, setHidratado] = useState(() => useAntropometriasStore.persist.hasHydrated())
  useEffect(() => {
    const desuscribir = useAntropometriasStore.persist.onFinishHydration(() => setHidratado(true))
    if (useAntropometriasStore.persist.hasHydrated()) setHidratado(true)
    return desuscribir
  }, [])

  const [tabActiva, setTabActiva] = useState('grupal')
  const [categoria, setCategoria] = useState('')
  const [mostrarImport, setMostrarImport] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)

  const categorias = useMemo(() => categoriasDisponibles(mediciones), [mediciones])
  // Si la categoría elegida deja de existir (se borraron los datos) cae a "Todas".
  const categoriaActiva = categorias.includes(categoria) ? categoria : ''
  const filtradas = useMemo(
    () => (categoriaActiva ? mediciones.filter((m) => m.categoria === categoriaActiva) : mediciones),
    [mediciones, categoriaActiva],
  )

  if (!hidratado) {
    return <p className="py-12 text-center text-sm text-slate-400">Cargando antropometrías…</p>
  }

  const sinDatos = mediciones.length === 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Antropometrías</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Evolución de la composición corporal del plantel a partir del archivo del nutricionista.
        </p>
      </div>

      {(sinDatos || mostrarImport) && <ImportAntropoPanel onImportado={() => setMostrarImport(false)} />}

      {!sinDatos && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">AGRUPAR POR (Categoría)</span>
              <select
                className={`${inputClass} min-w-[200px]`}
                value={categoriaActiva}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setMostrarImport((v) => !v)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-union-red-400 hover:bg-union-red-50 hover:text-union-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-union-red-500/10 dark:hover:text-union-red-400"
            >
              {mostrarImport ? '✕ Cerrar importación' : '＋ Importar más datos'}
            </button>
          </div>

          <Tabs tabs={TABS} activeId={tabActiva} onChange={setTabActiva} />
          {tabActiva === 'grupal' && <GrupalAntropoTab mediciones={filtradas} />}
          {tabActiva === 'individual' && <IndividualAntropoTab enGrupo={filtradas} todas={mediciones} />}

          <Card className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
            <p>
              🔒 {mediciones.length} medición(es) guardadas <strong>sólo en este navegador</strong> (no se suben a la base
              del club). Importar de nuevo el mismo archivo actualiza las mediciones existentes sin duplicarlas.
            </p>
            {archivos.length > 0 && (
              <p>
                Últimas importaciones:{' '}
                {archivos
                  .slice(0, 3)
                  .map((a) => `${a.nombre} (${new Date(a.importadoEn).toLocaleDateString('es-AR')})`)
                  .join(' · ')}
              </p>
            )}
            <button
              type="button"
              onClick={() => setConfirmandoBorrado(true)}
              className="self-start font-medium text-union-red-600 hover:underline dark:text-union-red-400"
            >
              🗑️ Borrar todos los datos de antropometría
            </button>
          </Card>
        </>
      )}

      {confirmandoBorrado && (
        <ConfirmDialog
          titulo="Borrar antropometrías"
          mensaje="Se borran TODAS las mediciones importadas de este navegador. Tenés que volver a importar el archivo para recuperarlas. ¿Seguro?"
          confirmando={false}
          onConfirm={() => {
            limpiarTodo()
            setConfirmandoBorrado(false)
            showToast('success', 'Datos de antropometría borrados.')
          }}
          onCancel={() => setConfirmandoBorrado(false)}
        />
      )}
    </div>
  )
}
