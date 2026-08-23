import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import type { ComplementaryPlan } from '@/types'

interface ClonePlanModalProps {
  plan: ComplementaryPlan
  onClonado: () => void
  onClose: () => void
}

/**
 * Modal de Clonado entre Categorías (Fase 39) — "copiar/pegar" de portapapeles
 * de un Plan Complementario entero (no una planilla diaria): el profe elige
 * la categoría de destino, ajusta el título si quiere, y `cloneComplementaryPlan`
 * hace el INSERT con el mismo `planData`/`durationWeeks` pero categoría y
 * título nuevos — el mesociclo original queda intacto, sin tocar.
 */
export function ClonePlanModal({ plan, onClonado, onClose }: ClonePlanModalProps) {
  const categories = useAppStore((s) => s.categories)
  const cloneComplementaryPlan = useAppStore((s) => s.cloneComplementaryPlan)
  const showToast = useToastStore((s) => s.showToast)

  const categoriasDestinoDisponibles = categories.filter((c) => c.id !== plan.categoryId)

  const [categoryIdDestino, setCategoryIdDestino] = useState(categoriasDestinoDisponibles[0]?.id ?? '')
  const [titulo, setTitulo] = useState(`${plan.title} (Copia)`)
  const [clonando, setClonando] = useState(false)

  async function handleClonar() {
    if (!categoryIdDestino || !titulo.trim()) return
    setClonando(true)
    try {
      await cloneComplementaryPlan(plan, categoryIdDestino, titulo.trim())
      const categoriaDestino = categories.find((c) => c.id === categoryIdDestino)
      showToast('success', `¡Plan clonado exitosamente a ${categoriaDestino?.nombre ?? 'la categoría elegida'}!`)
      onClonado()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo clonar el plan.'))
    } finally {
      setClonando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          📋 Clonar Plan a otra Categoría
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Duplica <strong>{plan.title}</strong> ({plan.durationWeeks} semanas,{' '}
          {plan.planData.exercises.length} ejercicio(s)) sin tocar el original.
        </p>

        {categoriasDestinoDisponibles.length === 0 ? (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            No hay otra categoría a la cual clonar este plan.
          </p>
        ) : (
          <>
            <label className="mt-4 flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Categoría de destino</span>
              <select
                value={categoryIdDestino}
                onChange={(e) => setCategoryIdDestino(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {categoriasDestinoDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Título del nuevo plan</span>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={clonando}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleClonar}
            disabled={clonando || !categoryIdDestino || !titulo.trim()}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {clonando ? 'Clonando…' : '📋 Clonar Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
