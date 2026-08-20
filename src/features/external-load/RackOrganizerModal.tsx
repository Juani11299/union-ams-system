import { useMemo, useState } from 'react'
import { useToastStore } from '@/store/useToastStore'
import { inputClass } from '@/components/FormField'
import {
  organizarRacks,
  obtenerEjerciciosDisponibles,
  construirMensajeGrupos,
  type ClaveGrupoRack,
} from './rackOrganizer'
import type { Athlete, GymExternalLoad, SessionPlan } from '@/types'

interface RackOrganizerModalProps {
  athletes: Athlete[]
  gymExternalLoads: GymExternalLoad[]
  sessionPlans: SessionPlan[]
  onClose: () => void
}

const GRUPO_ESTILO: Record<ClaveGrupoRack, string> = {
  A: 'border-union-red-500/40 bg-union-red-500/10',
  B: 'border-amber-400/40 bg-amber-400/10',
  C: 'border-emerald-400/40 bg-emerald-400/10',
  'sin-calibrar': 'border-white/10 bg-white/5',
}

const GRUPO_ICONO: Record<ClaveGrupoRack, string> = {
  A: '🔴',
  B: '🟡',
  C: '🟢',
  'sin-calibrar': '⚪',
}

/**
 * "Organizador de Racks" (Fase 29) — antes de una sesión de Fuerza, el
 * profe elige el ejercicio troncal del día y ve al plantel dividido en 3
 * terciles de fuerza (según el Top Set máximo histórico de cada uno, ver
 * `rackOrganizer.ts`) para no tener que armar los grupos de memoria ni
 * andar preguntando "vos cuánto levantás". Estética de pizarra de
 * vestuario (charcoal + tiza) a propósito, distinta del resto del panel de
 * Administración — esto se piensa para proyectar o mostrar en el gimnasio,
 * no para completar un formulario.
 */
export function RackOrganizerModal({ athletes, gymExternalLoads, sessionPlans, onClose }: RackOrganizerModalProps) {
  const showToast = useToastStore((s) => s.showToast)
  const ejerciciosDisponibles = useMemo(
    () => obtenerEjerciciosDisponibles(gymExternalLoads),
    [gymExternalLoads],
  )
  const [ejercicio, setEjercicio] = useState(ejerciciosDisponibles[0] ?? '')

  const grupos = useMemo(
    () => (ejercicio ? organizarRacks(athletes, gymExternalLoads, sessionPlans, ejercicio) : []),
    [athletes, gymExternalLoads, sessionPlans, ejercicio],
  )

  const hayAlgunGrupoConGente = grupos.some((g) => g.atletas.length > 0)

  async function handleCopiar() {
    if (!ejercicio) return
    const mensaje = construirMensajeGrupos(ejercicio, grupos)
    try {
      await navigator.clipboard.writeText(mensaje)
      showToast('success', 'Grupos copiados — pegalos en el grupo de WhatsApp del staff')
    } catch {
      showToast('error', 'No se pudo copiar el mensaje.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-union-charcoal text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">🗂️ Organizador de Racks</h3>
            <p className="text-xs text-white/50">Terciles de fuerza para armar los grupos antes de entrenar</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {ejerciciosDisponibles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-white/50">
              <span className="text-3xl">📭</span>
              Todavía no hay registros de Terminal de Fuerza para ningún ejercicio en esta categoría.
            </div>
          ) : (
            <>
              <div className="max-w-xs">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">
                  Ejercicio troncal
                </label>
                <select
                  value={ejercicio}
                  onChange={(e) => setEjercicio(e.target.value)}
                  className={`${inputClass} border-white/20 bg-white/10 text-white`}
                >
                  {ejerciciosDisponibles.map((nombre) => (
                    <option key={nombre} value={nombre} className="text-slate-900">
                      {nombre}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-white/40">
                  Top Set máximo de cada jugador en los últimos 60 días.
                </p>
              </div>

              {!hayAlgunGrupoConGente ? (
                <div className="mt-6 flex flex-col items-center gap-2 py-12 text-center text-sm text-white/50">
                  <span className="text-3xl">🤷</span>
                  Nadie del plantel tiene un Top Set registrado de "{ejercicio}" todavía.
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {grupos.map((grupo) => (
                    <div
                      key={grupo.clave}
                      className={`flex flex-col gap-2 rounded-2xl border-2 p-4 ${GRUPO_ESTILO[grupo.clave]}`}
                    >
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide">
                          {GRUPO_ICONO[grupo.clave]} {grupo.nombre}
                        </p>
                        <p className="text-xs font-semibold text-white/60">
                          {grupo.rangoKg
                            ? `${grupo.rangoKg.min}kg - ${grupo.rangoKg.max}kg`
                            : grupo.clave === 'sin-calibrar'
                              ? 'Sin dato de partida'
                              : '—'}
                        </p>
                      </div>
                      {grupo.atletas.length === 0 ? (
                        <p className="text-xs italic text-white/30">Nadie en este grupo.</p>
                      ) : (
                        <ul className="flex flex-col gap-1.5">
                          {grupo.atletas.map(({ athlete, topSetKg }) => (
                            <li
                              key={athlete.id}
                              className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-2.5 py-1.5 text-sm"
                            >
                              <span className="truncate">{athlete.nombre}</span>
                              {topSetKg !== null && (
                                <span className="shrink-0 font-bold tabular-nums text-white/70">{topSetKg}kg</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
          {ejercicio && hayAlgunGrupoConGente && (
            <button
              type="button"
              onClick={handleCopiar}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              📋 Copiar Grupos
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-union-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-union-red-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
