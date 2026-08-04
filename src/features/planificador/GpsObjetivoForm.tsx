import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Field, inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'
import type { DailyTask } from '@/types'

interface GpsObjetivoFormProps {
  tarea: DailyTask
}

/** Objetivos de Carga Externa/GPS para una tarea Físico de Campo — Fase 11. */
export function GpsObjetivoForm({ tarea }: GpsObjetivoFormProps) {
  const updateDailyTaskGpsObjetivo = useAppStore((s) => s.updateDailyTaskGpsObjetivo)
  const showToast = useToastStore((s) => s.showToast)

  const [distanciaObjetivo, setDistanciaObjetivo] = useState(tarea.gpsObjetivo?.distanciaObjetivo ?? 0)
  const [hsrObjetivo, setHsrObjetivo] = useState(tarea.gpsObjetivo?.hsrObjetivo ?? 0)
  const [aceleracionesObjetivo, setAceleracionesObjetivo] = useState(
    tarea.gpsObjetivo?.aceleracionesObjetivo ?? 0,
  )
  const [desaceleracionesObjetivo, setDesaceleracionesObjetivo] = useState(
    tarea.gpsObjetivo?.desaceleracionesObjetivo ?? 0,
  )
  const [guardando, setGuardando] = useState(false)

  async function handleGuardar() {
    setGuardando(true)
    try {
      await updateDailyTaskGpsObjetivo(tarea.id, {
        distanciaObjetivo,
        hsrObjetivo,
        aceleracionesObjetivo,
        desaceleracionesObjetivo,
      })
      showToast('success', '¡Objetivos de Carga Externa guardados!')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudieron guardar los objetivos.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Objetivos de Carga Externa (GPS) planificados para esta tarea — se comparan después contra lo
        que registre el módulo de Control de Carga Externa.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Distancia Total (m)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={distanciaObjetivo}
            onChange={(e) => setDistanciaObjetivo(Number(e.target.value))}
          />
        </Field>
        <Field label="HSR — Carrera de Alta Velocidad (m)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={hsrObjetivo}
            onChange={(e) => setHsrObjetivo(Number(e.target.value))}
          />
        </Field>
        <Field label="Aceleraciones (cant.)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={aceleracionesObjetivo}
            onChange={(e) => setAceleracionesObjetivo(Number(e.target.value))}
          />
        </Field>
        <Field label="Desaceleraciones (cant.)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={desaceleracionesObjetivo}
            onChange={(e) => setDesaceleracionesObjetivo(Number(e.target.value))}
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando}
        className="self-start rounded-lg bg-union-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {guardando ? 'Guardando…' : 'Guardar objetivos'}
      </button>
    </div>
  )
}
