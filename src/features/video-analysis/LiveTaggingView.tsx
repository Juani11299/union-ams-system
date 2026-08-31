import { useState } from 'react'
import { useAppStore, useAthletesActivos, useVideoTagsDeMatch } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import { EVENTOS_TAG, EVENTO_ICONO, EVENTO_LABEL, FASE_POR_EVENTO, FASE_LABEL, formatTimestamp } from './videoAnalysisConstants'
import type { VideoMatch, EventoTipoTag } from '@/types'
import type { VideoPlayerHandle } from './VideoPlayerModule'

interface LiveTaggingViewProps {
  match: VideoMatch
  /** Ref del reproductor activo (`VideoAnalysisView` lo monta una sola vez y lo comparte entre pestañas) — se usa sólo para leer el segundo actual al taggear, nunca para dibujar el video acá. */
  playerRef: React.RefObject<VideoPlayerHandle | null>
}

/**
 * Panel de Tagging en Vivo (Fase 34, Paso 2) — un click en un botón de
 * evento registra automáticamente el segundo exacto del video (leído del
 * reproductor compartido vía `playerRef`), con jugador opcional y nota
 * libre. Funciona igual en vivo (durante el partido) que en diferido
 * (revisando el video ya grabado) — la única diferencia es qué tan cerca
 * del "ahora" está el segundo que se captura.
 */
export function LiveTaggingView({ match, playerRef }: LiveTaggingViewProps) {
  const athletes = useAthletesActivos()
  const tags = useVideoTagsDeMatch(match.id)
  const createVideoTag = useAppStore((s) => s.createVideoTag)
  const deleteVideoTag = useAppStore((s) => s.deleteVideoTag)
  const showToast = useToastStore((s) => s.showToast)

  const [athleteId, setAthleteId] = useState<string>('')
  const [nota, setNota] = useState('')
  const [guardandoTipo, setGuardandoTipo] = useState<EventoTipoTag | null>(null)

  async function taggear(tipo: EventoTipoTag) {
    setGuardandoTipo(tipo)
    try {
      const segundo = playerRef.current?.getCurrentTime() ?? 0
      await createVideoTag({
        matchId: match.id,
        athleteId: athleteId || null,
        tipo,
        fase: FASE_POR_EVENTO[tipo],
        timestampSegundos: segundo,
        nota: nota.trim() || null,
      })
      showToast('success', `${EVENTO_ICONO[tipo]} ${EVENTO_LABEL[tipo]} — ${formatTimestamp(segundo)}`)
      setNota('')
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo registrar el evento.'))
    } finally {
      setGuardandoTipo(null)
    }
  }

  async function handleEliminar(tagId: string) {
    try {
      await deleteVideoTag(tagId)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo eliminar el tag.'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {EVENTOS_TAG.map((evento) => (
          <button
            key={evento.tipo}
            type="button"
            onClick={() => taggear(evento.tipo)}
            disabled={guardandoTipo !== null}
            className="flex flex-col items-center gap-1 rounded-xl bg-union-charcoal py-4 text-white shadow-sm transition-transform hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-2xl">{evento.icono}</span>
            <span className="text-xs font-semibold">{evento.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Jugador (opcional)</span>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Sin asignar</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">Nota (opcional)</span>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Contexto rápido de la jugada…"
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-union-red-500 focus:outline-none focus:ring-1 focus:ring-union-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <p className="text-[11px] text-slate-400">
          El jugador y la nota se aplican al PRÓXIMO evento que taggees — quedan cargados hasta que los cambiés.
        </p>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Eventos registrados ({tags.length})
        </h4>
        {tags.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Todavía no hay eventos taggeados en este video.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {tags.map((tag) => {
              const jugador = athletes.find((a) => a.id === tag.athleteId)
              return (
                <li
                  key={tag.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 font-mono font-semibold text-union-red-600">
                      {formatTimestamp(tag.timestampSegundos)}
                    </span>
                    <span className="shrink-0">{EVENTO_ICONO[tag.tipo]}</span>
                    <span className="truncate text-slate-700 dark:text-slate-300">
                      {EVENTO_LABEL[tag.tipo]}
                      {jugador ? ` — ${jugador.nombre}` : ''}
                      {tag.nota ? ` · "${tag.nota}"` : ''}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      {FASE_LABEL[tag.fase]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminar(tag.id)}
                    aria-label="Eliminar tag"
                    className="shrink-0 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
                  >
                    ✕
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
