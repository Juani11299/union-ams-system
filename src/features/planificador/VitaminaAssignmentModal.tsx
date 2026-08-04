import { useState } from 'react'
import { useAppStore, useAthletesActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Avatar } from '@/components/Avatar'
import { getErrorMessage } from '@/utils/errors'

interface VitaminaAssignmentModalProps {
  templateId: string
  templateNombre: string
  sessionPlanId: string
  onClose: () => void
}

/**
 * Modal rápido de asignación individual (Fase 12) — se abre al soltar una
 * plantilla "Vitamina" sobre un día: el profe elige a mano a qué jugadores
 * puntuales les aplica (ej. sólo a los que vienen con déficit de fuerza
 * excéntrica), a diferencia de "General" que va directo a todo el plantel.
 */
export function VitaminaAssignmentModal({
  templateId,
  templateNombre,
  sessionPlanId,
  onClose,
}: VitaminaAssignmentModalProps) {
  const athletes = useAthletesActivos()
  const assignTemplateToDay = useAppStore((s) => s.assignTemplateToDay)
  const showToast = useToastStore((s) => s.showToast)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [guardando, setGuardando] = useState(false)

  function toggle(athleteId: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(athleteId)) next.delete(athleteId)
      else next.add(athleteId)
      return next
    })
  }

  async function handleConfirmar() {
    if (seleccionados.size === 0) {
      showToast('error', 'Elegí al menos un jugador.')
      return
    }
    setGuardando(true)
    try {
      await assignTemplateToDay({
        templateId,
        sessionPlanId,
        tipo: 'Vitamina',
        athleteIds: Array.from(seleccionados),
      })
      showToast('success', `¡"${templateNombre}" asignada a ${seleccionados.size} jugador${seleccionados.size === 1 ? '' : 'es'}!`)
      onClose()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo asignar la plantilla.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">💊 {templateNombre}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Elegí a qué jugadores les asignás esta dosis "Vitamina".
        </p>

        {athletes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No hay jugadores en el plantel activo.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {athletes.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <input
                  type="checkbox"
                  checked={seleccionados.has(a.id)}
                  onChange={() => toggle(a.id)}
                  className="h-4 w-4 accent-union-red-600"
                />
                <Avatar nombre={a.nombre} size="sm" />
                <span className="truncate text-sm text-slate-800 dark:text-slate-200">{a.nombre}</span>
              </label>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirmar}
          disabled={guardando}
          className="mt-4 rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Asignando…' : `Asignar a ${seleccionados.size} jugador${seleccionados.size === 1 ? '' : 'es'}`}
        </button>
      </div>
    </div>
  )
}
