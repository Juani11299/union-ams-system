import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { Card } from '@/components/Card'
import { Avatar } from '@/components/Avatar'
import { inputClass } from '@/components/FormField'
import { getErrorMessage } from '@/utils/errors'

export function RosterTab() {
  const seasons = useAppStore((s) => s.seasons)
  const categories = useAppStore((s) => s.categories)
  const athletes = useAppStore((s) => s.athletes)
  const rosters = useAppStore((s) => s.rosters)
  const activeSeasonId = useAppStore((s) => s.activeSeasonId)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const assignAthletesToRoster = useAppStore((s) => s.assignAthletesToRoster)
  const removeAthleteFromRoster = useAppStore((s) => s.removeAthleteFromRoster)
  const showToast = useToastStore((s) => s.showToast)

  const [seasonId, setSeasonId] = useState(activeSeasonId ?? seasons[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState(activeCategoryId ?? categories[0]?.id ?? '')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [asignando, setAsignando] = useState(false)
  const [quitandoId, setQuitandoId] = useState<string | null>(null)

  const rosterActual = useMemo(
    () => rosters.filter((r) => r.season_id === seasonId && r.category_id === categoryId),
    [rosters, seasonId, categoryId],
  )
  const rosterIdPorAtleta = useMemo(
    () => new Map(rosterActual.map((r) => [r.athlete_id, r.id])),
    [rosterActual],
  )

  const filtro = busqueda.trim().toLowerCase()
  const enPlantel = athletes
    .filter((a) => rosterIdPorAtleta.has(a.id))
    .filter((a) => a.nombre.toLowerCase().includes(filtro))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
  const disponibles = athletes
    .filter((a) => !rosterIdPorAtleta.has(a.id))
    .filter((a) => a.nombre.toLowerCase().includes(filtro))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  function toggleSeleccionado(athleteId: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(athleteId)) next.delete(athleteId)
      else next.add(athleteId)
      return next
    })
  }

  async function handleAsignar() {
    if (seleccionados.size === 0 || !seasonId || !categoryId) return
    setAsignando(true)
    try {
      await assignAthletesToRoster({
        seasonId,
        categoryId,
        athleteIds: [...seleccionados],
      })
      showToast('success', `¡${seleccionados.size} jugador(es) asignado(s) exitosamente!`)
      setSeleccionados(new Set())
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo asignar el plantel.'))
    } finally {
      setAsignando(false)
    }
  }

  async function handleQuitar(rosterId: string) {
    setQuitandoId(rosterId)
    try {
      await removeAthleteFromRoster(rosterId)
      showToast('success', 'Jugador quitado del plantel.')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo quitar al jugador.'))
    } finally {
      setQuitandoId(null)
    }
  }

  if (seasons.length === 0 || categories.length === 0) {
    return (
      <Card className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        Primero creá al menos una temporada y una categoría para poder armar un plantel.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Temporada</span>
          <select
            className={inputClass}
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                Temporada {s.year}
                {s.is_active ? ' (actual)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Categoría</span>
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <input
          className={`${inputClass} sm:max-w-[200px]`}
          placeholder="Buscar jugador…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              En el plantel ({enPlantel.length})
            </h2>
          </div>
          {enPlantel.length === 0 ? (
            <p className="text-sm text-slate-400">Todavía no hay jugadores asignados.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {enPlantel.map((athlete) => {
                const rosterId = rosterIdPorAtleta.get(athlete.id)!
                return (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar nombre={athlete.nombre} size="sm" />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {athlete.nombre}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuitar(rosterId)}
                      disabled={quitandoId === rosterId}
                      className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                      {quitandoId === rosterId ? 'Quitando…' : 'Quitar'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Disponibles ({disponibles.length})
            </h2>
            <button
              type="button"
              onClick={handleAsignar}
              disabled={seleccionados.size === 0 || asignando}
              className="rounded-lg bg-union-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {asignando ? 'Asignando…' : `Asignar seleccionados (${seleccionados.size})`}
            </button>
          </div>
          {disponibles.length === 0 ? (
            <p className="text-sm text-slate-400">No hay más jugadores disponibles para asignar.</p>
          ) : (
            <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
              {disponibles.map((athlete) => {
                const activo = seleccionados.has(athlete.id)
                return (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => toggleSeleccionado(athlete.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                      activo
                        ? 'border-union-red-500 bg-union-red-50 dark:bg-union-red-500/10'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <input type="checkbox" readOnly checked={activo} className="pointer-events-none" />
                    <Avatar nombre={athlete.nombre} size="sm" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {athlete.nombre}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
