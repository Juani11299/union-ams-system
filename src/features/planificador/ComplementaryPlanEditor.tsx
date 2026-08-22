import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { inputClass } from '@/components/FormField'
import { ComplementaryPlanPdfExport } from './ComplementaryPlanPdfExport'
import type { ComplementaryPlan, ComplementaryPlanExercise } from '@/types'

const MIN_SEMANAS = 1
const MAX_SEMANAS = 12

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function ejercicioVacio(semanas: number): ComplementaryPlanExercise {
  const progressions: Record<string, string> = {}
  for (let i = 1; i <= semanas; i++) progressions[`week${i}`] = ''
  return { id: nuevoId(), exercise: '', notes: '', progressions }
}

/** Garantiza una clave `weekN` por cada semana del plan, sin borrar datos ya cargados si el profe baja y vuelve a subir el número de semanas. */
function normalizarSemanas(
  ejercicios: ComplementaryPlanExercise[],
  semanas: number,
): ComplementaryPlanExercise[] {
  return ejercicios.map((ej) => {
    const progressions = { ...ej.progressions }
    for (let i = 1; i <= semanas; i++) {
      if (progressions[`week${i}`] === undefined) progressions[`week${i}`] = ''
    }
    return { ...ej, progressions }
  })
}

const inputEditor =
  'w-full rounded border-none bg-transparent px-1.5 py-1 text-xs text-slate-700 outline-none focus:bg-union-red-50 dark:text-slate-100 dark:focus:bg-union-red-500/10'

interface ComplementaryPlanEditorProps {
  plan: ComplementaryPlan
  categoriaNombre: string
  onClose: () => void
}

/**
 * Editor de Mesociclo del Plan Complementario (Paso 3) — matriz Ejercicio ×
 * Semana, mismo patrón de edición inline que `GymSheetEditor` (estado local
 * hasta que el profe guarda a mano). A diferencia de la Planilla de
 * Gimnasio, acá el eje horizontal son SEMANAS, no series/reps/carga fijas —
 * cada celda es texto libre porque la progresión varía por ejercicio.
 */
export function ComplementaryPlanEditor({ plan, categoriaNombre, onClose }: ComplementaryPlanEditorProps) {
  const updateComplementaryPlan = useAppStore((s) => s.updateComplementaryPlan)
  const club = useAppStore((s) => s.club)
  const showToast = useToastStore((s) => s.showToast)

  const [titulo, setTitulo] = useState(plan.title)
  const [semanas, setSemanas] = useState(plan.durationWeeks)
  const [ejercicios, setEjercicios] = useState<ComplementaryPlanExercise[]>(() =>
    normalizarSemanas(plan.planData.exercises, plan.durationWeeks),
  )
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)

  function handleCambiarSemanas(valor: number) {
    if (!Number.isFinite(valor)) return
    const n = Math.max(MIN_SEMANAS, Math.min(MAX_SEMANAS, Math.round(valor)))
    setSemanas(n)
    setEjercicios((prev) => normalizarSemanas(prev, n))
  }

  function agregarEjercicio() {
    setEjercicios((prev) => [...prev, ejercicioVacio(semanas)])
  }

  function quitarEjercicio(id: string) {
    setEjercicios((prev) => prev.filter((e) => e.id !== id))
  }

  function actualizarEjercicio(id: string, cambios: Partial<Pick<ComplementaryPlanExercise, 'exercise' | 'notes'>>) {
    setEjercicios((prev) => prev.map((e) => (e.id === id ? { ...e, ...cambios } : e)))
  }

  function actualizarProgresion(id: string, semana: number, valor: string) {
    setEjercicios((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, progressions: { ...e.progressions, [`week${semana}`]: valor } } : e,
      ),
    )
  }

  async function guardar(): Promise<boolean> {
    if (!titulo.trim()) {
      showToast('error', 'El plan necesita un título.')
      return false
    }
    setGuardando(true)
    try {
      await updateComplementaryPlan(plan.id, {
        title: titulo.trim(),
        durationWeeks: semanas,
        planData: { exercises: ejercicios },
      })
      return true
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar el plan.'))
      return false
    } finally {
      setGuardando(false)
    }
  }

  async function handleGuardar() {
    if (await guardar()) showToast('success', '¡Plan guardado!')
  }

  async function handleDescargarPdf() {
    if (await guardar()) setExportando(true)
  }

  const semanasArray = Array.from({ length: semanas }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6 print:hidden">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-2xl bg-slate-900 px-4 py-3 text-white">
          <span className="text-sm font-medium">🎒 {plan.title}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : '💾 Guardar'}
            </button>
            <button
              type="button"
              onClick={handleDescargarPdf}
              disabled={guardando}
              className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-union-red-700 disabled:opacity-60"
            >
              🖨️ Descargar Tarjeta PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg px-2 py-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Título del plan</span>
              <input
                className={inputClass}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Complementario Fuerza Estructural - Mes 1"
              />
            </label>
            <label className="flex w-32 flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Semanas</span>
              <input
                type="number"
                min={MIN_SEMANAS}
                max={MAX_SEMANAS}
                className={inputClass}
                value={semanas}
                onChange={(e) => handleCambiarSemanas(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                  <th className="w-48 py-1.5 pr-2">Ejercicio</th>
                  <th className="w-40 px-2 py-1.5">Notas / Video</th>
                  {semanasArray.map((n) => (
                    <th key={n} className="w-28 px-2 py-1.5">
                      Semana {n}
                    </th>
                  ))}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {ejercicios.map((ej) => (
                  <tr key={ej.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td>
                      <input
                        className={inputEditor}
                        value={ej.exercise}
                        onChange={(e) => actualizarEjercicio(ej.id, { exercise: e.target.value })}
                        placeholder="Ej. Sentadilla"
                      />
                    </td>
                    <td>
                      <input
                        className={inputEditor}
                        value={ej.notes}
                        onChange={(e) => actualizarEjercicio(ej.id, { notes: e.target.value })}
                        placeholder="Link o técnica"
                      />
                    </td>
                    {semanasArray.map((n) => (
                      <td key={n}>
                        <input
                          className={inputEditor}
                          value={ej.progressions[`week${n}`] ?? ''}
                          onChange={(e) => actualizarProgresion(ej.id, n, e.target.value)}
                          placeholder="3x8 @ RPE 7"
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        onClick={() => quitarEjercicio(ej.id)}
                        aria-label="Quitar ejercicio"
                        className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {ejercicios.length === 0 && (
                  <tr>
                    <td colSpan={3 + semanasArray.length} className="py-6 text-center text-slate-400">
                      Sin ejercicios todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={agregarEjercicio}
            className="mt-3 rounded-lg border-2 border-dashed border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-union-red-400 hover:text-union-red-600 dark:border-slate-700 dark:hover:border-union-red-500 dark:hover:text-union-red-400"
          >
            + Agregar ejercicio
          </button>
        </div>
      </div>

      {exportando && (
        <ComplementaryPlanPdfExport
          plan={{ ...plan, title: titulo, durationWeeks: semanas, planData: { exercises: ejercicios } }}
          clubNombre={club?.nombre ?? 'C.A. Unión'}
          categoriaNombre={categoriaNombre}
          onClose={() => setExportando(false)}
        />
      )}
    </div>
  )
}
