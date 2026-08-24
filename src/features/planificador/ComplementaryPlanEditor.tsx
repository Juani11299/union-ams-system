import { useState } from 'react'
import { useAppStore, useComplementaryPlansActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { inputClass } from '@/components/FormField'
import { ComplementaryPlanPdfExport } from './ComplementaryPlanPdfExport'
import {
  generarPlanDesdeObjetivo,
  METODOS_HIPERTROFIA_OPCIONES,
  type MetodoHipertrofia,
} from './complementaryGenerator'
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

  // Resto de los planes de la misma categoría (Paso 2, "Referencia Cruzada")
  // — así el profe ve de un vistazo qué grupos musculares ya están
  // trabajados en los OTROS días antes de sumar ejercicios acá y duplicar
  // el estímulo en la semana.
  const otrosPlanes = useComplementaryPlansActivos().filter((p) => p.id !== plan.id)

  const [titulo, setTitulo] = useState(plan.title)
  const [semanas, setSemanas] = useState(plan.durationWeeks)
  const [ejercicios, setEjercicios] = useState<ComplementaryPlanExercise[]>(() =>
    normalizarSemanas(plan.planData.exercises, plan.durationWeeks),
  )
  const [guardando, setGuardando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [promptObjetivo, setPromptObjetivo] = useState('')
  const [metodo, setMetodo] = useState<MetodoHipertrofia>('tradicional')
  const [mostrarReferencias, setMostrarReferencias] = useState(true)

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

  function handleGenerarConVaritaMagica() {
    if (!promptObjetivo.trim()) return
    const nuevos = generarPlanDesdeObjetivo(promptObjetivo, semanas, metodo)
    // Append, nunca sobrescribe — el profe puede correr la varita varias
    // veces (distintos objetivos/métodos) e ir acumulando ejercicios.
    setEjercicios((prev) => [...prev, ...nuevos])
    showToast('success', `¡Agregados ${nuevos.length} ejercicio(s) (${metodo}) con progresión de ${semanas} semana(s)!`)
  }

  function handleLimpiar() {
    setEjercicios([])
    setPromptObjetivo('')
  }

  const semanasArray = Array.from({ length: semanas }, (_, i) => i + 1)

  return (
    // Fragment a propósito: `ComplementaryPlanPdfExport` (su `.print-area`)
    // tiene que vivir FUERA del div `print:hidden` de abajo. `print:hidden`
    // es `display:none` en @media print, y a diferencia de `visibility`,
    // `display:none` en un ancestro no lo puede "revertir" ningún
    // descendiente — así que si el export quedara anidado ahí adentro, el
    // PDF se imprimía en blanco aunque el `.print-area` en sí estuviera bien.
    <>
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
            {otrosPlanes.length > 0 && (
              <button
                type="button"
                onClick={() => setMostrarReferencias((v) => !v)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
              >
                {mostrarReferencias ? '👁️ Ocultar Otros Planes' : '👁️ Otros Planes (Evitar Duplicidad)'}
              </button>
            )}
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

        <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 p-4 dark:border-violet-500/30 dark:bg-violet-500/5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 dark:text-violet-400">
              🪄 Autocompletado Inteligente
            </h3>
            <p className="mt-1 text-xs text-violet-600/80 dark:text-violet-400/70">
              Ejercicios de Hipertrofia y Vitamina con progresión de volumen automática — nunca fuerza máxima ni
              potencia neural.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <textarea
                value={promptObjetivo}
                onChange={(e) => setPromptObjetivo(e.target.value)}
                rows={2}
                placeholder="¿Qué querés lograr con este plan? (Ej: Empuje tren superior y zona media)"
                className="w-full flex-1 resize-none rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-violet-500/30 dark:bg-slate-800 dark:text-slate-100"
              />
              <label className="flex w-full flex-col gap-1 text-xs sm:w-44">
                <span className="font-medium text-violet-700 dark:text-violet-400">Método de Hipertrofia</span>
                <select
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value as MetodoHipertrofia)}
                  className="h-full rounded-lg border border-violet-200 bg-white px-2 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-violet-500/30 dark:bg-slate-800 dark:text-slate-100"
                >
                  {METODOS_HIPERTROFIA_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerarConVaritaMagica}
                disabled={!promptObjetivo.trim()}
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✨ Generar Planilla
              </button>
              <button
                type="button"
                onClick={handleLimpiar}
                disabled={ejercicios.length === 0 && !promptObjetivo.trim()}
                className="rounded-lg border border-violet-300 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

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

        {mostrarReferencias && otrosPlanes.length > 0 && (
          <aside className="w-64 shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              👁️ Otros Planes (Evitar Duplicidad)
            </h4>
            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              {categoriaNombre} — ejercicios ya cargados en los demás planes.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {otrosPlanes.map((p) => {
                const nombresEjercicios = p.planData.exercises
                  .map((e) => e.exercise.trim())
                  .filter(Boolean)
                return (
                  <div
                    key={p.id}
                    className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{p.title}</p>
                    {nombresEjercicios.length === 0 ? (
                      <p className="mt-1 text-[11px] text-slate-400">Sin ejercicios cargados.</p>
                    ) : (
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {nombresEjercicios.map((nombre, i) => (
                          <li key={i} className="text-[11px] text-slate-500 dark:text-slate-400">
                            {nombre}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        )}
      </div>
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
    </>
  )
}
