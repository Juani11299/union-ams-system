import { useMemo, useState } from 'react'
import { useAppStore, useAthletesActivos, useVideoMatchesActivos } from '@/store/useAppStore'
import { EVENTO_ICONO, EVENTO_LABEL, FASE_LABEL, formatTimestamp } from './videoAnalysisConstants'
import type { VideoMatch, VideoTag, FaseJuego } from '@/types'

interface TagFilterPanelProps {
  /** El profe elige un clip de la lista filtrada → cambia de partido (si hace falta) y salta a ese segundo. */
  onSeleccionarClip: (match: VideoMatch, tag: VideoTag) => void
}

/**
 * Filtros y Búsqueda Táctica (Fase 34, Paso 3) — a diferencia del Tagging en
 * Vivo (scopeado a UN partido), este panel busca a través de TODOS los
 * partidos de la categoría activa: "todos los goles de la temporada",
 * "todas las pérdidas en salida de Fulano" — la Lista de Clips resultante
 * es justo lo que el profe necesita para armar una sesión de video con el
 * plantel sin ir partido por partido.
 */
export function TagFilterPanel({ onSeleccionarClip }: TagFilterPanelProps) {
  const matches = useVideoMatchesActivos()
  const videoTags = useAppStore((s) => s.videoTags)
  const athletes = useAthletesActivos()

  const [matchId, setMatchId] = useState<string>('todos')
  const [fase, setFase] = useState<FaseJuego | 'todas'>('todas')
  const [athleteId, setAthleteId] = useState<string>('todos')

  const matchesPorId = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches])

  const clips = useMemo(() => {
    const idsDeLaCategoria = new Set(matches.map((m) => m.id))
    return videoTags
      .filter((t) => idsDeLaCategoria.has(t.matchId))
      .filter((t) => matchId === 'todos' || t.matchId === matchId)
      .filter((t) => fase === 'todas' || t.fase === fase)
      .filter((t) => athleteId === 'todos' || t.athleteId === athleteId)
      .sort((a, b) => {
        const fechaA = matchesPorId.get(a.matchId)?.fecha ?? ''
        const fechaB = matchesPorId.get(b.matchId)?.fecha ?? ''
        return fechaB.localeCompare(fechaA) || a.timestampSegundos - b.timestampSegundos
      })
  }, [videoTags, matches, matchId, fase, athleteId, matchesPorId])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Partido</span>
          <select
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="todos">Todos los partidos</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Fase del juego</span>
          <select
            value={fase}
            onChange={(e) => setFase(e.target.value as FaseJuego | 'todas')}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="todas">Todas las fases</option>
            {(Object.keys(FASE_LABEL) as FaseJuego[]).map((f) => (
              <option key={f} value={f}>
                {FASE_LABEL[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Jugador</span>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="todos">Todos los jugadores</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Lista de Clips ({clips.length})
        </h4>
        {clips.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Ningún evento coincide con estos filtros.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {clips.map((tag) => {
              const match = matchesPorId.get(tag.matchId)
              const jugador = athletes.find((a) => a.id === tag.athleteId)
              if (!match) return null
              return (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => onSeleccionarClip(match, tag)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-left text-xs transition-colors hover:bg-union-red-50 dark:bg-slate-800/60 dark:hover:bg-union-red-500/10"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 font-mono font-semibold text-union-red-600">
                        {formatTimestamp(tag.timestampSegundos)}
                      </span>
                      <span className="shrink-0">{EVENTO_ICONO[tag.tipo]}</span>
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {EVENTO_LABEL[tag.tipo]}
                        {jugador ? ` — ${jugador.nombre}` : ''}
                      </span>
                    </div>
                    <span className="shrink-0 truncate text-[10px] text-slate-400">{match.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
