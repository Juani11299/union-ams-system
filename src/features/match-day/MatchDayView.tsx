import { useMemo, useState } from 'react'
import {
  useAppStore,
  useAthletesActivos,
  useSessionExecutionsActivas,
  useSessionPlansActivos,
} from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { Tabs } from '@/components/Tabs'
import { inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'
import { formatFechaCorta, fechaHoyLocal } from '@/utils/fecha'
import type { ResultadoPartidoInput } from '@/utils/supabaseMappers'

/**
 * "Día de Partido" (Fase 11) — Gestión Competitiva. La convocatoria (quién fue
 * citado a este partido) es sólo estado local de esta vista, no se persiste en
 * Supabase (no se pidió una tabla nueva para eso en esta fase) — sí se persiste
 * lo que importa para el cálculo de carga: el Registro de Minutos, que escribe
 * directo en `session_executions` vía `submitMatchDayResultsBulk`.
 */
export function MatchDayView() {
  const athletes = useAthletesActivos()
  const sessionPlans = useSessionPlansActivos()
  const sessionExecutions = useSessionExecutionsActivas()
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const submitMatchDayResultsBulk = useAppStore((s) => s.submitMatchDayResultsBulk)
  const showToast = useToastStore((s) => s.showToast)

  const partidos = useMemo(
    () =>
      sessionPlans
        .filter((p) => p.tipo === 'Partido')
        .sort((a, b) => Math.abs(new Date(a.fecha).getTime() - Date.now()) - Math.abs(new Date(b.fecha).getTime() - Date.now())),
    [sessionPlans],
  )

  const [partidoId, setPartidoId] = useState<string | null>(partidos[0]?.id ?? null)
  const partido = partidos.find((p) => p.id === partidoId) ?? partidos[0] ?? null

  const [tab, setTab] = useState<'convocatoria' | 'post-partido'>('convocatoria')
  const [convocatorias, setConvocatorias] = useState<Record<string, Set<string>>>({})
  const [registro, setRegistro] = useState<Record<string, { rpe: number; minutos: number }>>({})
  const [guardando, setGuardando] = useState(false)

  const convocables = athletes.filter((a) => a.estadoSalud === 'Activo').sort((a, b) => a.nombre.localeCompare(b.nombre))
  const excluidosPorEstado = athletes.filter((a) => a.estadoSalud !== 'Activo')

  const convocadosIds = partido ? (convocatorias[partido.id] ?? new Set<string>()) : new Set<string>()

  function toggleConvocado(athleteId: string) {
    if (!partido) return
    setConvocatorias((prev) => {
      const actual = new Set(prev[partido.id] ?? [])
      if (actual.has(athleteId)) actual.delete(athleteId)
      else actual.add(athleteId)
      return { ...prev, [partido.id]: actual }
    })
  }

  const convocados = convocables.filter((a) => convocadosIds.has(a.id))

  function valorRegistro(athleteId: string): { rpe: number; minutos: number } {
    const clave = `${partido?.id}:${athleteId}`
    if (registro[clave]) return registro[clave]
    const existente = partido
      ? sessionExecutions.find((e) => e.athleteId === athleteId && e.planId === partido.id)
      : undefined
    return { rpe: existente?.rpe ?? 5, minutos: existente?.duracionMin ?? 0 }
  }

  function setValorRegistro(athleteId: string, campo: 'rpe' | 'minutos', valor: number) {
    if (!partido) return
    const clave = `${partido.id}:${athleteId}`
    setRegistro((prev) => ({ ...prev, [clave]: { ...valorRegistro(athleteId), [campo]: valor } }))
  }

  async function handleGuardarRegistro() {
    if (!partido || !activeSeasonId || !activeCategoryId || convocados.length === 0) return
    setGuardando(true)
    try {
      const inputs: ResultadoPartidoInput[] = convocados.map((a) => {
        const v = valorRegistro(a.id)
        return {
          planId: partido.id,
          athleteId: a.id,
          seasonId: activeSeasonId,
          categoryId: activeCategoryId,
          fecha: partido.fecha,
          rpe: v.rpe,
          minutosJugados: v.minutos,
        }
      })
      await submitMatchDayResultsBulk(inputs)
      showToast('success', '¡Registro de partido guardado!')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo guardar el registro de partido.'))
    } finally {
      setGuardando(false)
    }
  }

  if (!activeSeasonId || !activeCategoryId) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Elegí una temporada y una categoría arriba para gestionar el Día de Partido.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">DÍA DE PARTIDO</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Convocatoria y Registro de Minutos — el sRPE del partido se calcula cruzando minutos jugados
          × RPE, por jugador.
        </p>
      </div>

      {partidos.length === 0 ? (
        <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Todavía no hay ninguna sesión tipo "Partido" planificada para esta categoría. Cargá una desde
          PLANIFICADOR primero.
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Partido</span>
            <select
              className={`${inputClass} sm:max-w-xs`}
              value={partido?.id ?? ''}
              onChange={(e) => setPartidoId(e.target.value)}
            >
              {partidos.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatFechaCorta(p.fecha)} — {p.titulo}
                  {p.fecha === fechaHoyLocal() ? ' (hoy)' : ''}
                </option>
              ))}
            </select>
          </Card>

          <Tabs
            tabs={[
              { id: 'convocatoria', label: 'Convocatoria', icon: '📋' },
              { id: 'post-partido', label: 'Post-Partido', icon: '⏱️' },
            ]}
            activeId={tab}
            onChange={(id) => setTab(id as 'convocatoria' | 'post-partido')}
          />

          {tab === 'convocatoria' && (
            <Card className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {convocados.length} convocados de {convocables.length} jugadores elegibles.
              </p>
              <div className="flex flex-col gap-1.5">
                {convocables.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                  >
                    <input
                      type="checkbox"
                      checked={convocadosIds.has(a.id)}
                      onChange={() => toggleConvocado(a.id)}
                      className="h-4 w-4 accent-union-red-600"
                    />
                    <Avatar nombre={a.nombre} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                        {a.nombre}
                      </p>
                      <p className="truncate text-xs text-slate-400">{a.posiciones.join(', ')}</p>
                    </div>
                  </label>
                ))}
              </div>

              {excluidosPorEstado.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-400">
                    No elegibles (Estado Médico) — {excluidosPorEstado.length}
                  </p>
                  {excluidosPorEstado.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-1 opacity-60">
                      <Avatar nombre={a.nombre} size="sm" />
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{a.nombre}</p>
                      <Badge tone={a.estadoSalud === 'Baja Médica' ? 'red' : 'yellow'}>
                        {a.estadoSalud}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === 'post-partido' && (
            <Card className="flex flex-col gap-3">
              {convocados.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Todavía no armaste la convocatoria de este partido — andá a la pestaña Convocatoria
                  primero.
                </p>
              ) : (
                <>
                  <div className="-mx-4 overflow-x-auto px-4">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-400">
                          <th className="pb-2 font-medium">Jugador</th>
                          <th className="pb-2 font-medium">RPE (0-10)</th>
                          <th className="pb-2 font-medium">Minutos jugados</th>
                          <th className="pb-2 font-medium">sRPE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {convocados.map((a) => {
                          const v = valorRegistro(a.id)
                          return (
                            <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                              <td className="py-2 pr-2">
                                <div className="flex items-center gap-2">
                                  <Avatar nombre={a.nombre} size="sm" />
                                  <span className="truncate text-slate-800 dark:text-slate-200">
                                    {a.nombre}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  className={`${inputClass} w-20`}
                                  value={v.rpe}
                                  onChange={(e) => setValorRegistro(a.id, 'rpe', Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={130}
                                  className={`${inputClass} w-24`}
                                  value={v.minutos}
                                  onChange={(e) => setValorRegistro(a.id, 'minutos', Number(e.target.value))}
                                />
                              </td>
                              <td className="py-2 font-semibold text-slate-700 dark:text-slate-300">
                                {v.rpe * v.minutos} AU
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={handleGuardarRegistro}
                    disabled={guardando}
                    className="self-start rounded-lg bg-union-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {guardando ? 'Guardando…' : 'Guardar Registro de Partido'}
                  </button>
                </>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  )
}
