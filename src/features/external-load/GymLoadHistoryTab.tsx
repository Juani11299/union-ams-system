import { useState } from 'react'
import { useAppStore, useAthletesActivos } from '@/store/useAppStore'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Avatar'
import { Field, inputClass } from '@/components/FormField'
import { MiniBarChart } from '@/components/MiniBarChart'
import { parsearFechaLocal } from '@/utils/fecha'

/**
 * Perfil del atleta — Registro de Carga Externa (Fase 17): historial de
 * tonelaje que el jugador cargó él mismo en la Terminal de Fuerza
 * (`/terminal-fuerza`) para el ejercicio troncal de cada sesión de Gimnasio.
 * Mismo patrón de "selector de jugador + historial" que `CmjTab`, pero de
 * sólo lectura — acá no se carga nada a mano, el dato nace en la Terminal.
 */
export function GymLoadHistoryTab() {
  const athletes = useAthletesActivos()
  const gymExternalLoads = useAppStore((s) => s.gymExternalLoads)
  const sessionPlans = useAppStore((s) => s.sessionPlans)

  const [athleteId, setAthleteId] = useState(athletes[0]?.id ?? '')

  if (athletes.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No hay jugadores cargados para esta categoría en esta temporada.
      </Card>
    )
  }

  const historial = gymExternalLoads
    .filter((g) => g.athleteId === athleteId)
    .map((g) => ({ ...g, sesion: sessionPlans.find((p) => p.id === g.sessionId) }))
    .sort((a, b) => (b.sesion?.fecha ?? '').localeCompare(a.sesion?.fecha ?? ''))

  const valoresGrafico = [...historial].reverse().map((h) => h.totalTonnage)
  const jugadorSeleccionado = athletes.find((a) => a.id === athleteId)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="flex h-fit flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Registro de Carga Externa</h2>
        <Field label="Jugador">
          <select className={inputClass} value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Field>
        {historial.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Tonelaje — últimos registros
            </p>
            <MiniBarChart valores={valoresGrafico} barClassName="bg-union-red-500 dark:bg-union-red-400" />
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Avatar nombre={jugadorSeleccionado?.nombre ?? ''} size="sm" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Historial de {jugadorSeleccionado?.nombre}
          </h2>
        </div>
        {historial.length === 0 ? (
          <p className="text-sm text-slate-400">Todavía no registró carga en la Terminal de Fuerza.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{h.exerciseName}</span>
                  <span className="text-xs capitalize text-slate-400">
                    {h.sesion
                      ? parsearFechaLocal(h.sesion.fecha).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                    {' · '}
                    {h.setsData.length} serie{h.setsData.length === 1 ? '' : 's'}
                  </span>
                </div>
                <span className="font-semibold text-union-red-600 dark:text-union-red-400">
                  {h.totalTonnage.toLocaleString('es-AR')} kg
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
