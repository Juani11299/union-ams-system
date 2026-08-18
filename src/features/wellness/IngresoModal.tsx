import { useEffect, useState } from 'react'
import { useAppStore, useAthletesActivos } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Tabs } from '@/components/Tabs'
import { Field, inputClass } from '@/components/FormField'
import { RatingPicker } from '@/components/RatingPicker'
import { colorRpe } from '@/features/workload/calculations'
import { getErrorMessage } from '@/utils/errors'
import { fechaHoyLocal } from '@/utils/fecha'
import { construirLinkWellness, construirLinkRpe, copiarLinkMagico } from '@/utils/magicLinks'
import type { WellnessRating } from '@/types'

interface TabFormProps {
  athleteId: string
}

/** Tab 1: inicio del día — wellness + comentario de dolor opcional. */
function TabWellness({ athleteId }: TabFormProps) {
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const submitWellness = useAppStore((s) => s.submitWellness)
  const showToast = useToastStore((s) => s.showToast)

  const [sueno, setSueno] = useState<WellnessRating>(3)
  const [dolorMuscular, setDolorMuscular] = useState<WellnessRating>(3)
  const [estres, setEstres] = useState<WellnessRating>(3)
  const [fatiga, setFatiga] = useState<WellnessRating>(3)
  const [comentarioDolor, setComentarioDolor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!athleteId || !activeSeasonId || !activeCategoryId || guardando) return
    setError(null)
    setGuardando(true)
    try {
      await submitWellness({
        athleteId,
        seasonId: activeSeasonId,
        categoryId: activeCategoryId,
        fecha: fechaHoyLocal(),
        sueno,
        dolorMuscular,
        estres,
        fatiga,
        comentarioDolor: comentarioDolor.trim() || undefined,
      })
      showToast('success', '¡Wellness guardado!')
      setSueno(3)
      setDolorMuscular(3)
      setEstres(3)
      setFatiga(3)
      setComentarioDolor('')
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el wellness.'))
    } finally {
      setGuardando(false)
    }
  }

  function handleGenerarLink() {
    if (!activeSeasonId || !activeCategoryId) return
    copiarLinkMagico(construirLinkWellness(activeSeasonId, activeCategoryId), showToast)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}
      <RatingPicker
        label="Calidad de sueño"
        value={sueno}
        onChange={(v) => setSueno(v as WellnessRating)}
        emojis={['😫', '😕', '😐', '🙂', '😄']}
      />
      <RatingPicker
        label="Dolor muscular"
        value={dolorMuscular}
        onChange={(v) => setDolorMuscular(v as WellnessRating)}
        emojis={['💪', '🙂', '😐', '😣', '🤕']}
        invert
      />
      <RatingPicker
        label="Estrés"
        value={estres}
        onChange={(v) => setEstres(v as WellnessRating)}
        emojis={['😌', '🙂', '😐', '😟', '😖']}
        invert
      />
      <RatingPicker
        label="Fatiga"
        value={fatiga}
        onChange={(v) => setFatiga(v as WellnessRating)}
        emojis={['⚡', '🙂', '😐', '😓', '🥵']}
        invert
      />
      <Field label="Comentarios / ¿Siente algún dolor?">
        <textarea
          className={inputClass}
          rows={3}
          value={comentarioDolor}
          onChange={(e) => setComentarioDolor(e.target.value)}
          placeholder="Opcional"
        />
      </Field>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-lg bg-union-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar Wellness'}
        </button>
        <button
          type="button"
          onClick={handleGenerarLink}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          🔗 Generar Link de Wellness
        </button>
      </div>
    </form>
  )
}

/** Tab 2: fin de la sesión — sólo RPE. La duración la carga el profe en el
 * planificador ("Configuración de Sesión Diaria"), no acá. */
function TabRpe({ athleteId }: TabFormProps) {
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const submitSessionLoad = useAppStore((s) => s.submitSessionLoad)
  const showToast = useToastStore((s) => s.showToast)

  const [rpe, setRpe] = useState(5)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!athleteId || !activeSeasonId || !activeCategoryId || guardando) return
    setError(null)
    setGuardando(true)
    try {
      await submitSessionLoad({
        planId: null,
        athleteId,
        seasonId: activeSeasonId,
        categoryId: activeCategoryId,
        fecha: fechaHoyLocal(),
        rpe,
        // La duración real se define en "PLANIFICAR MICROCICLO" (Configuración
        // de Sesión Diaria) y se cruza dinámicamente con este RPE — ver
        // calcularCargaEjecutadaReal. Estos dos quedan como placeholder.
        duracionMin: 0,
        cargaInternaCalculada: 0,
      })
      showToast('success', '¡RPE guardado!')
      setRpe(5)
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el RPE.'))
    } finally {
      setGuardando(false)
    }
  }

  function handleGenerarLink() {
    if (!activeSeasonId || !activeCategoryId) return
    copiarLinkMagico(construirLinkRpe(activeSeasonId, activeCategoryId), showToast)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">RPE de la sesión</span>
        <span className="text-5xl font-bold" style={{ color: colorRpe(rpe) }}>
          {rpe}
        </span>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={rpe}
          onChange={(e) => setRpe(Number(e.target.value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
          style={{
            background: `linear-gradient(to right, ${colorRpe(rpe)} 0%, ${colorRpe(rpe)} ${
              (rpe / 10) * 100
            }%, #e2e8f0 ${(rpe / 10) * 100}%, #e2e8f0 100%)`,
          }}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-lg bg-union-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar RPE'}
        </button>
        <button
          type="button"
          onClick={handleGenerarLink}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          🔗 Generar Link de RPE
        </button>
      </div>
    </form>
  )
}

/** Modal/drawer central de ingreso de datos ("Ingresar Datos") — Fase 9. */
export function IngresoModal() {
  const abierto = useAppStore((s) => s.modalIngresoAbierto)
  const tab = useAppStore((s) => s.modalIngresoTab)
  const setTab = useAppStore((s) => s.setModalIngresoTab)
  const cerrar = useAppStore((s) => s.cerrarModalIngreso)
  const athletes = useAthletesActivos()
  const [athleteId, setAthleteId] = useState('')

  useEffect(() => {
    if (abierto && athletes.length > 0 && !athletes.some((a) => a.id === athleteId)) {
      setAthleteId(athletes[0].id)
    }
  }, [abierto, athletes, athleteId])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={cerrar}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-slate-900 sm:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Ingresar Datos</h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {athletes.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No hay jugadores cargados para esta categoría en esta temporada.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <Field label="Jugador" required>
                <select className={inputClass} value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Tabs
                tabs={[
                  { id: 'wellness', label: 'Cargar Wellness', icon: '🌅' },
                  { id: 'rpe', label: 'Cargar RPE', icon: '🏁' },
                ]}
                activeId={tab}
                onChange={(id) => setTab(id as 'wellness' | 'rpe')}
              />

              {tab === 'wellness' ? <TabWellness athleteId={athleteId} /> : <TabRpe athleteId={athleteId} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
