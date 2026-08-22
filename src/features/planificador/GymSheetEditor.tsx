import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { formatFechaCorta } from '@/utils/fecha'
import { NOMBRE_AREA, FIRMA_AUTOR } from '@/constants/branding'
import { AiPlanModal } from './AiPlanModal'
import { MesocycleProgressionModal } from './MesocycleProgressionModal'
import { WaveMethodologyModal } from './WaveMethodologyModal'
import type { SessionPlan, GymSheetData, GymSheetBloque } from '@/types'

function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function bloqueVacio(titulo: string): GymSheetBloque {
  return { id: nuevoId(), titulo, ejercicios: [] }
}

function ejercicioVacio() {
  return {
    id: nuevoId(),
    nombre: '',
    series: '',
    repeticiones: '',
    cargaKg: '',
    descanso: '',
    notas: '',
    isTracked: false,
  }
}

function sheetInicial(plan: SessionPlan): GymSheetData {
  if (plan.gymSheetData) return plan.gymSheetData
  return {
    titulo: plan.titulo,
    objetivos: '',
    bloques: [bloqueVacio('Activación'), bloqueVacio('Bloque Principal'), bloqueVacio('Accesorios')],
  }
}

const inputPlanilla =
  'w-full rounded border-none bg-transparent px-1 py-1 text-slate-700 outline-none focus:bg-union-red-50 dark:text-slate-800 print:focus:bg-transparent'

interface GymSheetEditorProps {
  plan: SessionPlan
  onClose: () => void
}

/**
 * Editor de Planilla Estética de Gimnasio (Fase 16) — simula una hoja A4
 * impresa (estilo europeo) editable inline, con copiar/pegar entre sesiones y
 * exportación a PDF vía `window.print()` (sin librerías nuevas: el trick de
 * imprimir sólo `.print-area` vive en `src/index.css`).
 */
export function GymSheetEditor({ plan, onClose }: GymSheetEditorProps) {
  const updateSessionPlanGymSheet = useAppStore((s) => s.updateSessionPlanGymSheet)
  const categories = useAppStore((s) => s.categories)
  const club = useAppStore((s) => s.club)
  const showToast = useToastStore((s) => s.showToast)

  const [sheet, setSheet] = useState<GymSheetData>(() => sheetInicial(plan))
  const [guardando, setGuardando] = useState(false)
  const [mostrarModalIA, setMostrarModalIA] = useState(false)
  const [mostrarMesociclo, setMostrarMesociclo] = useState(false)
  const [mostrarOlas, setMostrarOlas] = useState(false)

  const categoria = categories.find((c) => c.id === plan.category_id)

  function actualizarBloque(bloqueId: string, cambios: Partial<GymSheetBloque>) {
    setSheet((s) => ({
      ...s,
      bloques: s.bloques.map((b) => (b.id === bloqueId ? { ...b, ...cambios } : b)),
    }))
  }

  function agregarBloque() {
    setSheet((s) => ({ ...s, bloques: [...s.bloques, bloqueVacio('Nuevo bloque')] }))
  }

  function quitarBloque(bloqueId: string) {
    setSheet((s) => ({ ...s, bloques: s.bloques.filter((b) => b.id !== bloqueId) }))
  }

  function agregarEjercicio(bloqueId: string) {
    setSheet((s) => ({
      ...s,
      bloques: s.bloques.map((b) =>
        b.id === bloqueId ? { ...b, ejercicios: [...b.ejercicios, ejercicioVacio()] } : b,
      ),
    }))
  }

  /**
   * Marca cuál es el ejercicio troncal a medir en la Terminal de Fuerza
   * (Fase 17) — sólo puede haber uno `isTracked` en TODA la planilla (no por
   * bloque), así la Terminal no tiene ambigüedad sobre qué pedirle al
   * jugador. Tocar el 🎯 del que ya está marcado lo desmarca.
   */
  function marcarTrackeado(bloqueId: string, ejercicioId: string) {
    setSheet((s) => ({
      ...s,
      bloques: s.bloques.map((b) => ({
        ...b,
        ejercicios: b.ejercicios.map((e) => ({
          ...e,
          isTracked: b.id === bloqueId && e.id === ejercicioId ? !e.isTracked : false,
        })),
      })),
    }))
  }

  function quitarEjercicio(bloqueId: string, ejercicioId: string) {
    setSheet((s) => ({
      ...s,
      bloques: s.bloques.map((b) =>
        b.id === bloqueId ? { ...b, ejercicios: b.ejercicios.filter((e) => e.id !== ejercicioId) } : b,
      ),
    }))
  }

  function actualizarEjercicio(
    bloqueId: string,
    ejercicioId: string,
    campo: 'nombre' | 'series' | 'repeticiones' | 'cargaKg' | 'descanso' | 'notas',
    valor: string,
  ) {
    setSheet((s) => ({
      ...s,
      bloques: s.bloques.map((b) =>
        b.id === bloqueId
          ? {
              ...b,
              ejercicios: b.ejercicios.map((e) => (e.id === ejercicioId ? { ...e, [campo]: valor } : e)),
            }
          : b,
      ),
    }))
  }

  async function guardar(): Promise<boolean> {
    setGuardando(true)
    try {
      await updateSessionPlanGymSheet(plan.id, sheet)
      return true
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar la planilla.'))
      return false
    } finally {
      setGuardando(false)
    }
  }

  async function handleGuardar() {
    if (await guardar()) showToast('success', '¡Planilla guardada!')
  }

  async function handleDescargarPdf() {
    await guardar()
    window.print()
  }

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(sheet))
      showToast('success', 'Planilla copiada al portapapeles.')
    } catch {
      showToast('error', 'No se pudo copiar la planilla (el navegador bloqueó el portapapeles).')
    }
  }

  async function handlePegar() {
    try {
      const texto = await navigator.clipboard.readText()
      const parsed = JSON.parse(texto)
      if (!parsed || !Array.isArray(parsed.bloques)) {
        showToast('error', 'El portapapeles no tiene una planilla válida.')
        return
      }
      setSheet(parsed as GymSheetData)
      showToast('success', 'Planilla pegada — revisá y guardá los cambios.')
    } catch {
      showToast('error', 'No se pudo pegar: el portapapeles no tiene una planilla copiada desde acá.')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 print:static print:overflow-visible print:bg-white">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-3 p-4 print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-white print:hidden">
          <span className="text-sm font-medium">📄 Planilla — {plan.titulo}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopiar}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
            >
              📋 Copiar Planilla
            </button>
            <button
              type="button"
              onClick={handlePegar}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
            >
              📥 Pegar Planilla
            </button>
            <button
              type="button"
              onClick={() => setMostrarMesociclo(true)}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold hover:bg-sky-700"
              title="Clona esta sesión hacia las próximas semanas con sobrecarga progresiva y descarga automáticas"
            >
              🔁 Generar Mesociclo
            </button>
            <button
              type="button"
              onClick={() => setMostrarOlas(true)}
              className="rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold hover:from-teal-600 hover:to-emerald-700"
              title="Genera una sesión de 3 bloques (Fuerza Velocidad, Fuerza Máxima, Auxiliares) según el vector de movimiento"
            >
              🪄 Generar Sesión por Vectores
            </button>
            <button
              type="button"
              onClick={() => setMostrarModalIA(true)}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-semibold hover:from-indigo-600 hover:to-violet-700"
            >
              🪄 Generar con IA
            </button>
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
              🖨️ Descargar PDF
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

        <div
          id="gym-sheet-print-area"
          className="print-area mx-auto w-full max-w-[794px] rounded-lg bg-white p-8 shadow-2xl print:m-0 print:w-full print:max-w-none print:rounded-none print:p-0 print:shadow-none"
        >
          <div className="flex items-start justify-between gap-4 border-b-4 border-union-red-600 pb-4">
            <div className="flex items-center gap-3">
              <img src="/logo-union.png" alt="" className="h-14 w-14 shrink-0 object-contain" />
              <div className="min-w-0">
                <input
                  value={sheet.titulo}
                  onChange={(e) => setSheet((s) => ({ ...s, titulo: e.target.value }))}
                  placeholder="Título de la planilla"
                  className="w-full border-none bg-transparent text-xl font-bold text-union-charcoal outline-none placeholder:text-slate-300 focus:bg-union-red-50 print:focus:bg-transparent"
                />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Planificación de Fuerza — {club?.nombre ?? 'C.A. Unión'}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right text-xs text-slate-500">
              <p className="font-semibold text-union-charcoal">{categoria?.nombre ?? '—'}</p>
              <p className="capitalize">{formatFechaCorta(plan.fecha)}</p>
              <p>{plan.matchDay}</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Objetivos de la sesión
            </label>
            <textarea
              value={sheet.objetivos}
              onChange={(e) => setSheet((s) => ({ ...s, objetivos: e.target.value }))}
              rows={2}
              placeholder="Ej: Fuerza máxima tren inferior + prevención isquiotibiales"
              className="w-full resize-none border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:bg-union-red-50 print:focus:bg-transparent"
            />
          </div>

          {sheet.bloques.map((bloque) => (
            <div key={bloque.id} className="mt-6 break-inside-avoid">
              <div className="flex items-center justify-between gap-2 bg-union-charcoal px-2 py-1.5">
                <input
                  value={bloque.titulo}
                  onChange={(e) => actualizarBloque(bloque.id, { titulo: e.target.value })}
                  className="w-full border-none bg-transparent text-sm font-bold uppercase tracking-wide text-white outline-none focus:bg-white/10"
                />
                <button
                  type="button"
                  onClick={() => quitarBloque(bloque.id)}
                  className="shrink-0 text-xs font-medium text-white/60 hover:text-white print:hidden"
                >
                  ✕ Quitar bloque
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="py-1.5 pr-2">Ejercicio</th>
                      <th className="w-14 px-2 py-1.5">Series</th>
                      <th className="w-16 px-2 py-1.5">Reps</th>
                      <th className="w-20 px-2 py-1.5">Carga (Kg)</th>
                      <th className="w-20 px-2 py-1.5">Descanso</th>
                      <th className="w-32 py-1.5 pl-2">Notas / RIR-RPE</th>
                      <th className="w-6 print:hidden" title="Ejercicio a medir en la Terminal de Fuerza" />
                      <th className="w-6 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {bloque.ejercicios.map((ej) => (
                      <tr key={ej.id} className="border-b border-slate-100">
                        <td>
                          <div className="flex items-center gap-1">
                            {ej.isTracked && (
                              <span
                                className="shrink-0 text-xs"
                                title="Ejercicio trackeado en la Terminal de Fuerza"
                                aria-hidden
                              >
                                🎯
                              </span>
                            )}
                            <input
                              value={ej.nombre}
                              onChange={(e) => actualizarEjercicio(bloque.id, ej.id, 'nombre', e.target.value)}
                              placeholder="Ej. Sentadilla trasera"
                              className={`${inputPlanilla} placeholder:text-slate-300`}
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            value={ej.series}
                            onChange={(e) => actualizarEjercicio(bloque.id, ej.id, 'series', e.target.value)}
                            placeholder="4"
                            className={`${inputPlanilla} placeholder:text-slate-300`}
                          />
                        </td>
                        <td>
                          <input
                            value={ej.repeticiones}
                            onChange={(e) =>
                              actualizarEjercicio(bloque.id, ej.id, 'repeticiones', e.target.value)
                            }
                            placeholder="6"
                            className={`${inputPlanilla} placeholder:text-slate-300`}
                          />
                        </td>
                        <td>
                          <input
                            value={ej.cargaKg}
                            onChange={(e) => actualizarEjercicio(bloque.id, ej.id, 'cargaKg', e.target.value)}
                            placeholder="70%"
                            className={`${inputPlanilla} placeholder:text-slate-300`}
                          />
                        </td>
                        <td>
                          <input
                            value={ej.descanso}
                            onChange={(e) => actualizarEjercicio(bloque.id, ej.id, 'descanso', e.target.value)}
                            placeholder="90s"
                            className={`${inputPlanilla} placeholder:text-slate-300`}
                          />
                        </td>
                        <td>
                          <input
                            value={ej.notas}
                            onChange={(e) => actualizarEjercicio(bloque.id, ej.id, 'notas', e.target.value)}
                            placeholder="RIR 2"
                            className={`${inputPlanilla} placeholder:text-slate-300`}
                          />
                        </td>
                        <td className="print:hidden">
                          <button
                            type="button"
                            onClick={() => marcarTrackeado(bloque.id, ej.id)}
                            aria-label={
                              ej.isTracked
                                ? 'Ejercicio trackeado en la Terminal de Fuerza — tocar para desmarcar'
                                : 'Marcar como ejercicio a trackear en la Terminal de Fuerza'
                            }
                            title="Ejercicio a medir en la Terminal de Fuerza"
                            className={`px-1 text-sm ${
                              ej.isTracked ? 'text-union-red-600' : 'text-slate-300 hover:text-union-red-500'
                            }`}
                          >
                            🎯
                          </button>
                        </td>
                        <td className="print:hidden">
                          <button
                            type="button"
                            onClick={() => quitarEjercicio(bloque.id, ej.id)}
                            aria-label="Quitar ejercicio"
                            className="px-1 text-slate-300 hover:text-rose-500"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => agregarEjercicio(bloque.id)}
                className="mt-1 text-[11px] font-medium text-union-red-600 hover:underline print:hidden"
              >
                + Agregar ejercicio
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={agregarBloque}
            className="mt-6 w-full rounded-lg border-2 border-dashed border-slate-200 py-2 text-xs font-medium text-slate-400 hover:border-union-red-400 hover:text-union-red-600 print:hidden"
          >
            + Agregar Bloque
          </button>

          <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-3">
            <p className="text-[10px] text-slate-400">
              {club?.nombre ?? 'C.A. Unión'} — {NOMBRE_AREA}.
            </p>
            <p className="text-[10px] font-semibold tracking-wide text-union-charcoal">{FIRMA_AUTOR}</p>
          </div>
        </div>
      </div>

      {mostrarModalIA && (
        <AiPlanModal
          categoryId={plan.category_id}
          categoriaNombre={categoria?.nombre ?? 'Sin categoría'}
          onGenerado={(data) => setSheet(data)}
          onClose={() => setMostrarModalIA(false)}
        />
      )}

      {mostrarMesociclo && (
        <MesocycleProgressionModal
          plan={plan}
          gymSheetBase={sheet}
          onClose={() => setMostrarMesociclo(false)}
          onGenerado={() => setMostrarMesociclo(false)}
        />
      )}

      {mostrarOlas && (
        <WaveMethodologyModal
          tituloSesion={sheet.titulo}
          tieneContenidoPrevio={sheet.bloques.some((b) => b.ejercicios.some((e) => e.nombre.trim() !== ''))}
          onGenerado={(data) => {
            setSheet(data)
            setMostrarOlas(false)
            showToast('success', '¡Sesión generada por vectores! Revisá y ajustá cargas antes de guardar.')
          }}
          onClose={() => setMostrarOlas(false)}
        />
      )}
    </div>
  )
}
