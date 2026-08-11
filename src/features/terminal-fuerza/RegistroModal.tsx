import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import type { Athlete, GymSet, GymSheetEjercicio } from '@/types'

interface RegistroModalProps {
  jugador: Athlete
  sesionId: string
  ejercicio: GymSheetEjercicio
  onClose: () => void
}

interface FilaSerie {
  id: string
  reps: number
  pesoKg: number
}

let contadorFila = 0
function nuevaFilaId(): string {
  contadorFila += 1
  return `fila-${contadorFila}`
}

/** Extrae el primer número de un campo libre de la planilla (ej. "6" o "8-10" → 8, 6). */
function parsearNumero(texto: string, fallback: number): number {
  const match = texto.match(/\d+([.,]\d+)?/)
  if (!match) return fallback
  const valor = Number(match[0].replace(',', '.'))
  return Number.isFinite(valor) && valor > 0 ? Math.round(valor) : fallback
}

const REPS_DEFAULT = 8
const PESO_INICIAL_DEFAULT = 20

/**
 * Modal táctil a pantalla completa ("fat-finger UI", Fase 17) — sólo
 * botones grandes [-]/[+], nunca un `<input>` ni el teclado nativo. Series
 * dinámicas: no se pregunta "cuántas series", se arranca con una fila
 * precargada (reps de la planilla, kg del último registro de este ejercicio
 * para este jugador) y "+ AGREGAR SERIE" agrega filas abajo.
 */
export function RegistroModal({ jugador, sesionId, ejercicio, onClose }: RegistroModalProps) {
  const gymExternalLoads = useAppStore((s) => s.gymExternalLoads)
  const submitGymExternalLoad = useAppStore((s) => s.submitGymExternalLoad)
  const showToast = useToastStore((s) => s.showToast)
  const [guardando, setGuardando] = useState(false)

  // Si el jugador ya se registró hoy para esta sesión, reabrir con sus datos
  // (permite corregir sin duplicar — el store hace upsert por athlete+session).
  const registroExistente = gymExternalLoads.find(
    (g) => g.athleteId === jugador.id && g.sessionId === sesionId,
  )

  const ultimoRegistroDelEjercicio = [...gymExternalLoads]
    .filter(
      (g) =>
        g.athleteId === jugador.id &&
        g.exerciseName === ejercicio.nombre &&
        g.id !== registroExistente?.id,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  const repsIniciales = parsearNumero(ejercicio.repeticiones, REPS_DEFAULT)
  const pesoInicial = ultimoRegistroDelEjercicio?.setsData[0]?.weightKg ?? PESO_INICIAL_DEFAULT

  const [filas, setFilas] = useState<FilaSerie[]>(() => {
    if (registroExistente) {
      return registroExistente.setsData.map((s) => ({ id: nuevaFilaId(), reps: s.reps, pesoKg: s.weightKg }))
    }
    return [{ id: nuevaFilaId(), reps: repsIniciales, pesoKg: pesoInicial }]
  })

  const tonelaje = useMemo(() => filas.reduce((acc, f) => acc + f.reps * f.pesoKg, 0), [filas])

  function actualizarFila(id: string, cambios: Partial<FilaSerie>) {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, ...cambios } : f)))
  }

  function agregarFila() {
    setFilas((prev) => {
      const ultima = prev[prev.length - 1]
      return [
        ...prev,
        { id: nuevaFilaId(), reps: ultima?.reps ?? repsIniciales, pesoKg: ultima?.pesoKg ?? pesoInicial },
      ]
    })
  }

  function quitarFila(id: string) {
    setFilas((prev) => (prev.length > 1 ? prev.filter((f) => f.id !== id) : prev))
  }

  async function handleGuardar() {
    setGuardando(true)
    try {
      const setsData: GymSet[] = filas.map((f) => ({ reps: f.reps, weightKg: f.pesoKg }))
      await submitGymExternalLoad({
        athleteId: jugador.id,
        sessionId: sesionId,
        exerciseName: ejercicio.nombre,
        setsData,
        totalTonnage: tonelaje,
      })
      showToast('success', `¡${jugador.nombre.split(' ')[0]} registró su entrenamiento!`)
      onClose()
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar el entrenamiento.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-union-charcoal text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-widest text-white/50">
            {ejercicio.nombre}
          </p>
          <h2 className="truncate text-2xl font-black">{jugador.nombre}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={guardando}
          aria-label="Cerrar"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl hover:bg-white/20 disabled:opacity-50"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {filas.map((fila, i) => (
            <div key={fila.id} className="flex items-center gap-2 rounded-2xl bg-white/5 p-3">
              <span className="w-8 shrink-0 text-center text-lg font-bold text-white/40">{i + 1}</span>

              <div className="flex flex-1 flex-wrap items-center justify-center gap-4 sm:justify-between">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Reps</span>
                  <div className="flex items-center gap-2">
                    <StepperButton
                      aria-label="Restar una repetición"
                      onClick={() => actualizarFila(fila.id, { reps: Math.max(1, fila.reps - 1) })}
                    >
                      −
                    </StepperButton>
                    <span className="w-14 text-center text-3xl font-black tabular-nums">{fila.reps}</span>
                    <StepperButton
                      aria-label="Sumar una repetición"
                      onClick={() => actualizarFila(fila.id, { reps: fila.reps + 1 })}
                    >
                      +
                    </StepperButton>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Kg</span>
                  <div className="flex items-center gap-2">
                    <StepperButton
                      aria-label="Restar 2.5 kg"
                      onClick={() => actualizarFila(fila.id, { pesoKg: Math.max(0, fila.pesoKg - 2.5) })}
                    >
                      −
                    </StepperButton>
                    <span className="w-16 text-center text-3xl font-black tabular-nums">{fila.pesoKg}</span>
                    <StepperButton
                      aria-label="Sumar 2.5 kg"
                      onClick={() => actualizarFila(fila.id, { pesoKg: fila.pesoKg + 2.5 })}
                    >
                      +
                    </StepperButton>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => quitarFila(fila.id)}
                disabled={filas.length === 1}
                aria-label="Quitar serie"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={agregarFila}
          className="mt-4 w-full rounded-2xl border-2 border-dashed border-white/20 py-5 text-lg font-bold text-white/70 hover:border-union-red-400 hover:text-union-red-400"
        >
          + AGREGAR SERIE
        </button>

        <p className="mt-4 text-center text-sm text-white/40">
          Tonelaje total: <span className="font-semibold text-white/70">{tonelaje.toLocaleString('es-AR')} kg</span>
        </p>
      </div>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full rounded-2xl bg-union-red-600 py-6 text-2xl font-black uppercase tracking-wide text-white hover:bg-union-red-700 disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar Entrenamiento'}
        </button>
      </div>
    </div>
  )
}

function StepperButton({
  onClick,
  children,
  ...props
}: {
  onClick: () => void
  children: ReactNode
  'aria-label': string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl font-black text-white hover:bg-white/20 active:bg-union-red-600"
      {...props}
    >
      {children}
    </button>
  )
}
