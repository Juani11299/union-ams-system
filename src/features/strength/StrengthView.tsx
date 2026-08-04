import { useState } from 'react'
import { useAppStore, useStrengthBlocksActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { COLUMNAS_FUERZA, type ColumnaFuerza, type BloqueFuerza } from '@/types'
import { Field, inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'

const COLUMNA_ESTILO: Record<ColumnaFuerza, string> = {
  Activación: 'border-t-sky-400',
  'Fuerza Máxima': 'border-t-rose-400',
  Potencia: 'border-t-amber-400',
  Accesorios: 'border-t-emerald-400',
}

interface BloqueCardProps {
  bloque: BloqueFuerza
  onDelete: () => void
}

function BloqueCard({ bloque, onDelete }: BloqueCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', bloque.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{bloque.titulo}</p>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Eliminar bloque"
          className="shrink-0 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
        >
          ✕
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {bloque.seriesReps}
        </span>
        {bloque.cargaPct && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            {bloque.cargaPct}
          </span>
        )}
      </div>
      {bloque.notas && <p className="mt-2 text-xs text-slate-400">{bloque.notas}</p>}
    </div>
  )
}

interface NuevoBloqueFormProps {
  columna: ColumnaFuerza
  onClose: () => void
}

function NuevoBloqueForm({ columna, onClose }: NuevoBloqueFormProps) {
  const createStrengthBlock = useAppStore((s) => s.createStrengthBlock)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const [titulo, setTitulo] = useState('')
  const [seriesReps, setSeriesReps] = useState('')
  const [cargaPct, setCargaPct] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !seriesReps.trim()) {
      setError('Completá al menos el ejercicio y series x reps.')
      return
    }
    if (!activeSeasonId || !activeCategoryId || guardando) return
    setError(null)
    setGuardando(true)
    try {
      await createStrengthBlock({
        seasonId: activeSeasonId,
        categoryId: activeCategoryId,
        columna,
        titulo: titulo.trim(),
        seriesReps: seriesReps.trim(),
        cargaPct: cargaPct.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el bloque.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border-2 border-dashed border-slate-300 p-3 dark:border-slate-600">
      <Field label="Ejercicio" error={error ?? undefined}>
        <input
          className={inputClass}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Sentadilla trasera"
          autoFocus
        />
      </Field>
      <Field label="Series x reps">
        <input
          className={inputClass}
          value={seriesReps}
          onChange={(e) => setSeriesReps(e.target.value)}
          placeholder="Ej. 4x6"
        />
      </Field>
      <Field label="Carga (opcional)">
        <input
          className={inputClass}
          value={cargaPct}
          onChange={(e) => setCargaPct(e.target.value)}
          placeholder="Ej. 80% 1RM"
        />
      </Field>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Agregar'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function StrengthView() {
  const bloques = useStrengthBlocksActivos()
  const moveStrengthBlock = useAppStore((s) => s.moveStrengthBlock)
  const deleteStrengthBlock = useAppStore((s) => s.deleteStrengthBlock)
  const showToast = useToastStore((s) => s.showToast)
  const [columnaAgregando, setColumnaAgregando] = useState<ColumnaFuerza | null>(null)
  const [columnaSobrevolada, setColumnaSobrevolada] = useState<ColumnaFuerza | null>(null)

  async function handleDrop(e: React.DragEvent, columna: ColumnaFuerza) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    setColumnaSobrevolada(null)
    if (!id) return
    try {
      await moveStrengthBlock(id, columna)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo mover el bloque.'))
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteStrengthBlock(id)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar el bloque.'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Planificación de Fuerza
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Arrastrá los bloques entre columnas para armar la sesión de gimnasio.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
        <div className="grid w-max grid-flow-col auto-cols-[260px] gap-4 md:w-full md:grid-flow-row md:auto-cols-auto md:grid-cols-4">
          {COLUMNAS_FUERZA.map((columna) => {
            const bloquesDeColumna = bloques.filter((b) => b.columna === columna)
            const sobrevolada = columnaSobrevolada === columna

            return (
              <div
                key={columna}
                onDragOver={(e) => {
                  e.preventDefault()
                  setColumnaSobrevolada(columna)
                }}
                onDragLeave={() => setColumnaSobrevolada((c) => (c === columna ? null : c))}
                onDrop={(e) => handleDrop(e, columna)}
                className={`flex flex-col gap-3 rounded-2xl border-t-4 bg-slate-50 p-3 transition-colors dark:bg-slate-900/40 ${
                  COLUMNA_ESTILO[columna]
                } ${sobrevolada ? 'ring-2 ring-union-red-400/60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{columna}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-400 dark:bg-slate-800">
                    {bloquesDeColumna.length}
                  </span>
                </div>

                <div className="flex min-h-[80px] flex-col gap-2">
                  {bloquesDeColumna.map((bloque) => (
                    <BloqueCard key={bloque.id} bloque={bloque} onDelete={() => handleDelete(bloque.id)} />
                  ))}
                </div>

                {columnaAgregando === columna ? (
                  <NuevoBloqueForm columna={columna} onClose={() => setColumnaAgregando(null)} />
                ) : (
                  <button
                    type="button"
                    onClick={() => setColumnaAgregando(columna)}
                    className="rounded-xl border-2 border-dashed border-slate-200 py-2 text-xs font-medium text-slate-400 hover:border-union-red-400 hover:text-union-red-600 dark:border-slate-700 dark:hover:border-union-red-500 dark:hover:text-union-red-400"
                  >
                    + Agregar bloque
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
