import { useState } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import type { Athlete, GymSet, GymSheetEjercicio } from '@/types'

interface RegistroModalProps {
  jugador: Athlete
  sesionId: string
  /** Fase 37 — todos los ejercicios marcados 🎯 en la planilla de hoy (antes era uno solo). */
  ejercicios: GymSheetEjercicio[]
  onClose: () => void
}

/** Extrae el primer número de un campo libre de la planilla (ej. "6" o "8-10" → 8, 6). */
export function parsearNumero(texto: string, fallback: number): number {
  const match = texto.match(/\d+([.,]\d+)?/)
  if (!match) return fallback
  const valor = Number(match[0].replace(',', '.'))
  return Number.isFinite(valor) && valor > 0 ? Math.round(valor) : fallback
}

export const SERIES_DEFAULT = 3
export const REPS_DEFAULT = 8
export const PESO_INICIAL_DEFAULT = 20

/**
 * Modal táctil a pantalla completa ("Top Set Tracking", Fase 29; multi-
 * ejercicio desde Fase 37) — el cuello de botella real de "40 atletas en 40
 * minutos" no era la UI táctil en sí (ya eran botones grandes, Fase 17),
 * sino pedir CADA serie una por una. En fuerza, lo único que un jugador
 * necesita reportar rápido es el peso de su serie efectiva (Top Set); series
 * y repeticiones ya están decididas en la planificación y sólo se ajustan si
 * hoy se desvió del plan.
 *
 * Fase 37 — cuando el profe marca más de un ejercicio 🎯, este modal pasa a
 * tener una pestaña por ejercicio arriba (con ✓ en el que ya se guardó) en
 * vez de asumir uno solo. Cada pestaña es un `RegistroEjercicioForm`
 * separado, montado con `key={ejercicio.id}` — así el estado (series, reps,
 * Top Set) arranca de cero al cambiar de pestaña en vez de arrastrar el
 * valor del ejercicio anterior.
 */
export function RegistroModal({ jugador, sesionId, ejercicios, onClose }: RegistroModalProps) {
  const gymExternalLoads = useAppStore((s) => s.gymExternalLoads)
  const [indiceActivo, setIndiceActivo] = useState(() => {
    // Arranca en el primer ejercicio que este jugador todavía no cargó hoy
    // — si ya cargó todos (viene a corregir), arranca en el primero.
    const primeroSinCargar = ejercicios.findIndex(
      (e) => !gymExternalLoads.some((g) => g.athleteId === jugador.id && g.sessionId === sesionId && g.exerciseName === e.nombre),
    )
    return primeroSinCargar >= 0 ? primeroSinCargar : 0
  })

  const ejercicioActivo = ejercicios[indiceActivo]

  function estaGuardado(ejercicio: GymSheetEjercicio): boolean {
    return gymExternalLoads.some(
      (g) => g.athleteId === jugador.id && g.sessionId === sesionId && g.exerciseName === ejercicio.nombre,
    )
  }

  function handleGuardadoDeEjercicio() {
    // Fase 37 — al guardar, saltar directo al próximo ejercicio sin cargar
    // (si hay uno) en vez de obligar al jugador a tocar la pestaña a mano;
    // si ya están todos, cerrar el modal solo.
    const siguienteSinCargar = ejercicios.findIndex((e, i) => i !== indiceActivo && !estaGuardado(e))
    if (siguienteSinCargar >= 0) {
      setIndiceActivo(siguienteSinCargar)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-union-charcoal text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-widest text-white/50">
            {ejercicios.length > 1 ? `Ejercicio ${indiceActivo + 1} de ${ejercicios.length}` : ejercicioActivo.nombre}
          </p>
          <h2 className="truncate text-2xl font-black">{jugador.nombre}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      {ejercicios.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-white/10 px-4 py-3">
          {ejercicios.map((ej, i) => (
            <button
              key={ej.id}
              type="button"
              onClick={() => setIndiceActivo(i)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                i === indiceActivo
                  ? 'bg-union-red-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {estaGuardado(ej) && <span aria-hidden>✓</span>}
              {ej.nombre}
            </button>
          ))}
        </div>
      )}

      <RegistroEjercicioForm
        key={ejercicioActivo.id}
        jugador={jugador}
        sesionId={sesionId}
        ejercicio={ejercicioActivo}
        onGuardado={handleGuardadoDeEjercicio}
      />
    </div>
  )
}

interface RegistroEjercicioFormProps {
  jugador: Athlete
  sesionId: string
  ejercicio: GymSheetEjercicio
  onGuardado: () => void
}

/** El formulario de un solo ejercicio — antes era todo `RegistroModal`; se separó en Fase 37 para poder montar uno por pestaña. */
function RegistroEjercicioForm({ jugador, sesionId, ejercicio, onGuardado }: RegistroEjercicioFormProps) {
  const gymExternalLoads = useAppStore((s) => s.gymExternalLoads)
  const submitGymExternalLoad = useAppStore((s) => s.submitGymExternalLoad)
  const showToast = useToastStore((s) => s.showToast)
  const [guardando, setGuardando] = useState(false)

  // Si el jugador ya se registró hoy para ESTE ejercicio, reabrir con sus
  // datos (permite corregir sin duplicar — el store hace upsert por
  // athlete+session+exercise desde Fase 37).
  const registroExistente = gymExternalLoads.find(
    (g) => g.athleteId === jugador.id && g.sessionId === sesionId && g.exerciseName === ejercicio.nombre,
  )

  const ultimoRegistroDelEjercicio = [...gymExternalLoads]
    .filter(
      (g) =>
        g.athleteId === jugador.id &&
        g.exerciseName === ejercicio.nombre &&
        g.id !== registroExistente?.id,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  const seriesPlanificadas = parsearNumero(ejercicio.series, SERIES_DEFAULT)
  const repsPlanificadas = parsearNumero(ejercicio.repeticiones, REPS_DEFAULT)
  const pesoSugerido =
    ultimoRegistroDelEjercicio && ultimoRegistroDelEjercicio.setsData.length > 0
      ? Math.max(...ultimoRegistroDelEjercicio.setsData.map((s) => s.weightKg))
      : PESO_INICIAL_DEFAULT

  const [series, setSeries] = useState(() =>
    registroExistente ? registroExistente.setsData.length : seriesPlanificadas,
  )
  const [reps, setReps] = useState(() =>
    registroExistente ? (registroExistente.setsData[0]?.reps ?? repsPlanificadas) : repsPlanificadas,
  )
  const [topSetKg, setTopSetKg] = useState(() =>
    registroExistente && registroExistente.setsData.length > 0
      ? Math.max(...registroExistente.setsData.map((s) => s.weightKg))
      : pesoSugerido,
  )

  const tonelaje = series * reps * topSetKg

  async function handleGuardar() {
    setGuardando(true)
    try {
      const setsData: GymSet[] = Array.from({ length: series }, () => ({ reps, weightKg: topSetKg }))
      await submitGymExternalLoad({
        athleteId: jugador.id,
        sessionId: sesionId,
        exerciseName: ejercicio.nombre,
        setsData,
        totalTonnage: tonelaje,
      })
      showToast('success', `¡${jugador.nombre.split(' ')[0]} registró ${ejercicio.nombre}!`)
      onGuardado()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar el entrenamiento.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-white/60">
            🔥 Peso del Top Set — {ejercicio.nombre}
          </span>
          <div className="flex items-center gap-4">
            <StepperButton
              aria-label="Restar 2.5 kg"
              size="xl"
              onClick={() => setTopSetKg((v) => Math.max(0, v - 2.5))}
            >
              −
            </StepperButton>
            <span className="w-40 text-center text-7xl font-black tabular-nums">{topSetKg}</span>
            <StepperButton aria-label="Sumar 2.5 kg" size="xl" onClick={() => setTopSetKg((v) => v + 2.5)}>
              +
            </StepperButton>
          </div>
          <span className="text-lg font-semibold text-white/40">kg</span>
        </div>

        <div className="flex items-center gap-8 rounded-2xl bg-white/5 px-6 py-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Series</span>
            <div className="flex items-center gap-1.5">
              <StepperButton
                aria-label="Restar una serie"
                size="sm"
                onClick={() => setSeries((v) => Math.max(1, v - 1))}
              >
                −
              </StepperButton>
              <span className="w-8 text-center text-xl font-bold tabular-nums">{series}</span>
              <StepperButton aria-label="Sumar una serie" size="sm" onClick={() => setSeries((v) => v + 1)}>
                +
              </StepperButton>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Reps</span>
            <div className="flex items-center gap-1.5">
              <StepperButton
                aria-label="Restar una repetición"
                size="sm"
                onClick={() => setReps((v) => Math.max(1, v - 1))}
              >
                −
              </StepperButton>
              <span className="w-8 text-center text-xl font-bold tabular-nums">{reps}</span>
              <StepperButton aria-label="Sumar una repetición" size="sm" onClick={() => setReps((v) => v + 1)}>
                +
              </StepperButton>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-white/40">
          Tonelaje total ({series}×{reps}×{topSetKg}kg):{' '}
          <span className="font-semibold text-white/70">{tonelaje.toLocaleString('es-AR')} kg</span>
        </p>
      </div>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full rounded-2xl bg-union-red-600 py-6 text-2xl font-black uppercase tracking-wide text-white hover:bg-union-red-700 disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : `Guardar ${ejercicio.nombre}`}
        </button>
      </div>
    </>
  )
}

function StepperButton({
  onClick,
  children,
  size = 'xl',
  ...props
}: {
  onClick: () => void
  children: ReactNode
  size?: 'xl' | 'sm'
  'aria-label': string
}) {
  const clases =
    size === 'xl'
      ? 'h-20 w-20 text-4xl'
      : 'h-9 w-9 text-lg'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-white/10 font-black text-white hover:bg-white/20 active:bg-union-red-600 ${clases}`}
      {...props}
    >
      {children}
    </button>
  )
}
