import { useEffect, useMemo, useState } from 'react'
import { useAppStore, useAthletesActivos, useVideoTagsDeMatch } from '@/store/useAppStore'
import { useToastStore } from '@/store/useToastStore'
import { getErrorMessage } from '@/utils/errors'
import {
  EVENTOS_TAG,
  EVENTO_ICONO,
  EVENTO_LABEL,
  FASE_LABEL,
  ATAJOS_TECLADO,
  formatTimestamp,
  sugerirContexto,
} from './videoAnalysisConstants'
import { ZonaPicker } from './ZonaPicker'
import type { VideoMatch, VideoTag, EventoTipoTag, ZonaCancha } from '@/types'
import type { VideoPlayerHandle } from './VideoPlayerModule'

interface LiveTaggingViewProps {
  match: VideoMatch
  /** Ref del reproductor activo (`VideoAnalysisView` lo monta una sola vez y lo comparte entre pestañas) — se usa sólo para leer el segundo actual al taggear, nunca para dibujar el video acá. */
  playerRef: React.RefObject<VideoPlayerHandle | null>
  /** Fase 34.2 — click en un tag ya cargado salta a la Pizarra 2D y posiciona la ficha en su zona. */
  onVerEnPizarra: (tag: VideoTag) => void
}

/**
 * Panel de Tagging en Vivo (Fase 34, Paso 2; ampliado en Fase 34.2 con
 * "Smart Context Tagging"): un click en un botón de evento — o su atajo de
 * teclado de una sola letra — registra el segundo exacto, con fase y zona
 * YA PRESUGERIDAS por `sugerirContexto` a partir de los tags recientes del
 * mismo partido. El profe puede aceptar la sugerencia sin tocar nada más,
 * o corregirla con la grilla de zonas antes de confirmar.
 */
export function LiveTaggingView({ match, playerRef, onVerEnPizarra }: LiveTaggingViewProps) {
  const athletes = useAthletesActivos()
  const tags = useVideoTagsDeMatch(match.id)
  const createVideoTag = useAppStore((s) => s.createVideoTag)
  const deleteVideoTag = useAppStore((s) => s.deleteVideoTag)
  const showToast = useToastStore((s) => s.showToast)

  const [athleteId, setAthleteId] = useState<string>('')
  const [nota, setNota] = useState('')
  const [guardandoTipo, setGuardandoTipo] = useState<EventoTipoTag | null>(null)
  const [zonaManual, setZonaManual] = useState<ZonaCancha | null>(null)
  const [ultimaSugerencia, setUltimaSugerencia] = useState<{ tipo: EventoTipoTag; fase: string; motivo: string } | null>(null)

  async function taggear(tipo: EventoTipoTag) {
    setGuardandoTipo(tipo)
    try {
      const segundo = playerRef.current?.getCurrentTime() ?? 0
      const sugerencia = sugerirContexto(tags, segundo, tipo)
      const zona = zonaManual ?? sugerencia.zona
      await createVideoTag({
        matchId: match.id,
        athleteId: athleteId || null,
        tipo,
        fase: sugerencia.fase,
        timestampSegundos: segundo,
        zona,
        nota: nota.trim() || null,
      })
      setUltimaSugerencia({ tipo, fase: FASE_LABEL[sugerencia.fase], motivo: sugerencia.motivo })
      showToast('success', `${EVENTO_ICONO[tipo]} ${EVENTO_LABEL[tipo]} — ${formatTimestamp(segundo)} · ${FASE_LABEL[sugerencia.fase]}`)
      setNota('')
      setZonaManual(null)
    } catch (err) {
      showToast('error', getErrorMessage(err, 'No se pudo registrar el evento.'))
    } finally {
      setGuardandoTipo(null)
    }
  }

  // Atajos de teclado globales de una sola tecla (Fase 34.2, Paso 1) — se
  // desactivan mientras el foco está en un input/textarea/select para no
  // interceptar lo que el profe está escribiendo en la Nota o buscando en
  // el selector de jugador.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const foco = document.activeElement
      const enCampoDeTexto =
        foco instanceof HTMLInputElement || foco instanceof HTMLTextAreaElement || foco instanceof HTMLSelectElement
      if (enCampoDeTexto) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const tipo = ATAJOS_TECLADO[e.key.toUpperCase()]
      if (tipo) {
        e.preventDefault()
        taggear(tipo)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags, athleteId, nota, zonaManual])

  // Sugerencia EN VIVO (antes de tocar ningún botón) — se recalcula sobre
  // un tipo "genérico" sólo para mostrar zona sugerida en la grilla; la
  // fase real se recalcula por tipo exacto recién al taggear.
  const sugerenciaActual = useMemo(() => {
    const segundo = playerRef.current?.getCurrentTime() ?? 0
    return sugerirContexto(tags, segundo, 'transicion')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags, guardandoTipo])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {EVENTOS_TAG.map((evento) => (
          <button
            key={evento.tipo}
            type="button"
            onClick={() => taggear(evento.tipo)}
            disabled={guardandoTipo !== null}
            className="relative flex flex-col items-center gap-1 rounded-xl bg-union-charcoal py-4 text-white shadow-sm transition-transform hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded border border-white/30 text-[10px] font-bold text-white/70">
              {evento.tecla}
            </span>
            <span className="text-2xl">{evento.icono}</span>
            <span className="text-xs font-semibold">{evento.label}</span>
          </button>
        ))}
      </div>
      <p className="-mt-2 text-center text-[10px] text-slate-400">
        Atajos de teclado activos (G/P/R/L/F/T) — no hace falta tocar el mouse mientras mirás el partido.
      </p>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <div className="flex flex-wrap items-start gap-4">
          <label className="flex flex-1 flex-col gap-1 text-xs">
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
          <div className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              Zona {zonaManual ? '(elegida a mano)' : sugerenciaActual.zona ? '(sugerida)' : ''}
            </span>
            <ZonaPicker value={zonaManual} sugerida={sugerenciaActual.zona} onChange={setZonaManual} />
          </div>
        </div>
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
          El jugador, la zona y la nota se aplican al PRÓXIMO evento que taggees — quedan cargados hasta que los
          cambiés. La fase se sugiere sola según lo que pasó en los últimos 5s (Smart Context Tagging).
        </p>
        {ultimaSugerencia && (
          <p className="rounded-lg bg-union-red-50 px-2.5 py-1.5 text-[11px] italic text-union-red-700 dark:bg-union-red-500/10 dark:text-union-red-400">
            🧠 {ultimaSugerencia.motivo}
          </p>
        )}
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
                  <div className="flex shrink-0 items-center gap-1">
                    {tag.zona && (
                      <button
                        type="button"
                        onClick={() => onVerEnPizarra(tag)}
                        title="Ver en Pizarra 2D"
                        className="rounded px-1.5 py-1 text-slate-400 hover:bg-slate-200 hover:text-union-red-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-union-red-400"
                      >
                        📍
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteVideoTag(tag.id).catch((err) => showToast('error', getErrorMessage(err, 'No se pudo eliminar el tag.')))}
                      aria-label="Eliminar tag"
                      className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
