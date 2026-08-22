import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { formatFechaCorta, parsearFechaLocal, fechaHoyLocal } from '@/utils/fecha'
import { generarMesociclo, parsearEsquema, type TipoProgresionMesociclo } from './mesocycleEngine'
import type { SessionPlan, GymSheetData } from '@/types'

const ESQUEMAS_RAPIDOS = ['1x1', '2x1', '3x1']

interface MesocycleProgressionModalProps {
  /** Sesión de Gimnasio base ("día 0") — se copia y muta hacia adelante, nunca se toca. */
  plan: SessionPlan
  /** Planilla tal como está en el editor AHORA (puede tener cambios sin guardar todavía) — es la que se clona, no la ya persistida. */
  gymSheetBase: GymSheetData
  onClose: () => void
  /** Se llama después de crear todas las sesiones — el caller decide si refresca/cierra el editor. */
  onGenerado: () => void
}

/**
 * Motor de Periodización de Mesociclo (Fase 35, Paso 1) — clona la sesión de
 * Gimnasio actual hacia las próximas semanas aplicando sobrecarga progresiva
 * (semanas de carga) y descarga (deload) automáticamente, según el esquema
 * (ej. "2x1") y el tipo de progresión elegidos. Ver `mesocycleEngine.ts` para
 * las reglas de mutación.
 */
export function MesocycleProgressionModal({
  plan,
  gymSheetBase,
  onClose,
  onGenerado,
}: MesocycleProgressionModalProps) {
  const createSessionPlan = useAppStore((s) => s.createSessionPlan)
  const updateSessionPlanGymSheet = useAppStore((s) => s.updateSessionPlanGymSheet)
  const showToast = useToastStore((s) => s.showToast)

  const [esquemaInput, setEsquemaInput] = useState('2x1')
  const [tipo, setTipo] = useState<TipoProgresionMesociclo | null>(null)
  const [generando, setGenerando] = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)

  const esquema = parsearEsquema(esquemaInput)
  const totalSemanas = esquema ? esquema.loadWeeks + esquema.deloadWeeks : 0
  const puedeGenerar = !!esquema && !!tipo && !generando

  async function handleGenerar() {
    if (!esquema || !tipo) return

    setGenerando(true)
    try {
      const sesiones = generarMesociclo(gymSheetBase, plan.fecha, esquema, tipo)

      for (const sesion of sesiones) {
        setProgreso(`Generando semana ${sesion.semana} de ${sesiones.length}…`)
        const nuevaSesion = await createSessionPlan({
          seasonId: plan.season_id,
          categoryId: plan.category_id,
          titulo: `${plan.titulo} — Semana ${sesion.semana}${sesion.faseDeload ? ' (Deload)' : ''}`,
          fecha: sesion.fecha,
          matchDay: plan.matchDay,
          tipo: plan.tipo,
          duracionEstimadaMin: plan.duracionEstimadaMin,
          rpeEsperado: plan.rpeEsperado ?? 5,
          descripcion: plan.descripcion,
        })
        await updateSessionPlanGymSheet(nuevaSesion.id, sesion.gymSheetData)
      }

      showToast('success', `¡Mesociclo generado! ${sesiones.length} sesión(es) creada(s).`)
      onGenerado()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo generar el mesociclo.'))
    } finally {
      setGenerando(false)
      setProgreso(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            🔁 Motor de Periodización de Mesociclo
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Clona <strong>{plan.titulo}</strong> ({formatFechaCorta(plan.fecha)}) hacia las próximas semanas,
            aplicando sobrecarga progresiva y descarga automáticamente.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Esquema (semanas de carga × semanas de descarga)
          </label>
          <input
            value={esquemaInput}
            onChange={(e) => setEsquemaInput(e.target.value)}
            placeholder="Ej. 2x1"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex gap-1.5">
            {ESQUEMAS_RAPIDOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEsquemaInput(e)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  esquemaInput === e
                    ? 'border-union-red-500 bg-union-red-50 text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          {esquemaInput.trim() !== '' && !esquema && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Formato inválido. Usá "cargaxdescarga", ej. 2x1.
            </p>
          )}
          {esquema && (
            <p className="text-xs text-slate-400">
              {esquema.loadWeeks} semana(s) de carga + {esquema.deloadWeeks} de descarga = {totalSemanas} sesión(es)
              nueva(s), de {formatFechaCorta(sumarSemanaPreview(plan.fecha, 1))} a{' '}
              {formatFechaCorta(sumarSemanaPreview(plan.fecha, totalSemanas))}.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de progresión</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo('volumen')}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 text-sm font-semibold transition-colors ${
                tipo === 'volumen'
                  ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'
                  : 'border-slate-200 text-slate-500 hover:border-sky-300 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <span className="text-xl">📈</span>
              Progresión de VOLUMEN
            </button>
            <button
              type="button"
              onClick={() => setTipo('intensidad')}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 text-sm font-semibold transition-colors ${
                tipo === 'intensidad'
                  ? 'border-union-red-500 bg-union-red-50 text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400'
                  : 'border-slate-200 text-slate-500 hover:border-union-red-300 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <span className="text-xl">🔥</span>
              Progresión de INTENSIDAD
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={generando}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerar}
            disabled={!puedeGenerar}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {progreso ?? 'Generar Mesociclo'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Sólo para el texto de preview del rango de fechas — misma cuenta de días que hace el motor. */
function sumarSemanaPreview(fecha: string, semanas: number): string {
  const d = parsearFechaLocal(fecha)
  d.setDate(d.getDate() + semanas * 7)
  return fechaHoyLocal(d)
}
