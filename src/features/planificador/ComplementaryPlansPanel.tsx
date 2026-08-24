import { useState } from 'react'
import { useAppStore, useComplementaryPlansActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getErrorMessage } from '@/utils/errors'
import { ComplementaryPlanEditor } from './ComplementaryPlanEditor'
import { ClonePlanModal } from './ClonePlanModal'
import { BulkComplementaryPdfExport } from './BulkComplementaryPdfExport'
import type { ComplementaryPlan } from '@/types'

interface ComplementaryPlansPanelProps {
  categoryId: string
  categoriaNombre: string
  onClose: () => void
}

/**
 * Panel "Planes Extra-Club (Complementarios)" (Paso 2) — biblioteca de
 * mesociclos de fuerza para gimnasios externos al club, scopeada por
 * categoría (mismo criterio reusable que `TemplateLibraryPanel`, ver
 * `useComplementaryPlansActivos`). Crear abre directo el editor del plan
 * recién creado, para no obligar a un segundo clic.
 */
export function ComplementaryPlansPanel({ categoryId, categoriaNombre, onClose }: ComplementaryPlansPanelProps) {
  const planes = useComplementaryPlansActivos()
  const createComplementaryPlan = useAppStore((s) => s.createComplementaryPlan)
  const deleteComplementaryPlan = useAppStore((s) => s.deleteComplementaryPlan)
  const club = useAppStore((s) => s.club)
  const showToast = useToastStore((s) => s.showToast)

  const [creando, setCreando] = useState(false)
  const [planEnEdicion, setPlanEnEdicion] = useState<ComplementaryPlan | null>(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<ComplementaryPlan | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [planAClonar, setPlanAClonar] = useState<ComplementaryPlan | null>(null)
  const [exportandoCartilla, setExportandoCartilla] = useState(false)

  async function handleCrear() {
    setCreando(true)
    try {
      const creado = await createComplementaryPlan({
        categoryId,
        title: 'Nuevo Plan Complementario',
        durationWeeks: 4,
        planData: { exercises: [] },
      })
      setPlanEnEdicion(creado)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo crear el plan.'))
    } finally {
      setCreando(false)
    }
  }

  async function handleEliminar() {
    if (!confirmandoEliminar) return
    setEliminando(true)
    try {
      await deleteComplementaryPlan(confirmandoEliminar.id)
      showToast('success', 'Plan eliminado.')
      setConfirmandoEliminar(null)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar el plan.'))
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              🎒 Planes Extra-Club (Complementarios)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {categoriaNombre} — mesociclos de fuerza para gimnasios externos al club.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setExportandoCartilla(true)}
              disabled={planes.length === 0}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              🖨️ Descargar Cartilla Completa (PDF)
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {planes.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Todavía no hay planes complementarios para esta categoría.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {planes.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700"
                >
                  <button type="button" onClick={() => setPlanEnEdicion(plan)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{plan.title}</p>
                    <p className="text-xs text-slate-400">
                      {plan.durationWeeks} semanas · {plan.planData.exercises.length} ejercicio(s)
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPlanAClonar(plan)}
                      aria-label="Clonar a otra categoría"
                      title="📋 Clonar a otra Categoría"
                      className="rounded-md px-1.5 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-union-red-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-union-red-400"
                    >
                      📋
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoEliminar(plan)}
                      aria-label="Eliminar plan"
                      className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleCrear}
            disabled={creando}
            className="mt-4 w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-400 hover:border-union-red-400 hover:text-union-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:border-union-red-500 dark:hover:text-union-red-400"
          >
            {creando ? 'Creando…' : '+ Crear Nuevo Plan Complementario'}
          </button>
        </div>
      </div>

      {planEnEdicion && (
        <ComplementaryPlanEditor
          plan={planEnEdicion}
          categoriaNombre={categoriaNombre}
          onClose={() => setPlanEnEdicion(null)}
        />
      )}

      {planAClonar && (
        <ClonePlanModal
          plan={planAClonar}
          onClonado={() => setPlanAClonar(null)}
          onClose={() => setPlanAClonar(null)}
        />
      )}

      {exportandoCartilla && (
        <BulkComplementaryPdfExport
          plans={planes}
          clubNombre={club?.nombre ?? 'C.A. Unión'}
          categoriaNombre={categoriaNombre}
          onClose={() => setExportandoCartilla(false)}
        />
      )}

      {confirmandoEliminar && (
        <ConfirmDialog
          titulo="Eliminar plan complementario"
          mensaje={`¿Seguro que querés eliminar "${confirmandoEliminar.title}"?`}
          onConfirm={handleEliminar}
          onCancel={() => setConfirmandoEliminar(null)}
          confirmando={eliminando}
        />
      )}
    </div>
  )
}
