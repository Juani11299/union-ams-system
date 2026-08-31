import { useMemo, useState } from 'react'
import { useAppStore, useAthletesActivos, useVideoMatchesActivos } from '@/store/useAppStore'
import { EVENTO_ICONO, EVENTO_LABEL, FASE_LABEL } from './videoAnalysisConstants'
import { VideoReportExport } from './VideoReportExport'
import type { VideoTag, EventoTipoTag, FaseJuego } from '@/types'

interface PresetPlaylist {
  id: string
  icono: string
  titulo: string
  filtro: (tag: VideoTag) => boolean
}

/**
 * Creador de Smart Playlists (Fase 34.2, Paso 3) — agrupa clips de TODOS
 * los partidos de la categoría activa por concepto (tipo de evento, fase,
 * o jugador), con un solo click, y abre el Informe (`VideoReportExport`,
 * ya generalizado para cruzar varios partidos) con esa lista pre-armada.
 * Son combinaciones fijas de lo que YA se taggea (tipo/fase/jugador) — no
 * inventa una dimensión de datos nueva (ej. "presión rival") que el
 * tagging no captura hoy.
 */
export function SmartPlaylistPanel() {
  const matches = useVideoMatchesActivos()
  const videoTags = useAppStore((s) => s.videoTags)
  const athletes = useAthletesActivos()
  const categories = useAppStore((s) => s.categories)
  const activeCategoryId = useAppStore((s) => s.activeCategoryId)
  const categoriaNombre = categories.find((c) => c.id === activeCategoryId)?.nombre ?? 'Categoría'

  const [athleteId, setAthleteId] = useState<string>('')
  const [playlistActiva, setPlaylistActiva] = useState<{ titulo: string; tags: VideoTag[] } | null>(null)

  const tagsDeLaCategoria = useMemo(() => {
    const idsDeMatches = new Set(matches.map((m) => m.id))
    return videoTags.filter((t) => idsDeMatches.has(t.matchId))
  }, [videoTags, matches])

  const PRESETS_POR_EVENTO: PresetPlaylist[] = (Object.keys(EVENTO_LABEL) as EventoTipoTag[]).map((tipo) => ({
    id: `evento-${tipo}`,
    icono: EVENTO_ICONO[tipo],
    titulo: `Todos los "${EVENTO_LABEL[tipo]}"`,
    filtro: (tag) => tag.tipo === tipo,
  }))

  const PRESETS_POR_FASE: PresetPlaylist[] = (Object.keys(FASE_LABEL) as FaseJuego[]).map((fase) => ({
    id: `fase-${fase}`,
    icono: '🧭',
    titulo: `Todo en "${FASE_LABEL[fase]}"`,
    filtro: (tag) => tag.fase === fase,
  }))

  function generar(preset: PresetPlaylist) {
    const tags = tagsDeLaCategoria.filter(preset.filtro)
    setPlaylistActiva({ titulo: `${preset.icono} ${preset.titulo} — ${categoriaNombre}`, tags })
  }

  function generarPorJugador() {
    if (!athleteId) return
    const jugador = athletes.find((a) => a.id === athleteId)
    const tags = tagsDeLaCategoria.filter((t) => t.athleteId === athleteId)
    setPlaylistActiva({ titulo: `⭐ Todos los eventos de ${jugador?.nombre ?? 'jugador'} — ${categoriaNombre}`, tags })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Por tipo de evento</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS_POR_EVENTO.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => generar(p)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-union-red-300 hover:bg-union-red-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-union-red-500/40 dark:hover:bg-union-red-500/10"
            >
              <span className="text-lg">{p.icono}</span>
              <span className="truncate">{p.titulo}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Por fase del juego</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS_POR_FASE.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => generar(p)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-union-red-300 hover:bg-union-red-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-union-red-500/40 dark:hover:bg-union-red-500/10"
            >
              <span className="text-lg">{p.icono}</span>
              <span className="truncate">{p.titulo}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Por jugador</h4>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="max-w-xs rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Elegí un jugador…</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={generarPorJugador}
            disabled={!athleteId}
            className="rounded-lg bg-union-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-union-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ⭐ Generar Playlist
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Cada Smart Playlist cruza TODOS los partidos de {categoriaNombre} — no sólo el que tenés abierto. Al
        generar una, se abre el Informe con los clips pre-seleccionados, listo para exportar.
      </p>

      {playlistActiva && (
        <VideoReportExport
          titulo={playlistActiva.titulo}
          subtitulo={`${playlistActiva.tags.length} clip(s) encontrados`}
          tags={playlistActiva.tags}
          matches={matches}
          onClose={() => setPlaylistActiva(null)}
        />
      )}
    </div>
  )
}
